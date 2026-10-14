"use client";

import { reconcileUnitAllocationsAction, type ActionState } from "@/app/admin/actions";
import { useActionState } from "react";

export function ReconcileUnitAllocationsButton({ unitId }: { unitId: string }) {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(
    reconcileUnitAllocationsAction,
    null,
  );

  return (
    <form action={action} className="stack" style={{ gap: 10 }}>
      <input type="hidden" name="unit_id" value={unitId} />
      <div className="row">
        <button type="submit" disabled={pending} className="btn btn--fit">
          {pending ? "A reconciliar…" : "Reconciliar alocações (FIFO)"}
        </button>
        {state?.error ? <span className="alert alert--error alert--inline">{state.error}</span> : null}
        {state?.ok && state.message ? <span className="alert alert--success alert--inline">{state.message}</span> : null}
      </div>
      <span className="small muted" style={{ maxWidth: 620 }}>
        Recalcula <code>payment_allocations</code> desta fração: apaga imputações antigas e volta a aplicar cada
        pagamento por ordem de data (mesma regra que ao registar). Útil após criar quotas em atraso.
      </span>
    </form>
  );
}
