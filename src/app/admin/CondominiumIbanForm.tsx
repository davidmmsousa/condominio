"use client";

import { updateCondominiumIbanAction, type ActionState } from "@/app/admin/actions";
import { useActionState } from "react";

const inp = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #ccc",
  fontSize: 15,
  width: "100%",
  maxWidth: 420,
  boxSizing: "border-box" as const,
  fontFamily: "ui-monospace, monospace",
};

export function CondominiumIbanForm({ currentIban }: { currentIban: string | null }) {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(updateCondominiumIbanAction, null);

  return (
    <form action={action} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        IBAN para transferências
        <input
          name="payment_iban"
          disabled={pending}
          defaultValue={currentIban ?? ""}
          placeholder="PT50…"
          style={inp}
          spellCheck={false}
          autoComplete="off"
        />
      </label>
      <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.45 }}>
        Aparece no portal <strong>Minha conta</strong> quando o morador clica em &quot;Ver IBAN&quot;. Deixa vazio para
        ocultar o IBAN no portal.
      </p>
      {state?.error ? <p style={{ color: "#b00020", margin: 0, fontSize: 14 }}>{state.error}</p> : null}
      {state?.ok ? <p style={{ color: "#065f46", margin: 0, fontSize: 14 }}>IBAN actualizado.</p> : null}
      <button type="submit" disabled={pending} className="btn" style={{ width: "fit-content" }}>
        {pending ? "A guardar…" : "Guardar IBAN"}
      </button>
    </form>
  );
}
