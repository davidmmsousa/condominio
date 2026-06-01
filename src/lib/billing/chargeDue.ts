/** Data de hoje em Europe/Lisbon (YYYY-MM-DD). */
export function todayInLisbonYmd(now = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "Europe/Lisbon" });
}

/** Cobrança entra no saldo em dívida a partir do dia de vencimento (inclusive). */
export function isChargeDueForArrears(dueDateYmd: string, todayYmd = todayInLisbonYmd()): boolean {
  const due = dueDateYmd.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) return true;
  return due <= todayYmd;
}
