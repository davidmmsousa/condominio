"use client";

import { deleteExpenseCategoryAction, type ActionState } from "@/app/admin/actions";
import { useActionState } from "react";

export function DeleteCategoryButton({ categoryId }: { categoryId: string }) {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(
    deleteExpenseCategoryAction,
    null,
  );

  return (
    <form action={action} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <input type="hidden" name="id" value={categoryId} />
      <button
        type="submit"
        disabled={pending}
        style={{
          fontSize: 13,
          padding: "6px 10px",
          borderRadius: 6,
          border: "1px solid #c00",
          background: "#fff",
          color: "#b00020",
          cursor: pending ? "not-allowed" : "pointer",
        }}
      >
        Apagar
      </button>
      {state?.error ? <span style={{ color: "#b00020", fontSize: 12 }}>{state.error}</span> : null}
    </form>
  );
}
