function monthLabelPt(isoDate: string): string {
  const d = new Date(isoDate.includes("T") ? isoDate : `${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  const s = d.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function monthIndexFromRef(ymd: string): number {
  const y = Number(ymd.slice(0, 4));
  const m = Number(ymd.slice(5, 7));
  return y * 12 + (m - 1);
}

function isFullCalendarYear(months: string[]): boolean {
  if (months.length !== 12) return false;
  const year = months[0].slice(0, 4);
  if (!months.every((m) => m.startsWith(`${year}-`))) return false;
  for (let i = 1; i <= 12; i++) {
    const expected = `${year}-${String(i).padStart(2, "0")}-01`;
    if (!months.includes(expected)) return false;
  }
  return true;
}

/** Texto do período coberto no recibo (quotas correntes com mês de referência). */
export function formatReceiptPeriodSummary(monthKeys: string[]): string | undefined {
  const unique = [...new Set(monthKeys.map((k) => k.slice(0, 10)))].sort();
  if (unique.length === 0) return undefined;

  if (unique.length === 1) {
    return `Período coberto: ${monthLabelPt(unique[0])}.`;
  }

  const indices = unique.map(monthIndexFromRef);
  const isConsecutive = indices.every((v, i) => i === 0 || v === indices[i - 1] + 1);

  if (isConsecutive) {
    const year = unique[0].slice(0, 4);
    if (isFullCalendarYear(unique)) {
      return `Período coberto: quotas de janeiro a dezembro de ${year}.`;
    }
    return `Período coberto: quotas de ${monthLabelPt(unique[0])} a ${monthLabelPt(unique[unique.length - 1])}.`;
  }

  const labels = unique.map(monthLabelPt).filter(Boolean);
  return `Períodos cobertos: ${labels.join(", ")}.`;
}

/** Uma linha agregada no detalhe do recibo quando há vários meses consecutivos (ex.: ano completo). */
export function correnteReceiptLineLabel(monthKeys: string[]): string | null {
  const unique = [...new Set(monthKeys.map((k) => k.slice(0, 10)))].sort();
  if (unique.length < 3) return null;

  const indices = unique.map(monthIndexFromRef);
  const isConsecutive = indices.every((v, i) => i === 0 || v === indices[i - 1] + 1);
  if (!isConsecutive) return null;

  const year = unique[0].slice(0, 4);
  if (isFullCalendarYear(unique)) {
    return `Quotas mensais — janeiro a dezembro de ${year}`;
  }
  return `Quotas mensais — ${monthLabelPt(unique[0])} a ${monthLabelPt(unique[unique.length - 1])}`;
}
