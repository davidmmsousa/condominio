"use client";

import { createExpenseAction, type ActionState } from "@/app/admin/actions";
import { EXPENSE_FUNDING_LABELS, type ExpenseFunding } from "@/lib/treasury/types";
import { useActionState, useState } from "react";

const inp = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #ccc",
  fontSize: 15,
  maxWidth: 400,
  width: "100%",
  boxSizing: "border-box" as const,
};

const fundingKeys = Object.keys(EXPENSE_FUNDING_LABELS) as ExpenseFunding[];

export function CreateExpenseForm({
  categories,
  units,
}: {
  categories: { id: string; name: string }[];
  units: Array<{ id: string; code: string }>;
}) {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(createExpenseAction, null);
  const [paidFrom, setPaidFrom] = useState<ExpenseFunding>("conta_ordem");
  const disabled = pending || categories.length === 0;

  return (
    <form action={action} style={{ display: "grid", gap: 12 }}>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Rubrica
        <select name="category_id" required disabled={disabled} style={inp}>
          <option value="">— escolher —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Referência (nº fatura / documento)
        <input name="reference" required disabled={disabled} placeholder="Ex.: FT 2025/1042" style={inp} />
      </label>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Data da fatura
        <input name="occurred_on" type="date" required disabled={disabled} style={inp} />
      </label>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Valor (€)
        <input
          name="amount_euros"
          type="text"
          inputMode="decimal"
          required
          disabled={disabled}
          placeholder="ex.: 123,45"
          style={inp}
        />
      </label>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Quem suportou o custo
        <select
          name="paid_from"
          required
          disabled={disabled}
          style={inp}
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
        <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
          Fração (encontro de contas na conta corrente)
          <select name="payer_unit_id" required disabled={disabled || units.length === 0} style={inp}>
            <option value="">— escolher —</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Fornecedor (opcional)
        <input name="vendor" disabled={disabled} placeholder="Ex.: EDP, Águas do Porto" style={inp} />
      </label>
      {categories.length === 0 ? (
        <p style={{ margin: 0, fontSize: 14, color: "#92400e" }}>Cria primeiro pelo menos uma rubrica acima.</p>
      ) : null}
      {state?.error ? <p style={{ color: "#b00020", margin: 0, fontSize: 14 }}>{state.error}</p> : null}
      {state?.ok ? <p style={{ color: "#065f46", margin: 0, fontSize: 14 }}>Despesa registada.</p> : null}
      <button
        type="submit"
        disabled={disabled}
        style={{
          padding: "10px 16px",
          borderRadius: 8,
          border: "none",
          background: disabled ? "#999" : "#111",
          color: "#fff",
          cursor: disabled ? "not-allowed" : "pointer",
          width: "fit-content",
        }}
      >
        {pending ? "A guardar…" : "Registar fatura"}
      </button>
    </form>
  );
}
