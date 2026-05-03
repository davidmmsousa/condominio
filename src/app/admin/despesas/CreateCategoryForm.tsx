"use client";

import { createExpenseCategoryAction, type ActionState } from "@/app/admin/actions";
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

export function CreateCategoryForm() {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(
    createExpenseCategoryAction,
    null,
  );

  return (
    <form action={action} style={{ display: "grid", gap: 10, marginBottom: 16 }}>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Nova rubrica (ex.: Água, Eletricidade, Elevador)
        <input name="name" required disabled={pending} placeholder="Ex.: Eletricidade" style={inp} />
      </label>
      {state?.error ? <p style={{ color: "#b00020", margin: 0, fontSize: 14 }}>{state.error}</p> : null}
      {state?.ok ? <p style={{ color: "#065f46", margin: 0, fontSize: 14 }}>Rubrica criada.</p> : null}
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
        {pending ? "A guardar…" : "Adicionar rubrica"}
      </button>
    </form>
  );
}
