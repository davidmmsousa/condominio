/** Converte texto com vírgula ou ponto (ex.: "12,50" ou "12.5") para cêntimos inteiros. */
export function parseEurosToCents(raw: string): number {
  const s = raw.replace(/\s/g, "").replace(",", ".");
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error("Valor em euros inválido.");
  }
  return Math.round(n * 100);
}

export function formatCents(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}
