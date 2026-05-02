"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { useState } from "react";

export function RecuperarForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const origin = window.location.origin;
      // Route dedicado: o fluxo não perde redirect (evita "/" após clicar link)
      const redirectTo = `${origin}/auth/recovery`;

      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (err) {
        setError(err.message);
        return;
      }
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao pedir recuperação.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div style={{ maxWidth: 420 }}>
        <p style={{ color: "#222", marginTop: 0 }}>
          Se existir uma conta para <strong>{email}</strong>, recebeste (ou vais receber) um email da Supabase com um
          link para definires uma nova palavra-passe. Verifica também a pasta de spam.
        </p>
        <p style={{ color: "#555", fontSize: 14 }}>
          O link expira ao fim de pouco tempo — abre-o no mesmo dispositivo/navegador se possível.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 16, width: "100%", maxWidth: "100%", paddingTop: 4 }}>
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Email da conta</span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #cbd5e1",
            fontSize: 16,
            background: loading ? "#f8fafc" : "#fff",
          }}
        />
      </label>
      {error ? (
        <p role="alert" style={{ color: "#b00020", margin: 0, fontSize: 14 }}>
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "14px 16px",
          borderRadius: 10,
          border: "none",
          background: loading ? "#94a3b8" : "linear-gradient(180deg,#1e293b,#0f172a)",
          color: "#fff",
          fontSize: 16,
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: loading ? undefined : "0 8px 24px rgba(15,23,42,0.18)",
        }}
      >
        {loading ? "A enviar…" : "Enviar link por email"}
      </button>
    </form>
  );
}
