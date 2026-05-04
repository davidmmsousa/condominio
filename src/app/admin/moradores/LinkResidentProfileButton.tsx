"use client";

import { linkResidentProfileAction, type ActionState } from "@/app/admin/actions";
import { useActionState } from "react";

export function LinkResidentProfileButton({ residentId }: { residentId: string }) {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(
    linkResidentProfileAction,
    null,
  );

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <input type="hidden" name="id" value={residentId} />
      <button
        type="submit"
        disabled={pending}
        title="Copia a fração desta ficha para profiles.unit_id da conta Auth com o mesmo email"
        style={{
          fontSize: 13,
          padding: "6px 10px",
          borderRadius: 6,
          border: "1px solid #1565c0",
          background: "#fff",
          color: "#1565c0",
          cursor: pending ? "not-allowed" : "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {pending ? "…" : "Ligar ao portal"}
      </button>
      {state?.error ? <span style={{ color: "#b00020", fontSize: 12, maxWidth: 220, textAlign: "right" }}>{state.error}</span> : null}
      {state?.ok && state.message ? (
        <span style={{ color: "#0a0", fontSize: 12, maxWidth: 220, textAlign: "right" }}>{state.message}</span>
      ) : null}
    </form>
  );
}
