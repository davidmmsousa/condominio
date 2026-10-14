"use client";

import { linkResidentProfileAction, type ActionState } from "@/app/admin/actions";
import { useActionState } from "react";

export function LinkResidentProfileButton({ residentId }: { residentId: string }) {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(
    linkResidentProfileAction,
    null,
  );

  return (
    <form action={action} className="list__actions">
      <input type="hidden" name="id" value={residentId} />
      <button
        type="submit"
        disabled={pending}
        title="Copia a fração desta ficha para profiles.unit_id da conta Auth com o mesmo email"
        className="btn btn--sm nowrap"
      >
        {pending ? "…" : "Ligar ao portal"}
      </button>
      {state?.error ? <span className="alert alert--error alert--inline">{state.error}</span> : null}
      {state?.ok && state.message ? <span className="alert alert--success alert--inline">{state.message}</span> : null}
    </form>
  );
}
