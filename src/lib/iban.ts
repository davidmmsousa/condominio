/** Normaliza IBAN português (25 caracteres: PT + 23 dígitos). Vazio → null. */
export function parseOptionalPtIban(raw: string): string | null {
  const normalized = raw.replace(/\s/g, "").toUpperCase();
  if (!normalized) return null;
  if (!/^PT\d{23}$/.test(normalized)) {
    throw new Error("IBAN inválido. Usa o formato português (ex.: PT50…, 25 caracteres).");
  }
  return normalized;
}
