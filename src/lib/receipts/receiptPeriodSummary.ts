function monthLabelPt(isoDate: string): string {
  const d = new Date(isoDate.includes("T") ? isoDate : `${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  const s = d.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function monthNameOnly(isoDate: string): string {
  const d = new Date(`${isoDate.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  const s = d.toLocaleDateString("pt-PT", { month: "long" });
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

function formatMonthsListPt(monthsYmd: string[]): string {
  const names = monthsYmd.map(monthNameOnly).filter(Boolean);
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
}

/** Texto do período coberto no recibo, com lista explícita de todos os meses pagos. */
export function formatReceiptPeriodSummary(monthKeys: string[]): string | undefined {
  const unique = [...new Set(monthKeys.map((k) => k.slice(0, 10)))].sort();
  if (unique.length === 0) return undefined;

  const monthsList = formatMonthsListPt(unique);
  const indices = unique.map(monthIndexFromRef);
  const isConsecutive = indices.every((v, i) => i === 0 || v === indices[i - 1] + 1);

  let head: string;
  if (unique.length === 1) {
    head = `Período coberto: ${monthLabelPt(unique[0])}.`;
  } else if (isConsecutive && isFullCalendarYear(unique)) {
    head = `Período coberto: quotas de janeiro a dezembro de ${unique[0].slice(0, 4)} (${unique.length} meses).`;
  } else if (isConsecutive) {
    head = `Período coberto: quotas de ${monthLabelPt(unique[0])} a ${monthLabelPt(unique[unique.length - 1])} (${unique.length} meses).`;
  } else {
    head = `Período coberto: ${unique.length} meses.`;
  }

  return `${head}\nMeses pagos: ${monthsList}.`;
}
