import type { SupabaseClient } from "@supabase/supabase-js";
import { getReceiptHeaderSubline } from "@/lib/receipts/receiptHeaderSubline";
import { renderReceiptPdf } from "@/lib/receipts/receiptPdf";

function monthLabelPt(isoDate: string | null | undefined): string {
  if (!isoDate) return "";
  const d = new Date(isoDate.includes("T") ? isoDate : `${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  const s = d.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type ChargeEmbed = {
  reference_month: string | null;
  kind: string;
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
 * Gera o PDF do recibo para um pagamento já persistido (com alocações).
 * Usado pelo GET /api/admin/receipts/[id] e pelo envio automático Gmail.
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

  const { data: allocs, error: aErr } = await supabase
    .from("payment_allocations")
    .select("applied_cents, charges ( reference_month, kind, charge_projects ( title ) )")
    .eq("payment_id", paymentId);

  if (aErr) throw new Error(aErr.message);

  const lines: Array<{ label: string; amountCents: number }> = [];
  const monthKeys: string[] = [];

  for (const row of allocs ?? []) {
    const applied = row.applied_cents as number;
    const ch = row.charges as unknown as ChargeEmbed | null;
    if (!ch || applied <= 0) continue;
    let label: string;
    if (ch.kind === "corrente" && ch.reference_month) {
      label = `Quota ${monthLabelPt(ch.reference_month)}`;
      monthKeys.push(ch.reference_month.slice(0, 10));
    } else if (ch.kind === "extraordinaria") {
      const t = ch.charge_projects?.title?.trim();
      label = t ? `Extraordinária — ${t}` : "Cobrança extraordinária";
    } else {
      label = "Cobrança";
    }
    lines.push({ label, amountCents: applied });
  }

  const allocatedSum = lines.reduce((s, l) => s + l.amountCents, 0);
  const remainder = p.amount_cents - allocatedSum;
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

  const uniqueMonths = [...new Set(monthKeys)].sort();
  let periodSummary: string | undefined;
  if (uniqueMonths.length === 1) {
    periodSummary = `Período coberto: ${monthLabelPt(uniqueMonths[0])}.`;
  } else if (uniqueMonths.length > 1) {
    const labels = uniqueMonths.map(monthLabelPt).filter(Boolean);
    periodSummary = `Períodos cobertos: ${labels.join(", ")}.`;
  } else if (allocatedSum > 0) {
    periodSummary = "Inclui pagamentos aplicados a cobranças sem mês de referência.";
  } else {
    periodSummary = "Pagamento registado sem alocação a quotas mensais.";
  }

  const y = new Date(p.paid_at).getFullYear();
  const receiptNumber = `R/${y}/${p.id.slice(0, 8).toUpperCase()}`;

  const pdf = await renderReceiptPdf({
    condominiumHeaderSubline: getReceiptHeaderSubline(),
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
