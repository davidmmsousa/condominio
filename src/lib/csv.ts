export function csvEscape(value: string | number | null | undefined): string {
  const s =
    value === null || value === undefined
      ? ""
      : typeof value === "number" && Number.isFinite(value)
        ? String(value)
        : String(value);
  if (/[\r\n",]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function rowsToCsv(rows: string[][]): string {
  return rows.map((r) => r.map((c) => csvEscape(c)).join(",")).join("\r\n");
}
