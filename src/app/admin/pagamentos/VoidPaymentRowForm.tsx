"use client";

import { cancelPaymentAction, type ActionState } from "@/app/admin/actions";
import { useActionState } from "react";

export function VoidPaymentRowForm(props: {
  paymentId: string;
  fractionCode: string;
  amountFormatted: string;
  paidAtLabel: string;
}) {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(cancelPaymentAction, null);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            `Anular este pagamento?\n\n${props.fractionCode} · ${props.amountFormatted}\n${props.paidAtLabel}\n\nIsto reverte as alocações às quotas, remove o movimento no fundo de caixa quando existia, e elimina o recibo (${props.paymentId.slice(0, 8).toUpperCase()}).\nEsta operação não se pode desfazer.`,
          )
        ) {
          e.preventDefault();
        }
      }}
      style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "stretch", maxWidth: 220 }}
    >
      <input type="hidden" name="payment_id" value={props.paymentId} />
      <label
        style={{
          fontSize: 12,
          display: "flex",
          gap: 6,
          cursor: pending ? "default" : "pointer",
          color: "#475569",
          alignItems: "flex-start",
          lineHeight: 1.35,
        }}
      >
        <input type="checkbox" name="send_void_email" disabled={pending} style={{ marginTop: 2 }} />
        Avisar morador por email (desconsiderar recibo anterior)
      </label>
      <button
        type="submit"
        disabled={pending}
        style={{
          padding: "6px 10px",
          borderRadius: 8,
          fontSize: 13,
          border: "1px solid #fca5a5",
          background: pending ? "#f1f5f9" : "#fef2f2",
          color: "#991b1b",
          cursor: pending ? "not-allowed" : "pointer",
          fontFamily: "inherit",
        }}
      >
        {pending ? "A anular…" : "Anular pagamento"}
      </button>
      {state?.error ? <span style={{ color: "#b00020", fontSize: 12 }}>{state.error}</span> : null}
      {state?.ok && state.message ? (
        <span style={{ color: "#047857", fontSize: 12, lineHeight: 1.4 }}>{state.message}</span>
      ) : null}
    </form>
  );
}
