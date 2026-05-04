/** Cobrança com o mesmo critério de ordenação que `allocatePaymentCurrentFirst`. */
export type ChargeFifo = {
  id: string;
  amount_cents: number;
  due_date: string;
  kind: "corrente" | "extraordinaria";
};

export function orderChargesForFifo(charges: ChargeFifo[]): ChargeFifo[] {
  const corrente = charges
    .filter((c) => c.kind === "corrente")
    .sort((a, b) => a.due_date.localeCompare(b.due_date) || a.id.localeCompare(b.id));
  const extra = charges
    .filter((c) => c.kind === "extraordinaria")
    .sort((a, b) => a.due_date.localeCompare(b.due_date) || a.id.localeCompare(b.id));
  return [...corrente, ...extra];
}

/**
 * Reproduz o FIFO “corrente primeiro por vencimento, depois extraordinárias”, aplicando
 * cada pagamento por ordem de `paid_at`. Alinha a dívida por cobrança com o saldo global
 * (soma cobranças − soma pagamentos) quando não há crédito a mais; evita divergências
 * quando `payment_allocations` ficou incompleto (ex.: quotas criadas depois dos pagamentos).
 */
export function computeFifoAppliedPerCharge(
  charges: ChargeFifo[],
  payments: Array<{ amount_cents: number; paid_at: string }>,
): Map<string, number> {
  const ordered = orderChargesForFifo(charges);
  const applied = new Map<string, number>();
  for (const c of ordered) applied.set(c.id, 0);

  const pays = [...payments].sort((a, b) => a.paid_at.localeCompare(b.paid_at));
  for (const p of pays) {
    let remaining = p.amount_cents;
    for (const c of ordered) {
      if (remaining <= 0) break;
      const already = applied.get(c.id) ?? 0;
      const open = Math.max(0, c.amount_cents - already);
      if (open <= 0) continue;
      const use = Math.min(open, remaining);
      applied.set(c.id, already + use);
      remaining -= use;
    }
  }
  return applied;
}
