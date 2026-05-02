"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  redirectFromQuery: string | null;
  infoBanner?: string | null;
};

export function LoginForm({ redirectFromQuery, infoBanner }: Props) {
  const router = useRouter();
  const redirect = redirectFromQuery;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: signErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signErr) {
        setError(signErr.message);
        return;
      }

      const { data: profile, error: profileErr } = await supabase.from("profiles").select("role").maybeSingle();

      if (profileErr || !profile) {
        await supabase.auth.signOut();
        setError(profileErr?.message ?? "Conta sem perfil. Contacta o administrador.");
        return;
      }

      if (redirect) {
        router.push(redirect);
        router.refresh();
        return;
      }

      if (profile.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/minha-conta");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao entrar. Abre a consola do browser (F12) se precisares de mais detalhe.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: "grid",
        gap: 14,
        maxWidth: 360,
        padding: "8px 0",
      }}
    >
      {infoBanner ? (
        <p role="status" style={{ margin: 0, fontSize: 14, color: "#065f46", background: "#d1fae5", padding: 12, borderRadius: 8 }}>
          {infoBanner}
        </p>
      ) : null}
      <label style={{ display: "grid", gap: 6 }}>
        <span>Email</span>
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
      <div style={{ textAlign: "right", marginBottom: -6 }}>
        <Link href="/entrar/recuperar" style={{ fontSize: 14, color: "#2563eb" }}>
          Esqueci-me da palavra-passe
        </Link>
      </div>
      <label style={{ display: "grid", gap: 6 }}>
        <span>Palavra-passe</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
        {loading ? "A entrar…" : "Entrar"}
      </button>
    </form>
  );
}
