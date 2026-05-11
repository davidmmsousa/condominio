export type ExpenseOcrDraft = {
  reference?: string;
  occurred_on?: string;
  amount_euros?: string;
  vendor?: string;
  suggestedCategoryId?: string;
  warnings: string[];
};

const TOTAL_HINT =
  /(total\s*(a\s*)?(pagar|documento|fatura|com\s*iva|geral)?|valor\s*(a\s*)?pagar|importe\s*total|montante\s*total|total\s*€)/i;

const REF_HINT =
  /\b(?:fatura|factura|documento|recibo|ft|fr|fs|fat|fat\.?|n[.ºo°]?\s*(?:de\s*)?doc(?:umento)?)\b[:\s#-]*([A-Z0-9][A-Z0-9\s./-]{2,40})/i;

const REF_INLINE = /\b(FT|FR|FS|FAT)\s*[:\s-]*([A-Z0-9][A-Z0-9./-]{2,30})/i;

const VENDOR_HINT = /^(?:emitente|fornecedor|supplier|vendedor)\b[:\s-]+(.+)$/i;

const AMOUNT_RE = /(?:€\s*)?(\d{1,3}(?:\.\d{3})*|\d+),(\d{2})(?:\s*€)?/g;

function normalizeLines(text: string): string[] {
  return text
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function toIsoDate(y: number, m: number, d: number): string | null {
  if (y < 2000 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseDateToken(token: string): string | null {
  const iso = token.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return toIsoDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const dmy = token.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (dmy) {
    let y = Number(dmy[3]);
    if (y < 100) y += 2000;
    return toIsoDate(y, Number(dmy[2]), Number(dmy[1]));
  }
  return null;
}

function extractDate(lines: string[]): string | undefined {
  for (const line of lines) {
    if (!/(data|emiss|documento|fatura)/i.test(line)) continue;
    const tokens = line.match(/\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}-\d{2}-\d{2}/g);
    if (!tokens) continue;
    for (const t of tokens) {
      const iso = parseDateToken(t);
      if (iso) return iso;
    }
  }

  const found: string[] = [];
  for (const line of lines) {
    for (const t of line.match(/\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}-\d{2}-\d{2}/g) ?? []) {
      const iso = parseDateToken(t);
      if (iso) found.push(iso);
    }
  }
  return found.sort().at(-1);
}

function amountCentsFromMatch(intPart: string, decPart: string): number {
  const euros = Number(intPart.replace(/\./g, "") + "." + decPart);
  return Math.round(euros * 100);
}

function extractAmountCents(lines: string[]): number | undefined {
  let best: { cents: number; score: number } | null = null;

  for (const line of lines) {
    const lower = line.toLowerCase();
    const totalish = TOTAL_HINT.test(lower);
    let m: RegExpExecArray | null;
    AMOUNT_RE.lastIndex = 0;
    while ((m = AMOUNT_RE.exec(line)) !== null) {
      const cents = amountCentsFromMatch(m[1], m[2]);
      if (cents <= 0) continue;
      const score = (totalish ? 1000 : 0) + cents;
      if (!best || score > best.score) best = { cents, score };
    }
  }

  if (best) return best.cents;

  for (const line of lines) {
    let m: RegExpExecArray | null;
    AMOUNT_RE.lastIndex = 0;
    while ((m = AMOUNT_RE.exec(line)) !== null) {
      const cents = amountCentsFromMatch(m[1], m[2]);
      if (cents > 0 && (!best || cents > best.cents)) best = { cents, score: cents };
    }
  }

  return best?.cents;
}

function formatEurosInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function extractReference(lines: string[]): string | undefined {
  for (const line of lines) {
    const m = line.match(REF_HINT);
    if (m?.[1]) return m[1].replace(/\s+/g, " ").trim();
    const inline = line.match(REF_INLINE);
    if (inline) return `${inline[1]} ${inline[2]}`.trim();
  }
  return undefined;
}

function extractVendor(lines: string[]): string | undefined {
  for (const line of lines) {
    const m = line.match(VENDOR_HINT);
    if (m?.[1]) return m[1].replace(/\s+/g, " ").trim().slice(0, 120);
  }

  for (const line of lines.slice(0, 12)) {
    if (line.length < 4 || line.length > 80) continue;
    if (/^\d/.test(line)) continue;
    if (/@|https?:|www\./i.test(line)) continue;
    if (/^(fatura|factura|recibo|documento|original|duplicado|exmo|exma)/i.test(line)) continue;
    if (/nif|contribuinte|atcud|iban|swift/i.test(line)) continue;
    return line.slice(0, 120);
  }
  return undefined;
}

function suggestCategoryId(
  text: string,
  categories: Array<{ id: string; name: string }>,
): string | undefined {
  const hay = text.toLowerCase();
  let best: { id: string; len: number } | null = null;
  for (const c of categories) {
    const name = c.name.trim().toLowerCase();
    if (name.length < 3) continue;
    if (hay.includes(name) && (!best || name.length > best.len)) {
      best = { id: c.id, len: name.length };
    }
  }
  return best?.id;
}

export function parseExpenseInvoiceText(
  rawText: string,
  categories: Array<{ id: string; name: string }> = [],
): ExpenseOcrDraft {
  const warnings: string[] = [];
  const lines = normalizeLines(rawText);
  const compact = lines.join("\n");

  if (!compact.trim()) {
    return { warnings: ["Não foi possível extrair texto legível do ficheiro."] };
  }

  const reference = extractReference(lines);
  const occurred_on = extractDate(lines);
  const amountCents = extractAmountCents(lines);
  const vendor = extractVendor(lines);
  const suggestedCategoryId = suggestCategoryId(compact, categories);

  if (!reference) warnings.push("Referência da fatura não detetada automaticamente.");
  if (!occurred_on) warnings.push("Data da fatura não detetada automaticamente.");
  if (amountCents === undefined) warnings.push("Valor total não detetado automaticamente.");
  if (!vendor) warnings.push("Fornecedor não detetado automaticamente.");
  if (!suggestedCategoryId) warnings.push("Confirma a rubrica manualmente.");

  return {
    reference,
    occurred_on,
    amount_euros: amountCents !== undefined ? formatEurosInput(amountCents) : undefined,
    vendor,
    suggestedCategoryId,
    warnings,
  };
}
