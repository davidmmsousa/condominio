import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { signOutServer } from "./actions";
import { LoginForm } from "./LoginForm";

export default async function EntrarPage() {
  const supabase = await createServerRouteSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").maybeSingle();
    if (profile?.role === "admin") redirect("/admin");
    if (profile?.role === "resident") redirect("/minha-conta");

    return (
      <main style={{ padding: 24, maxWidth: 480 }}>
        <h1 style={{ marginTop: 0 }}>Conta sem perfil</h1>
        <p style={{ color: "#444" }}>
          Este utilizador não tem linha em <code>profiles</code>. Fecha sessão e tenta outra conta, ou pede apoio ao
          administrador.
        </p>
        <form action={signOutServer}>
          <button
            type="submit"
            style={{
              marginTop: 16,
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Sair
          </button>
        </form>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 480 }}>
      <h1 style={{ marginTop: 0 }}>Entrar</h1>
      <p style={{ color: "#444" }}>Utiliza a conta criada no Supabase Auth.</p>
      <Suspense fallback={<p>A carregar…</p>}>
        <LoginForm />
      </Suspense>
      <p style={{ marginTop: 24 }}>
        <Link href="/">← Voltar ao início</Link>
      </p>
    </main>
  );
}
