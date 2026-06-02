/** Meses do ano civil ainda sem quota gerada na base, por ordem cronológica. */
export function missingCalendarMonthsInYear(allocatedMonths: string[], year: number): string[] {
  const allocatedSet = new Set(allocatedMonths.map((m) => m.slice(0, 10)));
  const missing: string[] = [];
  for (let m = 1; m <= 12; m++) {
    const key = `${year}-${String(m).padStart(2, "0")}-01`;
    if (!allocatedSet.has(key)) missing.push(key);
  }
  return missing;
}

/**
 * Quando o pagamento cobre o ano mas faltam quotas na base (ex.: só jan–jun gerados),
 * reparte o excedente em linhas de quota pelos meses em falta (nota «ano completo»).
 */
export function inferProvisionalCorrenteMonths(args: {
  allocatedMonths: string[];
  remainderCents: number;
  quotaCents: number;
  paymentNote: string | null;
}): Array<{ month: string; amountCents: number }> {
  const { allocatedMonths, remainderCents, quotaCents, paymentNote } = args;
  if (remainderCents <= 0 || quotaCents <= 0 || remainderCents % quotaCents !== 0) return [];
  const count = remainderCents / quotaCents;
  if (count <= 0) return [];

  const note = paymentNote ?? "";
  if (!/ano\s+completo/i.test(note)) return [];

  const noteYear = note.match(/20\d{2}/)?.[0];
  const year = noteYear
    ? Number(noteYear)
    : allocatedMonths.length
      ? Number(allocatedMonths[0].slice(0, 4))
      : NaN;
  if (!Number.isFinite(year)) return [];

  const missing = missingCalendarMonthsInYear(allocatedMonths, year);
  if (missing.length < count) return [];

  return missing.slice(0, count).map((month) => ({ month, amountCents: quotaCents }));
}
