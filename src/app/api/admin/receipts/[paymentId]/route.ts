import { getReceiptHeaderSubline } from "@/lib/receipts/receiptHeaderSubline";
import { ensureSingletonCondominiumId } from "@/lib/singletonCondominium";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { renderReceiptPdf } from "@/lib/receipts/receiptPdf";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function monthLabelPt(isoDate: string | null | undefined): string {
  if (!isoDate) return "";
  const d = new Date(isoDate.includes("T") ? isoDate : `${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  const s = d.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function GET(_req: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  if (!paymentId?.length) return NextResponse.json({ error: "ID em falta." }, { status: 400 });

  const supabase = await createServerRouteSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Proibido" }, { status: 403 });

  let cid: string;
  try {
    cid = await ensureSingletonCondominiumId(supabase);
  } catch {
    return NextResponse.json({ error: "Condomínio em falta." }, { status: 500 });
  }

  const { data: payment, error: pErr } = await supabase
    .from("payments")
    .select("id, paid_at, amount_cents, method, note, unit_id, condominium_id, units ( code )")
    .eq("id", paymentId)
    .eq("condominium_id", cid)
    .maybeSingle();

  if (pErr || !payment) return NextResponse.json({ error: "Pagamento não encontrado." }, { status: 404 });

  type UnitRow = { code: string };
  const unitCode = (payment.units as unknown as UnitRow | null)?.code ?? "?";

  const { data: condo } = await supabase.from("condominiums").select("name").eq("id", cid).maybeSingle();

  const { data: resident } = await supabase
    .from("residents")
    .select("full_name, email")
    .eq("unit_id", payment.unit_id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const payerName = resident?.full_name?.trim() || `Condómino (${unitCode})`;
  const payerEmail = resident?.email?.trim() || null;

  type ChargeEmbed = {
    reference_month: string | null;
    kind: string;
    charge_projects: { title: string } | null;
  };

  const { data: allocs, error: aErr } = await supabase
    .from("payment_allocations")
    .select("applied_cents, charges ( reference_month, kind, charge_projects ( title ) )")
    .eq("payment_id", paymentId);

  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });

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
  const remainder = payment.amount_cents - allocatedSum;
  if (remainder > 0) {
    lines.push({
      label: "Valor não aplicado a quotas (crédito / conta corrente)",
      amountCents: remainder,
    });
  }

  if (lines.length === 0) {
    lines.push({
      label: "Pagamento (sem cobranças em aberto para alocar)",
      amountCents: payment.amount_cents,
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

  const y = new Date(payment.paid_at).getFullYear();
  const receiptNumber = `R/${y}/${payment.id.slice(0, 8).toUpperCase()}`;

  const pdf = await renderReceiptPdf({
    condominiumHeaderSubline: getReceiptHeaderSubline(),
    condominiumName: condo?.name?.trim() || "Condomínio",
    receiptNumber,
    issuedAtIso: payment.paid_at,
    payerName,
    payerEmail,
    unitCode,
    amountCents: payment.amount_cents,
    lines,
    periodSummary,
    paymentMethod: payment.method,
    paymentNote: payment.note,
  });

  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="recibo-${payment.id.slice(0, 8)}.pdf"`,
    },
  });
}
