"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

function safeRedirectParam(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = safeRedirectParam(params.get("redirect"));

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
        setError("Conta sem perfil. Contacta o administrador.");
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
