"use client";

import { createUnitAction, type ActionState } from "@/app/admin/actions";
import { useActionState } from "react";

export function CreateUnitForm() {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(
    createUnitAction,
    null,
  );

  return (
    <form action={action} className="form">
      <h2 className="card__title">Nova fração</h2>
      <label className="field">
        Código (ex.: 1ºEsq, A)
        <input name="code" required disabled={pending} placeholder="Ex.: 1ºD" />
      </label>
      <label className="field">
        Permilagem (‰)
        <input name="permilagem" type="number" min={1} step={1} required disabled={pending} />
      </label>
      {state?.error ? <p className="alert alert--error">{state.error}</p> : null}
      {state?.ok ? <p className="alert alert--success">Fração criada.</p> : null}
      <button type="submit" disabled={pending} className="btn btn--primary btn--fit">
        {pending ? "A guardar…" : "Guardar fração"}
      </button>
    </form>
  );
}
