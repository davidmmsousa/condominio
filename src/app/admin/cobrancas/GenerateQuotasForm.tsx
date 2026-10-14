"use client";

import { generateMonthlyQuotasAction, type ActionState } from "@/app/admin/actions";
import { useActionState } from "react";

export function GenerateQuotasForm({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(
    generateMonthlyQuotasAction,
    null,
  );

  return (
    <form action={action} className="form">
      <div>
        <h2 className="card__title">Gerar quotas do mês</h2>
        <p className="card__lead" style={{ marginBottom: 0 }}>
          O valor mensal global é repartido pelas permilagens (restos distribuídos). Vencimento:{" "}
          <strong>dia 8</strong> de cada mês (regra MVP). Gera um mês de cada vez; se alguém pagou o ano
          antecipadamente, as alocações desse pagamento são atualizadas automaticamente.
        </p>
      </div>
      <label className="field">
        Mês de referência
        <input name="reference_month" type="month" required disabled={pending || disabled} />
      </label>
      <label className="field">
        Valor total mensal do condomínio (€)
        <input name="total_euros" required placeholder="Ex.: 1200,00" disabled={pending || disabled} />
      </label>
      {disabled ? <p className="alert alert--warning">Precisas de frações registadas primeiro.</p> : null}
      {state?.error ? <p className="alert alert--error">{state.error}</p> : null}
      {state?.ok ? <p className="alert alert--success">{state.message ?? "Quotas criadas."}</p> : null}
      <button type="submit" disabled={pending || disabled} className="btn btn--primary btn--fit">
        {pending ? "A gerar…" : "Gerar quotas"}
      </button>
    </form>
  );
}
