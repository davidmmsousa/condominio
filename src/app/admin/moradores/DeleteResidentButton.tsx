"use client";

import { deleteResidentAction, type ActionState } from "@/app/admin/actions";
import { useActionState } from "react";

export function DeleteResidentButton({ residentId }: { residentId: string }) {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(
    deleteResidentAction,
    null,
  );

  return (
    <form action={action} className="row">
      <input type="hidden" name="id" value={residentId} />
      <button type="submit" disabled={pending} className="btn btn--danger btn--sm">
        Apagar
      </button>
      {state?.error ? <span className="alert alert--error alert--inline">{state.error}</span> : null}
    </form>
  );
}
