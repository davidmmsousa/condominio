"use client";

import { createResidentAction, type ActionState } from "@/app/admin/actions";
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

export function CreateResidentForm({ units }: { units: Array<{ id: string; code: string }> }) {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(
    createResidentAction,
    null,
  );

  return (
    <form action={action} style={{ display: "grid", gap: 12, marginBottom: 28 }}>
      <h2 style={{ fontSize: 18, margin: 0 }}>Novo morador</h2>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Nome completo
        <input name="full_name" required disabled={pending} style={inp} />
      </label>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Email (opcional)
        <input name="email" type="email" disabled={pending} style={inp} />
      </label>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Telemóvel (opcional)
        <input name="phone" type="tel" disabled={pending} style={inp} />
      </label>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        N.º contribuinte / NIF (opcional)
        <input name="tax_id" inputMode="numeric" disabled={pending} placeholder="9 dígitos" style={inp} />
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
      {!units.length ? (
        <p style={{ color: "#b00020", fontSize: 14 }}>Cria primeiro pelo menos uma fração.</p>
      ) : null}
      {state?.error ? <p style={{ color: "#b00020", margin: 0 }}>{state.error}</p> : null}
      {state?.ok ? (
        <p style={{ color: "#0a0", margin: 0 }}>
          Morador registado.{state.message ? ` ${state.message}` : ""}
        </p>
      ) : null}
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
        {pending ? "A guardar…" : "Guardar morador"}
      </button>
    </form>
  );
}
