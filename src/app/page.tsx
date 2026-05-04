import Link from "next/link";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";

export default async function HomePage() {
  const supabase = await createServerRouteSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle()
    : { data: null };

  return (
    <main className="page-shell page-shell--compact">
      <h1 className="page-title">Gestão do Condomínio</h1>
      <p className="page-lead">MVP: admin (quotas, pagamentos, recibos) + portal morador (consulta).</p>
      {user && profile?.role === "admin" ? (
        <p>
          <Link href="/admin" className="text-link">
            Ir para admin →
          </Link>
        </p>
      ) : null}
      {user && profile?.role === "resident" ? (
        <p>
          <Link href="/minha-conta" className="text-link">
            Ir para minha conta →
          </Link>
        </p>
      ) : null}
      {!user ? (
        <p>
          <Link href="/entrar" className="text-link">
            Entrar →
          </Link>
        </p>
      ) : null}
      <ul className="home-actions">
        <li>
          <Link href="/admin">/admin — Painel administrador</Link>
        </li>
        <li>
          <Link href="/minha-conta">/minha-conta — Portal do morador</Link>
        </li>
      </ul>
    </main>
  );
}
