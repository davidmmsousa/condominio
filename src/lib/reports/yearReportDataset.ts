import type { SupabaseClient } from "@supabase/supabase-js";

type U = { code: string };

export type YearReportChargeRow = {
  id: string;
  due_date: string;
  kind: string;
  reference_month: string | null;
  amount_cents: number;
  units: U | null;
};

export type YearReportPaymentRow = {
  id: string;
  paid_at: string;
  amount_cents: number;
  method: string | null;
  note: string | null;
  received_in: string | null;
  units: U | null;
};

export type YearReportExpenseRow = {
  id: string;
  occurred_on: string;
  amount_cents: number;
  vendor: string | null;
  note: string | null;
  paid_from: string | null;
  payer_unit_id: string | null;
  expense_categories: { name: string } | null;
};

export type YearReportSummaryRow = {
  code: string;
  charged: number;
  paid: number;
};

export type YearReportDataset = {
  chargeRows: YearReportChargeRow[];
  payRows: YearReportPaymentRow[];
  expRows: YearReportExpenseRow[];
  summaryRows: YearReportSummaryRow[];
  unitCodeById: Map<string, string>;
};

/**
 * Dados agregados para relatórios anuais (ano civil 1 jan – 31 dez).
 * Cobranças por `due_date`; pagamentos por `paid_at`; despesas por `occurred_on`.
 */
export async function fetchYearReportDataset(
  supabase: SupabaseClient,
  condominiumId: string,
  year: number,
): Promise<YearReportDataset> {
  const paidStartIso = `${year}-01-01T00:00:00.000Z`;
  const paidEndExclusiveIso = `${year + 1}-01-01T00:00:00.000Z`;

  const { data: chargeRowsRaw, error: chErr } = await supabase
    .from("charges")
    .select("id, due_date, kind, reference_month, amount_cents, units ( code )")
    .eq("condominium_id", condominiumId)
    .gte("due_date", `${year}-01-01`)
    .lte("due_date", `${year}-12-31`)
    .order("due_date", { ascending: true });

  if (chErr) throw new Error(chErr.message);

  const { data: payRowsRaw, error: pErr } = await supabase
    .from("payments")
    .select("id, paid_at, amount_cents, method, note, received_in, units ( code )")
    .eq("condominium_id", condominiumId)
    .gte("paid_at", paidStartIso)
    .lt("paid_at", paidEndExclusiveIso)
    .order("paid_at", { ascending: true });

  if (pErr) throw new Error(pErr.message);

  const { data: unitRowsForExp, error: uexpErr } = await supabase
    .from("units")
    .select("id, code")
    .eq("condominium_id", condominiumId);

  if (uexpErr) throw new Error(uexpErr.message);
  const unitCodeById = new Map((unitRowsForExp ?? []).map((u: { id: string; code: string }) => [u.id, u.code]));

  const { data: expRowsRaw, error: expErr } = await supabase
    .from("expenses")
    .select("id, occurred_on, amount_cents, vendor, note, paid_from, payer_unit_id, expense_categories(name)")
    .eq("condominium_id", condominiumId)
    .gte("occurred_on", `${year}-01-01`)
    .lte("occurred_on", `${year}-12-31`)
    .order("occurred_on", { ascending: true });

  if (expErr) throw new Error(expErr.message);

  const chargeRows = (chargeRowsRaw ?? []) as unknown as YearReportChargeRow[];
  const payRows = (payRowsRaw ?? []) as unknown as YearReportPaymentRow[];
  const expRows = (expRowsRaw ?? []) as unknown as YearReportExpenseRow[];

  const sums = new Map<string, { code: string; charged: number; paid: number }>();

  for (const r of chargeRows) {
    const code = r.units?.code ?? "?";
    const cur = sums.get(code) ?? { code, charged: 0, paid: 0 };
    cur.charged += r.amount_cents;
    sums.set(code, cur);
  }
  for (const r of payRows) {
    const code = r.units?.code ?? "?";
    const cur = sums.get(code) ?? { code, charged: 0, paid: 0 };
    cur.paid += r.amount_cents;
    sums.set(code, cur);
  }

  const summaryRows = Array.from(sums.values()).sort((a, b) => a.code.localeCompare(b.code));

  return { chargeRows, payRows, expRows, summaryRows, unitCodeById };
}
