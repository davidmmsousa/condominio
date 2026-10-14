"use client";

import { deleteUnitAction, type ActionState } from "@/app/admin/actions";
import { useActionState } from "react";

export function DeleteUnitButton({ unitId }: { unitId: string }) {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(
    deleteUnitAction,
    null,
  );

  return (
    <form action={action} className="row">
      <input type="hidden" name="id" value={unitId} />
      <button type="submit" disabled={pending} className="btn btn--danger btn--sm">
        Apagar
      </button>
      {state?.error ? <span className="alert alert--error alert--inline">{state.error}</span> : null}
    </form>
  );
}
