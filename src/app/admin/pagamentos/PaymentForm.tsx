"use client";

import { createPaymentAction, type ActionState } from "@/app/admin/actions";
import { TREASURY_BOOK_LABELS, type TreasuryBookKind } from "@/lib/treasury/types";
import { useActionState } from "react";

const inp = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #ccc",
  fontSize: 15,
  width: "100%",
  maxWidth: 400,
  boxSizing: "border-box" as const,
};

const treasuryKinds: TreasuryBookKind[] = ["numerario", "conta_ordem", "conta_prazo"];

export function PaymentForm({ units }: { units: Array<{ id: string; code: string }> }) {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(
    createPaymentAction,
    null,
  );

  const nowLocal = new Date();
  const defaultDt = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, "0")}-${String(nowLocal.getDate()).padStart(2, "0")}T${String(nowLocal.getHours()).padStart(2, "0")}:${String(nowLocal.getMinutes()).padStart(2, "0")}`;

  return (
    <form action={action} style={{ display: "grid", gap: 12 }}>
      <h2 style={{ fontSize: 18, marginTop: 0 }}>Registar pagamento</h2>
      <p style={{ margin: 0, fontSize: 14, color: "#555", maxWidth: 560 }}>
        O valor é aplicado automaticamente às cobranças em aberto: <strong>quotas correntes</strong> primeiro (mais
        antigas), depois extraordinárias.
      </p>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Fração
        <select name="unit_id" required disabled={pending || units.length === 0} style={inp}>
          <option value="">— escolher —</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.code}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Montante (€)
        <input name="euros" required placeholder="Ex.: 100" disabled={pending} style={inp} />
      </label>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Data / hora (opcional — vazio = agora)
        <input name="paid_at" type="datetime-local" disabled={pending} style={inp} defaultValue={defaultDt} />
      </label>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Onde entrou o valor (tesouraria)
        <select name="received_in" required disabled={pending} style={inp} defaultValue="conta_ordem">
          {treasuryKinds.map((k) => (
            <option key={k} value={k}>
              {TREASURY_BOOK_LABELS[k]}
            </option>
          ))}
        </select>
      </label>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Meio (opcional)
        <input name="method" placeholder="Numerário, transferência MB, MB Way…" disabled={pending} style={inp} />
      </label>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Nota (opcional)
        <input name="note" disabled={pending} style={inp} />
      </label>
      {state?.error ? <p style={{ color: "#b00020", margin: 0 }}>{state.error}</p> : null}
      {state?.ok ? (
        <div style={{ display: "grid", gap: 8 }}>
          <p style={{ color: "#0a0", margin: 0 }}>{state.message ?? "Pagamento registado."}</p>
          {state.paymentId ? (
            <p style={{ margin: 0, fontSize: 14 }}>
              <a
                href={`/api/admin/receipts/${state.paymentId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#1d4ed8", fontWeight: 600 }}
              >
                Descarregar recibo PDF
              </a>{" "}
              (inclui meses cobertos quando o valor foi aplicado a quotas).
            </p>
          ) : null}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={pending || units.length === 0}
        style={{
          padding: "10px 16px",
          borderRadius: 8,
          border: "none",
          background: pending || units.length === 0 ? "#999" : "#111",
          color: "#fff",
          cursor: pending || units.length === 0 ? "not-allowed" : "pointer",
          width: "fit-content",
        }}
      >
        {pending ? "A guardar…" : "Registar e alocar"}
      </button>
    </form>
  );
}
