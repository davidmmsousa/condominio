import type { SupabaseClient } from "@supabase/supabase-js";
import { computeFifoAppliedPerPayment, type ChargeFifo } from "@/lib/billing/fifoApply";
import { getReceiptCondominiumTaxId } from "@/lib/receipts/receiptCondominiumTaxId";
import { getReceiptHeaderSubline } from "@/lib/receipts/receiptHeaderSubline";
import { inferProvisionalCorrenteMonths } from "@/lib/receipts/receiptInferMonths";
import {
  formatReceiptPeriodSummary,
  sortReferenceMonthsChronologically,
} from "@/lib/receipts/receiptPeriodSummary";
import { renderReceiptPdf } from "@/lib/receipts/receiptPdf";

function monthLabelPt(isoDate: string | null | undefined): string {
  if (!isoDate) return "";
  const d = new Date(isoDate.includes("T") ? isoDate : `${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  const s = d.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type UnitChargeRow = {
  id: string;
  reference_month: string | null;
  kind: string;
  due_date: string;
  amount_cents: number;
  charge_projects: { title: string } | null;
};

type PaymentRow = {
  id: string;
  paid_at: string;
  amount_cents: number;
  method: string | null;
  note: string | null;
  unit_id: string;
  units: { code: string } | null;
};

/**
 * Gera o PDF do recibo para um pagamento já persistido.
 * O detalhe e o descritivo usam imputação FIFO por fração (inclui ano pago antecipadamente).
 */
export async function buildReceiptPdfForPayment(
  supabase: SupabaseClient,
  paymentId: string,
  condominiumId: string,
): Promise<{
  pdf: Uint8Array;
  receiptNumber: string;
  residentEmail: string | null;
  payerName: string;
  unitCode: string;
}> {
  const { data: payment, error: pErr } = await supabase
    .from("payments")
    .select("id, paid_at, amount_cents, method, note, unit_id, condominium_id, units ( code )")
    .eq("id", paymentId)
    .eq("condominium_id", condominiumId)
    .maybeSingle();

  if (pErr || !payment) {
    throw new Error(pErr?.message ?? "Pagamento não encontrado.");
  }

  const p = payment as unknown as PaymentRow;
  const unitCode = p.units?.code ?? "?";

  const { data: condo } = await supabase.from("condominiums").select("name").eq("id", condominiumId).maybeSingle();

  const { data: resident } = await supabase
    .from("residents")
    .select("full_name, email, tax_id")
    .eq("unit_id", p.unit_id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const payerName = resident?.full_name?.trim() || `Condómino (${unitCode})`;
  const residentEmail = resident?.email?.trim() || null;
  const payerTaxId = resident?.tax_id?.trim() || null;

  const { data: unitCharges, error: chErr } = await supabase
    .from("charges")
    .select("id, reference_month, kind, due_date, amount_cents, charge_projects ( title )")
    .eq("unit_id", p.unit_id)
    .eq("condominium_id", condominiumId)
    .order("due_date", { ascending: true });

  if (chErr) throw new Error(chErr.message);

  const { data: unitPayments, error: payErr } = await supabase
    .from("payments")
    .select("id, amount_cents, paid_at")
    .eq("unit_id", p.unit_id)
    .eq("condominium_id", condominiumId)
    .order("paid_at", { ascending: true });

  if (payErr) throw new Error(payErr.message);

  const chargeRows = (unitCharges ?? []) as unknown as UnitChargeRow[];
  const fifoCharges: ChargeFifo[] = chargeRows.map((c) => ({
    id: c.id,
    amount_cents: c.amount_cents,
    due_date: c.due_date,
    kind: c.kind as "corrente" | "extraordinaria",
  }));

  const fifoByPayment = computeFifoAppliedPerPayment(
    fifoCharges,
    (unitPayments ?? []).map((row) => ({
      id: row.id as string,
      amount_cents: row.amount_cents as number,
      paid_at: row.paid_at as string,
    })),
  );

  const appliedToCharges = fifoByPayment.get(paymentId) ?? new Map<string, number>();
  const chargeById = new Map(chargeRows.map((c) => [c.id, c]));

  const correnteLines: Array<{ month: string; amountCents: number }> = [];
  const otherLines: Array<{ label: string; amountCents: number }> = [];
  const monthKeys: string[] = [];

  for (const [chargeId, applied] of appliedToCharges) {
    if (applied <= 0) continue;
    const ch = chargeById.get(chargeId);
    if (!ch) continue;

    if (ch.kind === "corrente" && ch.reference_month) {
      const month = ch.reference_month.slice(0, 10);
      monthKeys.push(month);
      correnteLines.push({ month, amountCents: applied });
      continue;
    }

    if (ch.kind === "extraordinaria") {
      const t = ch.charge_projects?.title?.trim();
      otherLines.push({
        label: t ? `Extraordinária — ${t}` : "Cobrança extraordinária",
        amountCents: applied,
      });
    } else {
      otherLines.push({ label: "Cobrança", amountCents: applied });
    }
  }

  correnteLines.sort((a, b) => a.month.localeCompare(b.month));

  let allocatedSum = correnteLines.reduce((s, r) => s + r.amountCents, 0) + otherLines.reduce((s, l) => s + l.amountCents, 0);
  let remainder = p.amount_cents - allocatedSum;

  if (remainder > 0 && correnteLines.length > 0) {
    const amounts = [...new Set(correnteLines.map((r) => r.amountCents))];
    if (amounts.length === 1) {
      const provisional = inferProvisionalCorrenteMonths({
        allocatedMonths: monthKeys,
        remainderCents: remainder,
        quotaCents: amounts[0]!,
        paymentNote: p.note,
      });
      for (const row of provisional) {
        monthKeys.push(row.month);
        correnteLines.push(row);
        allocatedSum += row.amountCents;
      }
      correnteLines.sort((a, b) => a.month.localeCompare(b.month));
      remainder = p.amount_cents - allocatedSum;
    }
  }

  const lines: Array<{ label: string; amountCents: number }> = correnteLines.map((row) => ({
    label: `Quota ${monthLabelPt(row.month)}`,
    amountCents: row.amountCents,
  }));
  lines.push(...otherLines);

  if (remainder > 0) {
    lines.push({
      label: "Valor não aplicado a quotas (crédito / conta corrente)",
      amountCents: remainder,
    });
  }

  if (lines.length === 0) {
    lines.push({
      label: "Pagamento (sem cobranças em aberto para alocar)",
      amountCents: p.amount_cents,
    });
  }

  const sortedMonthKeys = sortReferenceMonthsChronologically(monthKeys);
  let periodSummary = formatReceiptPeriodSummary(sortedMonthKeys);
  if (!periodSummary && allocatedSum > 0) {
    periodSummary = "Inclui pagamentos aplicados a cobranças sem mês de referência.";
  } else if (!periodSummary) {
    periodSummary = "Pagamento registado sem alocação a quotas mensais.";
  }

  const y = new Date(p.paid_at).getFullYear();
  const receiptNumber = `R/${y}/${p.id.slice(0, 8).toUpperCase()}`;

  const pdf = await renderReceiptPdf({
    condominiumHeaderSubline: getReceiptHeaderSubline(),
    condominiumTaxId: getReceiptCondominiumTaxId(),
    condominiumName: condo?.name?.trim() || "Condomínio",
    receiptNumber,
    issuedAtIso: p.paid_at,
    payerName,
    payerEmail: residentEmail,
    payerTaxId,
    unitCode,
    amountCents: p.amount_cents,
    lines,
    periodSummary,
    paymentMethod: p.method,
    paymentNote: p.note,
  });

  return { pdf, receiptNumber, residentEmail, payerName, unitCode };
}
