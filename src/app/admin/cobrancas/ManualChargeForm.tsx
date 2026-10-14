"use client";

import { createManualChargeAction, type ActionState } from "@/app/admin/actions";
import { useActionState, useState } from "react";

export function ManualChargeForm({ units }: { units: Array<{ id: string; code: string }> }) {
  const [kind, setKind] = useState<"corrente" | "extraordinaria">("corrente");
  const [state, action, pending] = useActionState<ActionState | null, FormData>(
    createManualChargeAction,
    null,
  );

  return (
    <form action={action} className="form">
      <h2 className="card__title">Cobrança manual</h2>
      <input type="hidden" name="kind" value={kind} />

      <label className="field">
        Tipo
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as "corrente" | "extraordinaria")}
          disabled={pending}
        >
          <option value="corrente">Quota corrente</option>
          <option value="extraordinaria">Extraordinária</option>
        </select>
      </label>

      <div className="form-grid">
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

        <label className="field">
          Valor (€)
          <input name="euros" required placeholder="Ex.: 45,50" disabled={pending} />
        </label>
      </div>

      {kind === "corrente" ? (
        <label className="field">
          Mês de referência
          <input name="reference_month" type="month" required disabled={pending} />
        </label>
      ) : (
        <>
          <label className="field">
            Título do projeto (opcional — agrupa obra)
            <input name="project_title" placeholder="Ex.: Telhados" disabled={pending} />
          </label>
          <label className="field">
            Vencimento
            <input name="due_date" type="date" disabled={pending} />
            <span className="field__hint">Opcional — vazio = dia 1 do mês seguinte.</span>
          </label>
        </>
      )}

      {state?.error ? <p className="alert alert--error">{state.error}</p> : null}
      {state?.ok ? <p className="alert alert--success">Cobrança registada.</p> : null}

      <button type="submit" disabled={pending || units.length === 0} className="btn btn--primary btn--fit">
        {pending ? "A guardar…" : "Registar cobrança"}
      </button>
    </form>
  );
}
