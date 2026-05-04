"use client";

import { reconcileAllUnitsAllocationsAction, type ActionState } from "@/app/admin/actions";
import { useActionState } from "react";

export function ReconcileAllAllocationsButton() {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(
    reconcileAllUnitsAllocationsAction,
    null,
  );

  return (
    <form action={action} style={{ marginTop: 20, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
      <button
        type="submit"
        disabled={pending}
        style={{
          fontSize: 14,
          padding: "8px 14px",
          borderRadius: 8,
          border: "1px solid #92400e",
          background: "#fffbeb",
          color: "#92400e",
          cursor: pending ? "not-allowed" : "pointer",
        }}
      >
        {pending ? "A reconciliar todas…" : "Reconciliar todas as frações"}
      </button>
      <span style={{ color: "#64748b", fontSize: 13, maxWidth: 480 }}>
        Corre o mesmo FIFO em todas as frações do condomínio (operação global).
      </span>
      {state?.error ? <span style={{ color: "#b00020", fontSize: 13, width: "100%" }}>{state.error}</span> : null}
      {state?.ok && state.message ? (
        <span style={{ color: "#047857", fontSize: 13, width: "100%" }}>{state.message}</span>
      ) : null}
    </form>
  );
}
