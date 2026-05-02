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

      const {
        data: { user: signedUser },
      } = await supabase.auth.getUser();
      if (!signedUser?.id) {
        setError("Sessão inválida após entrar.");
        await supabase.auth.signOut();
        return;
      }
      const {
        data: profile,
        error: profileErr,
      } = await supabase.from("profiles").select("role").eq("user_id", signedUser.id).maybeSingle();

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
        gap: 16,
        width: "100%",
        maxWidth: "100%",
        padding: "4px 0 0",
      }}
    >
      {infoBanner ? (
        <p role="status" style={{ margin: 0, fontSize: 14, color: "#065f46", background: "#d1fae5", padding: 12, borderRadius: 8 }}>
          {infoBanner}
        </p>
      ) : null}
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Email</span>
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
            outlineOffset: 2,
          }}
        />
      </label>
      <div style={{ textAlign: "right", marginTop: -4 }}>
        <Link href="/entrar/recuperar" style={{ fontSize: 13, color: "#4f46e5", fontWeight: 600 }}>
          Esqueci-me da palavra-passe
        </Link>
      </div>
      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Palavra-passe</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #cbd5e1",
            fontSize: 16,
            background: loading ? "#f8fafc" : "#fff",
            outlineOffset: 2,
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
          marginTop: 4,
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
        {loading ? "A entrar…" : "Entrar"}
      </button>
    </form>
  );
}
