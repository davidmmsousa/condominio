"use client";

import { adjustMonthlyQuotasAction, type ActionState } from "@/app/admin/actions";
import { useActionState } from "react";

export function AdjustQuotasForm({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(adjustMonthlyQuotasAction, null);

  return (
    <form
      action={action}
      className="form"
      onSubmit={(e) => {
        if (!window.confirm("Isto vai alterar o valor das quotas já geradas nesses meses e refazer a imputação dos pagamentos. Continuar?")) {
          e.preventDefault();
        }
      }}
    >
      <div>
        <h2 className="card__title">Corrigir valor das quotas</h2>
        <p className="card__lead" style={{ marginBottom: 0 }}>
          Para quotas já geradas com o valor errado. O novo total mensal é repartido outra vez pelas permilagens e os
          pagamentos já registados são reimputados automaticamente. Os recibos já emitidos não são alterados.
        </p>
      </div>
      <div className="form-grid">
        <label className="field">
          Do mês
          <input name="from_month" type="month" required disabled={pending || disabled} />
        </label>
        <label className="field">
          Até ao mês
          <input name="to_month" type="month" disabled={pending || disabled} />
          <span className="field__hint">Vazio = só o mês inicial.</span>
        </label>
      </div>
      <label className="field">
        Valor total mensal correto (€)
        <input name="total_euros" required placeholder="Ex.: 1200,00" disabled={pending || disabled} />
      </label>
      {state?.error ? <p className="alert alert--error">{state.error}</p> : null}
      {state?.ok ? <p className="alert alert--success">{state.message}</p> : null}
      <button type="submit" disabled={pending || disabled} className="btn btn--warning btn--fit">
        {pending ? "A corrigir…" : "Corrigir quotas"}
      </button>
    </form>
  );
}
