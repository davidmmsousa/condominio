"use client";

import { useState } from "react";

export function ResendReceiptEmailButton({ paymentId }: { paymentId: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [detail, setDetail] = useState("");

  async function resend() {
    setStatus("loading");
    setDetail("");
    try {
      const res = await fetch(`/api/admin/receipts/${paymentId}/resend-email`, {
        method: "POST",
        credentials: "include",
      });
      const body = (await res.json().catch(() => null)) as null | { error?: string; ok?: boolean; to?: string };
      if (!res.ok) {
        setStatus("err");
        setDetail(body?.error ?? `Erro HTTP ${res.status}`);
        return;
      }
      setStatus("ok");
      setDetail(body?.to ? `Enviado para ${body.to}.` : "Enviado.");
    } catch {
      setStatus("err");
      setDetail("Falha de rede ou resposta inválida.");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
      <button
        type="button"
        onClick={resend}
        disabled={status === "loading"}
        style={{
          fontSize: 13,
          padding: "4px 8px",
          borderRadius: 6,
          border: "1px solid #ccc",
          background: status === "loading" ? "#eee" : "#fff",
          cursor: status === "loading" ? "wait" : "pointer",
        }}
      >
        {status === "loading" ? "A enviar…" : "Reenviar email"}
      </button>
      {status === "ok" ? (
        <span style={{ fontSize: 12, color: "#0a7a0a" }}>{detail}</span>
      ) : null}
      {status === "err" ? (
        <span style={{ fontSize: 12, color: "#b00020", maxWidth: 220 }}>{detail}</span>
      ) : null}
    </div>
  );
}
