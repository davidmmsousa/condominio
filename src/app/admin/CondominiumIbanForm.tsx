"use client";

import { updateCondominiumIbanAction, type ActionState } from "@/app/admin/actions";
import { useActionState } from "react";

export function CondominiumIbanForm({ currentIban }: { currentIban: string | null }) {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(updateCondominiumIbanAction, null);

  return (
    <form action={action} className="form">
      <label className="field">
        IBAN para transferências
        <input
          name="payment_iban"
          className="input--mono"
          disabled={pending}
          defaultValue={currentIban ?? ""}
          placeholder="PT50…"
          spellCheck={false}
          autoComplete="off"
        />
        <span className="field__hint">Deixa vazio para ocultar o IBAN no portal do morador.</span>
      </label>
      {state?.error ? <p className="alert alert--error">{state.error}</p> : null}
      {state?.ok ? <p className="alert alert--success">IBAN atualizado.</p> : null}
      <button type="submit" disabled={pending} className="btn btn--primary btn--fit">
        {pending ? "A guardar…" : "Guardar IBAN"}
      </button>
    </form>
  );
}
