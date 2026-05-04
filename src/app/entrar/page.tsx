import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { safeRedirectParam } from "./redirectParam";
import { signOutServer } from "./actions";
import { LoginForm } from "./LoginForm";
import { AuthShell } from "./AuthShell";

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
    const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
    if (profile?.role === "admin") redirect("/admin");
    if (profile?.role === "resident") redirect("/minha-conta");

    return (
      <AuthShell eyebrow="Sessão" title="Conta sem perfil" lead="Este utilizador não tem linha em profiles. Contacta o administrador ou usa outra conta.">
        <form action={signOutServer}>
          <button type="submit" className="btn" style={{ marginTop: 8, fontSize: 15 }}>
            Terminar sessão
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Bem-vindo"
      title="Entrar na app"
      lead="Utiliza o email da tua conta. Se recuperaste a password recentemente, o link só funciona até expirar — pede novo em “Esqueci-me”."
    >
      <LoginForm redirectFromQuery={redirectFromQuery} infoBanner={infoBanner} />
      <p style={{ marginTop: 20, marginBottom: 0, textAlign: "center" as const }}>
        <Link href="/" className="text-link" style={{ fontSize: 14 }}>
          ← Voltar ao início
        </Link>
      </p>
    </AuthShell>
  );
}
