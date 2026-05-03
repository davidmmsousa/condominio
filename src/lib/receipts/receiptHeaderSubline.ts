/** Linha por baixo do título "Recibo" no PDF. Override com env `RECEIPT_HEADER_SUBLINE` (Vercel / .env.local). */
export function getReceiptHeaderSubline(): string {
  return (
    process.env.RECEIPT_HEADER_SUBLINE?.trim() ||
    "Condomínio - Rua Vincennes n7 CP: 2300-381 Tomar"
  );
}
