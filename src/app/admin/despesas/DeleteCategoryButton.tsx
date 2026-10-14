"use client";

import { deleteExpenseCategoryAction, type ActionState } from "@/app/admin/actions";
import { useActionState } from "react";

export function DeleteCategoryButton({ categoryId }: { categoryId: string }) {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(
    deleteExpenseCategoryAction,
    null,
  );

  return (
    <form action={action} className="row">
      <input type="hidden" name="id" value={categoryId} />
      <button type="submit" disabled={pending} className="btn btn--danger btn--sm">
        Apagar
      </button>
      {state?.error ? <span className="alert alert--error alert--inline">{state.error}</span> : null}
    </form>
  );
}
