"use client";

import { createTreasuryTransferAction, type ActionState } from "@/app/admin/actions";
import { TREASURY_BOOK_LABELS, type TreasuryBookKind } from "@/lib/treasury/types";
import { useActionState } from "react";

const kinds: TreasuryBookKind[] = ["numerario", "conta_ordem", "conta_prazo"];

export function TreasuryTransferForm() {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(
    createTreasuryTransferAction,
    null,
  );
  const nowLocal = new Date();
  const defaultDt = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, "0")}-${String(nowLocal.getDate()).padStart(2, "0")}T${String(nowLocal.getHours()).padStart(2, "0")}:${String(nowLocal.getMinutes()).padStart(2, "0")}`;

  return (
    <form action={action} className="form">
      <div>
        <h2 className="card__title">Transferir entre contas</h2>
        <p className="card__lead" style={{ marginBottom: 0 }}>
          Ex.: levantamento para numerário, ou movimento da conta à ordem para depósito a prazo. Regista dois
          movimentos compensados.
        </p>
      </div>
      <div className="form-grid">
        <label className="field">
          De
          <select name="from_kind" required disabled={pending} defaultValue="conta_ordem">
            {kinds.map((k) => (
              <option key={k} value={k}>
                {TREASURY_BOOK_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Para
          <select name="to_kind" required disabled={pending} defaultValue="numerario">
            {kinds.map((k) => (
              <option key={k} value={k}>
                {TREASURY_BOOK_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Valor (€)
          <input name="euros" required disabled={pending} placeholder="ex.: 250" />
        </label>
        <label className="field">
          Data / hora
          <input name="occurred_at" type="datetime-local" disabled={pending} defaultValue={defaultDt} />
        </label>
        <label className="field field--full">
          Nota (opcional)
          <input name="memo" disabled={pending} placeholder="Ex.: levantamento ATM" />
        </label>
      </div>
      {state?.error ? <p className="alert alert--error">{state.error}</p> : null}
      {state?.ok ? <p className="alert alert--success">{state.message}</p> : null}
      <button type="submit" disabled={pending} className="btn btn--primary btn--fit">
        {pending ? "A guardar…" : "Registar transferência"}
      </button>
    </form>
  );
}
