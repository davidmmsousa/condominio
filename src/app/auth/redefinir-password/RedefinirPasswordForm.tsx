"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function RedefinirPasswordForm() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [sessionOk, setSessionOk] = useState(false);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data } = await supabase.auth.getUser();
        if (!cancelled) {
          setSessionOk(Boolean(data.user));
        }
      } catch {
        if (!cancelled) setSessionOk(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("A palavra-passe deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== password2) {
      setError("As duas palavras-passe não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: upErr } = await supabase.auth.updateUser({ password });
      if (upErr) {
        setError(upErr.message);
        return;
      }
      await supabase.auth.signOut();
      router.push("/entrar?msg=password_updated");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return <p className="muted">A validar sessão de recuperação…</p>;
  }

  if (!sessionOk) {
    return (
      <div className="stack">
        <p className="alert alert--error">
          Este link já não é válido ou expirou. Volta a pedir recuperação ou entra normalmente com a tua password.
        </p>
        <p className="row">
          <Link href="/entrar/recuperar" className="btn btn--primary">
            Pedir novo link
          </Link>
          <Link href="/entrar" className="btn">
            Ir para entrar
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="form">
      <label className="field">
        Nova palavra-passe (mín. 8 caracteres)
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          disabled={loading}
        />
      </label>
      <label className="field">
        Repetir palavra-passe
        <input
          type="password"
          autoComplete="new-password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          required
          minLength={8}
          disabled={loading}
        />
      </label>
      {error ? (
        <p role="alert" className="alert alert--error">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={loading} className="btn btn--primary btn--lg btn--block">
        {loading ? "A guardar…" : "Guardar nova palavra-passe"}
      </button>
    </form>
  );
}
