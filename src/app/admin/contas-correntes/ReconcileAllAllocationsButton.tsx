"use client";

import { reconcileAllUnitsAllocationsAction, type ActionState } from "@/app/admin/actions";
import { useActionState } from "react";

export function ReconcileAllAllocationsButton() {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(
    reconcileAllUnitsAllocationsAction,
    null,
  );

  return (
    <form action={action} className="row" style={{ marginBottom: 24 }}>
      <button type="submit" disabled={pending} className="btn btn--warning">
        {pending ? "A reconciliar todas…" : "Reconciliar todas as frações"}
      </button>
      <span className="small muted">Corre o mesmo FIFO em todas as frações do condomínio (operação global).</span>
      {state?.error ? <span className="alert alert--error alert--inline">{state.error}</span> : null}
      {state?.ok && state.message ? <span className="alert alert--success alert--inline">{state.message}</span> : null}
    </form>
  );
}
