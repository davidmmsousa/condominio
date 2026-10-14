"use client";

import { createExpenseCategoryAction, type ActionState } from "@/app/admin/actions";
import { useActionState } from "react";

export function CreateCategoryForm() {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(
    createExpenseCategoryAction,
    null,
  );

  return (
    <form action={action} className="form" style={{ marginBottom: 18 }}>
      <label className="field">
        Nova rubrica
        <input name="name" required disabled={pending} placeholder="Ex.: Eletricidade" />
        <span className="field__hint">Ex.: Água, Eletricidade, Elevador, Limpeza.</span>
      </label>
      {state?.error ? <p className="alert alert--error">{state.error}</p> : null}
      {state?.ok ? <p className="alert alert--success">Rubrica criada.</p> : null}
      <button type="submit" disabled={pending} className="btn btn--primary btn--fit">
        {pending ? "A guardar…" : "Adicionar rubrica"}
      </button>
    </form>
  );
}
