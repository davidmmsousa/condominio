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
    <main style={{ padding: 24, maxWidth: 900 }}>
      <h1>Gestão do Condomínio</h1>
      <p>
        MVP: admin (quotas, pagamentos, recibos) + portal morador (consulta).
      </p>
      {user && profile?.role === "admin" ? (
        <p>
          <Link href="/admin">Ir para admin →</Link>
        </p>
      ) : null}
      {user && profile?.role === "resident" ? (
        <p>
          <Link href="/minha-conta">Ir para minha conta →</Link>
        </p>
      ) : null}
      {!user ? (
        <p>
          <Link href="/entrar">Entrar →</Link>
        </p>
      ) : null}
      <ul style={{ marginTop: 16 }}>
        <li>
          <Link href="/admin">/admin</Link> (só administrador)
        </li>
        <li>
          <Link href="/minha-conta">/minha-conta</Link> (só morador)
        </li>
      </ul>
    </main>
  );
}

