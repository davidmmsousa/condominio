"use client";

import { createTreasuryAdjustmentAction, type ActionState } from "@/app/admin/actions";
import { TREASURY_BOOK_LABELS, type TreasuryBookKind } from "@/lib/treasury/types";
import { useActionState } from "react";

const kinds: TreasuryBookKind[] = ["numerario", "conta_ordem", "conta_prazo"];

export function TreasuryAdjustmentForm() {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(
    createTreasuryAdjustmentAction,
    null,
  );

  return (
    <form action={action} className="form">
      <div>
        <h2 className="card__title">Ajuste de saldo</h2>
        <p className="card__lead" style={{ marginBottom: 0 }}>
          Para corrigir diferenças de arranque ou reconciliação com extrato bancário (entrada ou saída na conta
          indicada).
        </p>
      </div>
      <label className="field">
        Conta
        <select name="kind" required disabled={pending}>
          {kinds.map((k) => (
            <option key={k} value={k}>
              {TREASURY_BOOK_LABELS[k]}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="fieldset">
        <legend>Sentido</legend>
        <label className="choice">
          <input type="radio" name="direction" value="entrada" defaultChecked disabled={pending} />
          Entrada (aumenta o saldo desta conta)
        </label>
        <label className="choice">
          <input type="radio" name="direction" value="saida" disabled={pending} />
          Saída (diminui o saldo)
        </label>
      </fieldset>
      <div className="form-grid">
        <label className="field">
          Valor (€)
          <input name="euros" required disabled={pending} placeholder="ex.: 50" />
        </label>
        <label className="field">
          Data
          <input name="occurred_on" type="date" required disabled={pending} />
        </label>
        <label className="field field--full">
          Motivo
          <input name="memo" required disabled={pending} placeholder="Ex.: saldo inicial banco" />
        </label>
      </div>
      {state?.error ? <p className="alert alert--error">{state.error}</p> : null}
      {state?.ok ? <p className="alert alert--success">{state.message}</p> : null}
      <button type="submit" disabled={pending} className="btn btn--primary btn--fit">
        {pending ? "A guardar…" : "Registar ajuste"}
      </button>
    </form>
  );
}
