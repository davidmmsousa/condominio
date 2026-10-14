"use client";

import { updateResidentAction, type ActionState } from "@/app/admin/actions";
import { useActionState } from "react";

export function EditResidentForm({
  resident,
  units,
}: {
  resident: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    tax_id: string | null;
    unit_id: string;
  };
  units: Array<{ id: string; code: string }>;
}) {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(updateResidentAction, null);

  return (
    <form action={action} className="form">
      <input type="hidden" name="id" value={resident.id} />
      <div className="form-grid">
        <label className="field field--full">
          Nome completo
          <input name="full_name" required disabled={pending} defaultValue={resident.full_name} />
        </label>
        <label className="field">
          Email (opcional)
          <input name="email" type="email" disabled={pending} defaultValue={resident.email ?? ""} />
        </label>
        <label className="field">
          Telemóvel (opcional)
          <input name="phone" type="tel" disabled={pending} defaultValue={resident.phone ?? ""} />
        </label>
        <label className="field">
          N.º contribuinte / NIF (opcional)
          <input
            name="tax_id"
            inputMode="numeric"
            disabled={pending}
            defaultValue={resident.tax_id ?? ""}
            placeholder="9 dígitos"
          />
        </label>
        <label className="field">
          Fração
          <select name="unit_id" required disabled={pending || units.length === 0} defaultValue={resident.unit_id}>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code}
              </option>
            ))}
          </select>
        </label>
      </div>
      {state?.error ? <p className="alert alert--error">{state.error}</p> : null}
      {state?.ok ? <p className="alert alert--success">Morador atualizado.</p> : null}
      <button type="submit" disabled={pending} className="btn btn--primary btn--fit">
        {pending ? "A guardar…" : "Guardar alterações"}
      </button>
    </form>
  );
}
