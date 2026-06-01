import { isChargeDueForArrears } from "@/lib/billing/chargeDue";
import { computeFifoAppliedPerCharge } from "@/lib/billing/fifoApply";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ResidentChargeRow = {
  id: string;
  kind: string;
  due_date: string;
  reference_month: string | null;
  amount_cents: number;
  paid: number;
  open: number;
  /** false = quota ainda não vencida (não entra no saldo em dívida). */
  isDue: boolean;
};

export type ResidentPaymentRow = {
  id: string;
  amount_cents: number;
  paid_at: string;
  method: string | null;
  note: string | null;
};

export async function loadResidentAccountSnapshot(
  supabase: SupabaseClient,
  unitId: string,
): Promise<{
  openCents: number;
  upcomingCents: number;
  charges: ResidentChargeRow[];
  payments: ResidentPaymentRow[];
}> {
  const { data: charges } = await supabase
    .from("charges")
    .select("id, amount_cents, due_date, kind, reference_month")
    .eq("unit_id", unitId)
    .order("due_date", { ascending: true });

  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount_cents, paid_at, method, note")
    .eq("unit_id", unitId)
    .order("paid_at", { ascending: true });

  const chargeList = charges ?? [];
  const paymentList = payments ?? [];
  const payRows = paymentList.map((p) => ({ amount_cents: p.amount_cents, paid_at: p.paid_at }));

  const appliedByCharge = computeFifoAppliedPerCharge(
    chargeList.map((c) => ({
      id: c.id,
      amount_cents: c.amount_cents,
      due_date: c.due_date,
      kind: c.kind as "corrente" | "extraordinaria",
    })),
    payRows,
  );

  let openCents = 0;
  let upcomingCents = 0;
  const chargeRows: ResidentChargeRow[] = chargeList.map((c) => {
    const paid = appliedByCharge.get(c.id) ?? 0;
    const open = Math.max(0, c.amount_cents - paid);
    const isDue = isChargeDueForArrears(c.due_date);
    if (open > 0) {
      if (isDue) openCents += open;
      else upcomingCents += open;
    }
    return { ...c, paid, open, isDue };
  });

  return { openCents, upcomingCents, charges: chargeRows, payments: paymentList as ResidentPaymentRow[] };
}

export function receiptNumberForPayment(paymentId: string, paidAtIso: string): string {
  const y = new Date(paidAtIso).getFullYear();
  return `R/${y}/${paymentId.slice(0, 8).toUpperCase()}`;
}
