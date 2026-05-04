export type TreasuryBookKind = "numerario" | "conta_ordem" | "conta_prazo";

export type ExpenseFunding = TreasuryBookKind | "morador";

export const TREASURY_BOOK_LABELS: Record<TreasuryBookKind, string> = {
  numerario: "Numerário",
  conta_ordem: "Conta à ordem",
  conta_prazo: "Conta a prazo",
};

export const EXPENSE_FUNDING_LABELS: Record<ExpenseFunding, string> = {
  numerario: "Numerário do condomínio",
  conta_ordem: "Conta bancária à ordem",
  conta_prazo: "Conta a prazo / depósito",
  morador: "Pago por morador (acerto na conta corrente)",
};
