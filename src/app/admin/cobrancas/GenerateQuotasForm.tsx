"use client";

import { generateMonthlyQuotasAction, type ActionState } from "@/app/admin/actions";
import { useActionState } from "react";

const inp = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #ccc",
  fontSize: 15,
  width: "100%",
  maxWidth: 400,
  boxSizing: "border-box" as const,
};

export function GenerateQuotasForm({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(
    generateMonthlyQuotasAction,
    null,
  );

  return (
    <form action={action} style={{ display: "grid", gap: 12, marginBottom: 32 }}>
      <h2 style={{ fontSize: 18, margin: 0 }}>Gerar quotas do mês (todas as frações)</h2>
      <p style={{ margin: 0, fontSize: 14, color: "#555", maxWidth: 560 }}>
        O valor mensal global é repartido pelas permilagens (restos distribuídos). Vencimento:{" "}
        <strong>dia 8</strong> de cada mês (regra MVP).
      </p>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Mês de referência
        <input name="reference_month" type="month" required disabled={pending || disabled} style={inp} />
      </label>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Valor total mensal do condomínio (€)
        <input
          name="total_euros"
          required
          placeholder="Ex.: 1200,00"
          disabled={pending || disabled}
          style={inp}
        />
      </label>
      {disabled ? (
        <p style={{ color: "#b00020", margin: 0, fontSize: 14 }}>
          Precisas de frações registadas primeiro.
        </p>
      ) : null}
      {state?.error ? <p style={{ color: "#b00020", margin: 0 }}>{state.error}</p> : null}
      {state?.ok ? (
        <p style={{ color: "#0a0", margin: 0 }}>{state.message ?? "Quotas criadas."}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending || disabled}
        style={{
          padding: "10px 16px",
          borderRadius: 8,
          border: "none",
          background: pending || disabled ? "#999" : "#0b5cff",
          color: "#fff",
          cursor: pending || disabled ? "not-allowed" : "pointer",
          width: "fit-content",
        }}
      >
        {pending ? "A gerar…" : "Gerar quotas"}
      </button>
    </form>
  );
}
