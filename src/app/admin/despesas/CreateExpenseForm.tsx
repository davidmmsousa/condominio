"use client";

import { createExpenseAction, type ActionState } from "@/app/admin/actions";
import type { ExpenseOcrDraft } from "@/lib/ocr/parseExpenseInvoiceText";
import { EXPENSE_FUNDING_LABELS, type ExpenseFunding } from "@/lib/treasury/types";
import { useActionState, useState } from "react";

const fundingKeys = Object.keys(EXPENSE_FUNDING_LABELS) as ExpenseFunding[];

export function CreateExpenseForm({
  categories,
  units,
  initialDraft,
}: {
  categories: { id: string; name: string }[];
  units: Array<{ id: string; code: string }>;
  initialDraft?: ExpenseOcrDraft | null;
}) {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(createExpenseAction, null);
  const [paidFrom, setPaidFrom] = useState<ExpenseFunding>("conta_ordem");
  const [categoryId, setCategoryId] = useState(initialDraft?.suggestedCategoryId ?? "");
  const disabled = pending || categories.length === 0;

  return (
    <form action={action} className="form">
      {initialDraft ? (
        <p className="alert alert--success">
          Campos preenchidos a partir da leitura da fatura. Confirma tudo (sobretudo a rubrica) antes de registar.
        </p>
      ) : null}
      <div className="form-grid">
        <label className="field">
          Rubrica
          <select
            name="category_id"
            required
            disabled={disabled}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">— escolher —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Referência (nº fatura / documento)
          <input
            name="reference"
            required
            disabled={disabled}
            placeholder="Ex.: FT 2025/1042"
            defaultValue={initialDraft?.reference ?? ""}
          />
        </label>
        <label className="field">
          Data da fatura
          <input name="occurred_on" type="date" required disabled={disabled} defaultValue={initialDraft?.occurred_on ?? ""} />
        </label>
        <label className="field">
          Valor (€)
          <input
            name="amount_euros"
            type="text"
            inputMode="decimal"
            required
            disabled={disabled}
            placeholder="ex.: 123,45"
            defaultValue={initialDraft?.amount_euros ?? ""}
          />
        </label>
        <label className="field">
          Quem suportou o custo
          <select
            name="paid_from"
            required
            disabled={disabled}
            value={paidFrom}
            onChange={(e) => setPaidFrom(e.target.value as ExpenseFunding)}
          >
            {fundingKeys.map((k) => (
              <option key={k} value={k}>
                {EXPENSE_FUNDING_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        {paidFrom === "morador" ? (
          <label className="field">
            Fração (encontro de contas na conta corrente)
            <select name="payer_unit_id" required disabled={disabled || units.length === 0}>
              <option value="">— escolher —</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.code}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="field">
          Fornecedor (opcional)
          <input
            name="vendor"
            disabled={disabled}
            placeholder="Ex.: EDP, Águas do Porto"
            defaultValue={initialDraft?.vendor ?? ""}
          />
        </label>
      </div>
      {categories.length === 0 ? <p className="alert alert--warning">Cria primeiro pelo menos uma rubrica acima.</p> : null}
      {state?.error ? <p className="alert alert--error">{state.error}</p> : null}
      {state?.ok ? <p className="alert alert--success">Despesa registada.</p> : null}
      <button type="submit" disabled={disabled} className="btn btn--primary btn--fit">
        {pending ? "A guardar…" : "Registar fatura"}
      </button>
    </form>
  );
}
