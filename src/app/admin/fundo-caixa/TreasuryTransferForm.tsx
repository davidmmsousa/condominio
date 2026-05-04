"use client";

import { createTreasuryTransferAction, type ActionState } from "@/app/admin/actions";
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

export function TreasuryTransferForm() {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(
    createTreasuryTransferAction,
    null,
  );
  const nowLocal = new Date();
  const defaultDt = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, "0")}-${String(nowLocal.getDate()).padStart(2, "0")}T${String(nowLocal.getHours()).padStart(2, "0")}:${String(nowLocal.getMinutes()).padStart(2, "0")}`;

  return (
    <form action={action} style={{ display: "grid", gap: 12, maxWidth: 440 }}>
      <h2 style={{ fontSize: 17, margin: 0 }}>Transferir entre contas</h2>
      <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.45 }}>
        Ex.: levantamento para numerário, ou movimento da conta à ordem para depósito a prazo. Regista dois movimentos
        compensados.
      </p>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        De
        <select name="from_kind" required disabled={pending} style={inp} defaultValue="conta_ordem">
          {kinds.map((k) => (
            <option key={k} value={k}>
              {TREASURY_BOOK_LABELS[k]}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Para
        <select name="to_kind" required disabled={pending} style={inp} defaultValue="numerario">
          {kinds.map((k) => (
            <option key={k} value={k}>
              {TREASURY_BOOK_LABELS[k]}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Valor (€)
        <input name="euros" required disabled={pending} placeholder="ex.: 250" style={inp} />
      </label>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Data / hora
        <input name="occurred_at" type="datetime-local" disabled={pending} style={inp} defaultValue={defaultDt} />
      </label>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Nota (opcional)
        <input name="memo" disabled={pending} placeholder="Ex.: levantamento ATM" style={inp} />
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
        {pending ? "A guardar…" : "Registar transferência"}
      </button>
    </form>
  );
}
