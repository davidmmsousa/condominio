import type { SupabaseClient } from "@supabase/supabase-js";

type ChargeRow = {
  id: string;
  amount_cents: number;
  due_date: string;
  kind: "corrente" | "extraordinaria";
};

export async function allocatePaymentCurrentFirst(
  supabase: SupabaseClient,
  args: {
    paymentId: string;
    condominiumId: string;
    unitId: string;
    amountCents: number;
  },
) {
  const fetchByKind = async (kind: ChargeRow["kind"]) => {
    const { data, error } = await supabase
      .from("charges")
      .select("id, amount_cents, due_date, kind")
      .eq("condominium_id", args.condominiumId)
      .eq("unit_id", args.unitId)
      .eq("kind", kind)
      .order("due_date", { ascending: true });
    if (error) throw error;
    return (data ?? []) as ChargeRow[];
  };

  const charges = [...(await fetchByKind("corrente")), ...(await fetchByKind("extraordinaria"))];

  const chargeIds = charges.map((c) => c.id);
  if (chargeIds.length === 0) {
    return { remainingCents: args.amountCents, allocations: [] as Array<{ chargeId: string; appliedCents: number }> };
  }

  const { data: allocs, error: allocsErr } = await supabase
    .from("payment_allocations")
    .select("charge_id, applied_cents")
    .in("charge_id", chargeIds);

  if (allocsErr) throw allocsErr;

  const appliedByCharge = new Map<string, number>();
  for (const a of allocs ?? []) {
    appliedByCharge.set(a.charge_id, (appliedByCharge.get(a.charge_id) ?? 0) + a.applied_cents);
  }

  let remaining = args.amountCents;
  const toInsert: Array<{ payment_id: string; charge_id: string; applied_cents: number }> = [];
  const appliedOut: Array<{ chargeId: string; appliedCents: number }> = [];

  for (const c of charges) {
    if (remaining <= 0) break;
    const already = appliedByCharge.get(c.id) ?? 0;
    const open = Math.max(0, c.amount_cents - already);
    if (open <= 0) continue;
    const applied = Math.min(open, remaining);
    remaining -= applied;
    toInsert.push({ payment_id: args.paymentId, charge_id: c.id, applied_cents: applied });
    appliedOut.push({ chargeId: c.id, appliedCents: applied });
  }

  if (toInsert.length) {
    const { error: insErr } = await supabase.from("payment_allocations").insert(toInsert);
    if (insErr) throw insErr;
  }

  return { remainingCents: remaining, allocations: appliedOut };
}
