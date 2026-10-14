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
    <form onSubmit={onSubmit} className="form">
      {infoBanner ? (
        <p role="status" className="alert alert--success">
          {infoBanner}
        </p>
      ) : null}
      <label className="field">
        Email
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </label>
      <label className="field">
        Palavra-passe
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </label>
      <Link href="/entrar/recuperar" className="auth-forgot">
        Esqueci-me da palavra-passe
      </Link>
      {error ? (
        <p role="alert" className="alert alert--error">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={loading} className="btn btn--primary btn--lg btn--block">
        {loading ? "A entrar…" : "Entrar"}
      </button>
    </form>
  );
}
