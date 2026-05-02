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
      const nextPath = "/auth/redefinir-password";
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

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
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 14, maxWidth: 360 }}>
      <label style={{ display: "grid", gap: 6 }}>
        <span>Email da conta</span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: 16,
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
          padding: "12px 16px",
          borderRadius: 8,
          border: "none",
          background: loading ? "#999" : "#111",
          color: "#fff",
          fontSize: 16,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "A enviar…" : "Enviar link por email"}
      </button>
    </form>
  );
}
