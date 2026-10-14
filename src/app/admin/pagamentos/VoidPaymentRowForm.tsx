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
      className="stack"
      style={{ gap: 8, maxWidth: 220 }}
    >
      <input type="hidden" name="payment_id" value={props.paymentId} />
      <label className="choice small">
        <input type="checkbox" name="send_void_email" disabled={pending} />
        Avisar morador por email (desconsiderar recibo anterior)
      </label>
      <button type="submit" disabled={pending} className="btn btn--danger btn--sm">
        {pending ? "A anular…" : "Anular pagamento"}
      </button>
      {state?.error ? <span className="alert alert--error alert--inline">{state.error}</span> : null}
      {state?.ok && state.message ? <span className="alert alert--success alert--inline">{state.message}</span> : null}
    </form>
  );
}
