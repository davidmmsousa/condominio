/**
 * Reparte `totalCents` por permilagens usando restos maiores (soma exacta em cêntimos).
 */
export function splitTotalCentsByPermilages(permilages: number[], totalCents: number): number[] {
  if (permilages.length === 0) throw new Error("Não há frações.");
  const sumP = permilages.reduce((a, b) => a + b, 0);
  if (sumP <= 0) throw new Error("Soma das permilagens inválida.");

  const exact = permilages.map((p) => (totalCents * p) / sumP);
  const floors = exact.map(Math.floor);
  let remainder = totalCents - floors.reduce((a, b) => a + b, 0);
  const byFrac = exact
    .map((e, i) => ({ i, r: e - Math.floor(e) }))
    .sort((a, b) => b.r - a.r);
  const out = [...floors];
  for (let j = 0; j < remainder; j++) {
    out[byFrac[j].i]++;
  }
  return out;
}
