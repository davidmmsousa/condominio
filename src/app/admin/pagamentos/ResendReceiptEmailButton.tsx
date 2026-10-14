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
    <div className="stack" style={{ gap: 6, justifyItems: "start" }}>
      <button type="button" onClick={resend} disabled={status === "loading"} className="btn btn--sm">
        {status === "loading" ? "A enviar…" : "Reenviar email"}
      </button>
      {status === "ok" ? <span className="alert alert--success alert--inline">{detail}</span> : null}
      {status === "err" ? <span className="alert alert--error alert--inline">{detail}</span> : null}
    </div>
  );
}
