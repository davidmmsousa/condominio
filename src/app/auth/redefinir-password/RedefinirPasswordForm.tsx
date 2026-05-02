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
    return <p>A validar sessão…</p>;
  }

  if (!sessionOk) {
    return (
      <div>
        <p style={{ color: "#b00020" }}>
          Este link já não é válido ou expirou. Volta a pedir recuperação ou entra normamente com a tua password.
        </p>
        <p>
          <Link href="/entrar/recuperar">Pedir novo link</Link>
          {" · "}
          <Link href="/entrar">Ir para entrar</Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 14, maxWidth: 360 }}>
      <label style={{ display: "grid", gap: 6 }}>
        <span>Nova palavra-passe (mín. 8 caracteres)</span>
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          disabled={loading}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: 16,
          }}
        />
      </label>
      <label style={{ display: "grid", gap: 6 }}>
        <span>Repetir palavra-passe</span>
        <input
          type="password"
          autoComplete="new-password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          required
          minLength={8}
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
        {loading ? "A guardar…" : "Guardar nova palavra-passe"}
      </button>
    </form>
  );
}
