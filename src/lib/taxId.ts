/** Normaliza NIF português (9 dígitos). String vazia → null. */
export function parseOptionalPtTaxId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/^PT/i, "").replace(/\D/g, "");
  if (digits.length !== 9) {
    throw new Error("O n.º de contribuinte (NIF) deve ter 9 dígitos.");
  }
  return digits;
}
