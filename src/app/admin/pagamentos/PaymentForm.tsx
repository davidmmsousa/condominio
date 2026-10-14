"use client";

import { createPaymentAction, type ActionState } from "@/app/admin/actions";
import { Icon } from "@/components/ui/Icon";
import { TREASURY_BOOK_LABELS, type TreasuryBookKind } from "@/lib/treasury/types";
import { useActionState } from "react";

const treasuryKinds: TreasuryBookKind[] = ["numerario", "conta_ordem", "conta_prazo"];

export function PaymentForm({ units }: { units: Array<{ id: string; code: string }> }) {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(
    createPaymentAction,
    null,
  );

  const nowLocal = new Date();
  const defaultDt = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, "0")}-${String(nowLocal.getDate()).padStart(2, "0")}T${String(nowLocal.getHours()).padStart(2, "0")}:${String(nowLocal.getMinutes()).padStart(2, "0")}`;

  return (
    <form action={action} className="form">
      <div>
        <h2 className="card__title">Registar pagamento</h2>
        <p className="card__lead" style={{ marginBottom: 0 }}>
          O valor é aplicado automaticamente às cobranças em aberto: <strong>quotas correntes</strong> primeiro (mais
          antigas), depois extraordinárias.
        </p>
      </div>
      <div className="form-grid">
        <label className="field">
          Fração
          <select name="unit_id" required disabled={pending || units.length === 0}>
            <option value="">— escolher —</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Montante (€)
          <input name="euros" required placeholder="Ex.: 100" disabled={pending} />
        </label>
        <label className="field">
          Data / hora
          <input name="paid_at" type="datetime-local" disabled={pending} defaultValue={defaultDt} />
          <span className="field__hint">Opcional — vazio = agora.</span>
        </label>
        <label className="field">
          Onde entrou o valor (tesouraria)
          <select name="received_in" required disabled={pending} defaultValue="conta_ordem">
            {treasuryKinds.map((k) => (
              <option key={k} value={k}>
                {TREASURY_BOOK_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Meio (opcional)
          <input name="method" placeholder="Numerário, transferência MB, MB Way…" disabled={pending} />
        </label>
        <label className="field">
          Nota (opcional)
          <input name="note" disabled={pending} />
        </label>
      </div>
      {state?.error ? <p className="alert alert--error">{state.error}</p> : null}
      {state?.ok ? (
        <div className="alert alert--success" style={{ display: "grid", gap: 6 }}>
          <span>{state.message ?? "Pagamento registado."}</span>
          {state.paymentId ? (
            <span>
              <a
                href={`/api/admin/receipts/${state.paymentId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link"
              >
                <Icon name="download" size={15} /> Descarregar recibo PDF
              </a>{" "}
              (inclui meses cobertos quando o valor foi aplicado a quotas).
            </span>
          ) : null}
        </div>
      ) : null}
      <button type="submit" disabled={pending || units.length === 0} className="btn btn--primary btn--fit">
        {pending ? "A guardar…" : "Registar e alocar"}
      </button>
    </form>
  );
}
