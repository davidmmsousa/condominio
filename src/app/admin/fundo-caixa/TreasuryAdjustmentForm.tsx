"use client";

import { createTreasuryAdjustmentAction, type ActionState } from "@/app/admin/actions";
import { TREASURY_BOOK_LABELS, type TreasuryBookKind } from "@/lib/treasury/types";
import { useActionState } from "react";

const inp = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #ccc",
  fontSize: 15,
  maxWidth: 360,
  width: "100%",
  boxSizing: "border-box" as const,
};

const kinds: TreasuryBookKind[] = ["numerario", "conta_ordem", "conta_prazo"];

export function TreasuryAdjustmentForm() {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(
    createTreasuryAdjustmentAction,
    null,
  );

  return (
    <form action={action} style={{ display: "grid", gap: 12, maxWidth: 440 }}>
      <h2 style={{ fontSize: 17, margin: 0 }}>Ajuste de saldo</h2>
      <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.45 }}>
        Para corrigir diferenças de arranque ou reconciliação com extrato bancário (entrada ou saída na conta
        indicada).
      </p>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Conta
        <select name="kind" required disabled={pending} style={inp}>
          {kinds.map((k) => (
            <option key={k} value={k}>
              {TREASURY_BOOK_LABELS[k]}
            </option>
          ))}
        </select>
      </label>
      <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
        <legend style={{ fontSize: 14, marginBottom: 8 }}>Sentido</legend>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
          <input type="radio" name="direction" value="entrada" defaultChecked disabled={pending} />
          Entrada (aumenta o saldo desta conta)
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
          <input type="radio" name="direction" value="saida" disabled={pending} />
          Saída (diminui o saldo)
        </label>
      </fieldset>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Valor (€)
        <input name="euros" required disabled={pending} placeholder="ex.: 50" style={inp} />
      </label>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Data
        <input name="occurred_on" type="date" required disabled={pending} style={inp} />
      </label>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Motivo
        <input name="memo" required disabled={pending} placeholder="Ex.: saldo inicial banco" style={inp} />
      </label>
      {state?.error ? <p style={{ color: "#b00020", margin: 0, fontSize: 14 }}>{state.error}</p> : null}
      {state?.ok ? <p style={{ color: "#047857", margin: 0, fontSize: 14 }}>{state.message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        style={{
          padding: "10px 16px",
          borderRadius: 8,
          border: "none",
          background: pending ? "#999" : "#111",
          color: "#fff",
          cursor: pending ? "not-allowed" : "pointer",
          width: "fit-content",
        }}
      >
        {pending ? "A guardar…" : "Registar ajuste"}
      </button>
    </form>
  );
}
