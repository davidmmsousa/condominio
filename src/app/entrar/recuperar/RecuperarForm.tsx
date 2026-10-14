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
      <div className="stack">
        <p className="alert alert--success">
          Se existir uma conta para <strong>{email}</strong>, recebeste (ou vais receber) um email da Supabase com um
          link para definires uma nova palavra-passe. Verifica também a pasta de spam.
        </p>
        <p className="small muted">
          O link expira ao fim de pouco tempo — abre-o no mesmo dispositivo/navegador se possível.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="form">
      <label className="field">
        Email da conta
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </label>
      {error ? (
        <p role="alert" className="alert alert--error">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={loading} className="btn btn--primary btn--lg btn--block">
        {loading ? "A enviar…" : "Enviar link por email"}
      </button>
    </form>
  );
}
