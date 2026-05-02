import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { safeRedirectParam } from "./redirectParam";
import { signOutServer } from "./actions";
import { LoginForm } from "./LoginForm";

type Props = {
  searchParams: Promise<{ redirect?: string | string[]; msg?: string | string[] }>;
};

export default async function EntrarPage({ searchParams }: Props) {
  const sp = await searchParams;
  const raw =
    typeof sp.redirect === "string" ? sp.redirect : Array.isArray(sp.redirect) ? sp.redirect[0] : undefined;
  const redirectFromQuery = safeRedirectParam(raw ?? null);
  const msgRaw =
    typeof sp.msg === "string" ? sp.msg : Array.isArray(sp.msg) ? sp.msg[0] : undefined;
  const infoBanner =
    msgRaw === "password_updated"
      ? "Palavra-passe atualizada. Podes entrar com a nova password."
      : null;

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
      <LoginForm redirectFromQuery={redirectFromQuery} infoBanner={infoBanner} />
      <p style={{ marginTop: 24 }}>
        <Link href="/">← Voltar ao início</Link>
      </p>
    </main>
  );
}
