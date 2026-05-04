"use client";

import { reconcileUnitAllocationsAction, type ActionState } from "@/app/admin/actions";
import { useActionState } from "react";

export function ReconcileUnitAllocationsButton({ unitId }: { unitId: string }) {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(
    reconcileUnitAllocationsAction,
    null,
  );

  return (
    <form action={action} style={{ marginTop: 16, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
      <input type="hidden" name="unit_id" value={unitId} />
      <button
        type="submit"
        disabled={pending}
        style={{
          fontSize: 14,
          padding: "8px 14px",
          borderRadius: 8,
          border: "1px solid #334155",
          background: "#fff",
          color: "#1e293b",
          cursor: pending ? "not-allowed" : "pointer",
        }}
      >
        {pending ? "A reconciliar…" : "Reconciliar alocações (FIFO)"}
      </button>
      <span style={{ color: "#64748b", fontSize: 13, maxWidth: 520, lineHeight: 1.45 }}>
        Recalcula <code>payment_allocations</code> desta fração: apaga imputações antigas e volta a aplicar cada
        pagamento por ordem de data (mesma regra que ao registar). Útil após criar quotas em atraso.
      </span>
      {state?.error ? <span style={{ color: "#b00020", fontSize: 13, width: "100%" }}>{state.error}</span> : null}
      {state?.ok && state.message ? (
        <span style={{ color: "#047857", fontSize: 13, width: "100%" }}>{state.message}</span>
      ) : null}
    </form>
  );
}
