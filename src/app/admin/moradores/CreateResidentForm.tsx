"use client";

import { createResidentAction, type ActionState } from "@/app/admin/actions";
import { useActionState } from "react";

export function CreateResidentForm({ units }: { units: Array<{ id: string; code: string }> }) {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(
    createResidentAction,
    null,
  );

  return (
    <form action={action} className="form">
      <h2 className="card__title">Novo morador</h2>
      <div className="form-grid">
        <label className="field field--full">
          Nome completo
          <input name="full_name" required disabled={pending} />
        </label>
        <label className="field">
          Email (opcional)
          <input name="email" type="email" disabled={pending} />
        </label>
        <label className="field">
          Telemóvel (opcional)
          <input name="phone" type="tel" disabled={pending} />
        </label>
        <label className="field">
          N.º contribuinte / NIF (opcional)
          <input name="tax_id" inputMode="numeric" disabled={pending} placeholder="9 dígitos" />
        </label>
        <label className="field">
          Fração
          <select name="unit_id" required disabled={pending || units.length === 0}>
            <option value="">— escolher —</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!units.length ? <p className="alert alert--warning">Cria primeiro pelo menos uma fração.</p> : null}
      {state?.error ? <p className="alert alert--error">{state.error}</p> : null}
      {state?.ok ? (
        <p className="alert alert--success">
          Morador registado.{state.message ? ` ${state.message}` : ""}
        </p>
      ) : null}
      <button type="submit" disabled={pending || units.length === 0} className="btn btn--primary btn--fit">
        {pending ? "A guardar…" : "Guardar morador"}
      </button>
    </form>
  );
}
