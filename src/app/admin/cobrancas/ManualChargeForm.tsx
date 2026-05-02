"use client";

import { createManualChargeAction, type ActionState } from "@/app/admin/actions";
import { useActionState, useState } from "react";

const inp = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #ccc",
  fontSize: 15,
  width: "100%",
  maxWidth: 400,
  boxSizing: "border-box" as const,
};

export function ManualChargeForm({ units }: { units: Array<{ id: string; code: string }> }) {
  const [kind, setKind] = useState<"corrente" | "extraordinaria">("corrente");
  const [state, action, pending] = useActionState<ActionState | null, FormData>(
    createManualChargeAction,
    null,
  );

  return (
    <form action={action} style={{ display: "grid", gap: 12, marginBottom: 32 }}>
      <h2 style={{ fontSize: 18, margin: 0 }}>Cobrança manual</h2>
      <input type="hidden" name="kind" value={kind} />

      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Tipo
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as "corrente" | "extraordinaria")}
          disabled={pending}
          style={inp}
        >
          <option value="corrente">Quota corrente</option>
          <option value="extraordinaria">Extraordinária</option>
        </select>
      </label>

      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Fração
        <select name="unit_id" required disabled={pending || units.length === 0} style={inp}>
          <option value="">— escolher —</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.code}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Valor (€)
        <input name="euros" required placeholder="Ex.: 45,50" disabled={pending} style={inp} />
      </label>

      {kind === "corrente" ? (
        <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
          Mês de referência
          <input name="reference_month" type="month" required disabled={pending} style={inp} />
        </label>
      ) : (
        <>
          <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
            Título do projeto (opcional — agrupa obra)
            <input name="project_title" placeholder="Ex.: Telhados" disabled={pending} style={inp} />
          </label>
          <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
            Vencimento (opcional — vazio = dia 1 do mês seguinte)
            <input name="due_date" type="date" disabled={pending} style={inp} />
          </label>
        </>
      )}

      {state?.error ? <p style={{ color: "#b00020", margin: 0 }}>{state.error}</p> : null}
      {state?.ok ? <p style={{ color: "#0a0", margin: 0 }}>Cobrança registada.</p> : null}

      <button
        type="submit"
        disabled={pending || units.length === 0}
        style={{
          padding: "10px 16px",
          borderRadius: 8,
          border: "none",
          background: pending || units.length === 0 ? "#999" : "#111",
          color: "#fff",
          cursor: pending || units.length === 0 ? "not-allowed" : "pointer",
          width: "fit-content",
        }}
      >
        {pending ? "A guardar…" : "Registar cobrança"}
      </button>
    </form>
  );
}
