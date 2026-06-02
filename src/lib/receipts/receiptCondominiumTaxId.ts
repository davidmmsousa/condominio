/** NIF do condomínio (emitente) no PDF do recibo. Override com env `RECEIPT_CONDOMINIUM_TAX_ID`. */
export function getReceiptCondominiumTaxId(): string {
  return process.env.RECEIPT_CONDOMINIUM_TAX_ID?.trim() || "901714925";
}
