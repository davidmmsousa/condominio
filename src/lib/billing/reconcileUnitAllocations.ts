import type { SupabaseClient } from "@supabase/supabase-js";
import { allocatePaymentCurrentFirst } from "@/lib/billing/allocatePayment";

const DELETE_IN_CHUNK = 150;

export type ReconcileUnitResult = {
  paymentsProcessed: number;
  allocationsCreated: number;
  remainingTotalCents: number;
};

/**
 * Apaga todas as `payment_allocations` dos pagamentos desta fração e volta a imputar
 * por ordem de `paid_at`, com a mesma regra que ao registar pagamento (FIFO corrente → extraordinária).
 */
export async function reconcilePaymentAllocationsForUnit(
  supabase: SupabaseClient,
  args: { condominiumId: string; unitId: string },
): Promise<ReconcileUnitResult> {
  const { data: payments, error: pe } = await supabase
    .from("payments")
    .select("id, amount_cents, paid_at, condominium_id")
    .eq("unit_id", args.unitId)
    .eq("condominium_id", args.condominiumId);

  if (pe) throw pe;

  const rows = (payments ?? []) as Array<{
    id: string;
    amount_cents: number;
    paid_at: string;
    condominium_id: string;
  }>;

  rows.sort((a, b) => a.paid_at.localeCompare(b.paid_at) || a.id.localeCompare(b.id));

  const paymentIds = rows.map((p) => p.id);
  for (let i = 0; i < paymentIds.length; i += DELETE_IN_CHUNK) {
    const chunk = paymentIds.slice(i, i + DELETE_IN_CHUNK);
    if (!chunk.length) continue;
    const { error: de } = await supabase.from("payment_allocations").delete().in("payment_id", chunk);
    if (de) throw de;
  }

  let allocationsCreated = 0;
  let remainingTotalCents = 0;

  for (const p of rows) {
    const { remainingCents, allocations } = await allocatePaymentCurrentFirst(supabase, {
      paymentId: p.id,
      condominiumId: p.condominium_id ?? args.condominiumId,
      unitId: args.unitId,
      amountCents: p.amount_cents,
    });
    allocationsCreated += allocations.length;
    remainingTotalCents += remainingCents;
  }

  return {
    paymentsProcessed: rows.length,
    allocationsCreated,
    remainingTotalCents,
  };
}
