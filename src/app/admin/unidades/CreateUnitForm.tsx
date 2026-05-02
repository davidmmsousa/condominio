"use client";

import { createUnitAction, type ActionState } from "@/app/admin/actions";
import { useActionState } from "react";

const inp = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #ccc",
  fontSize: 15,
  width: "100%",
  maxWidth: 320,
  boxSizing: "border-box" as const,
};

export function CreateUnitForm() {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(
    createUnitAction,
    null,
  );

  return (
    <form action={action} style={{ display: "grid", gap: 12, marginBottom: 28 }}>
      <h2 style={{ fontSize: 18, margin: 0 }}>Nova fração</h2>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Código (ex.: 1ºEsq, A)
        <input name="code" required disabled={pending} style={inp} placeholder="Ex.: 1ºD" />
      </label>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Permilagem (‰)
        <input name="permilagem" type="number" min={1} step={1} required disabled={pending} style={inp} />
      </label>
      {state?.error ? (
        <p style={{ color: "#b00020", margin: 0, fontSize: 14 }}>{state.error}</p>
      ) : null}
      {state?.ok ? <p style={{ color: "#0a0", margin: 0, fontSize: 14 }}>Fração criada.</p> : null}
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
        {pending ? "A guardar…" : "Guardar fração"}
      </button>
    </form>
  );
}
