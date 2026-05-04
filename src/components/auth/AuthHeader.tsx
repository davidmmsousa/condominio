import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

export async function AuthHeader() {
  const supabase = await createServerRouteSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let roleLabel: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    roleLabel = profile?.role ?? null;
  }

  return (
    <header className="app-header">
      <div className="app-header__left">
        <Link href="/" className="app-brand">
          Condomínio
        </Link>
        <nav className="app-header__nav" aria-label="Navegação principal">
          {user ? (
            <>
              {roleLabel === "admin" ? (
                <Link href="/admin">Admin</Link>
              ) : null}
              {roleLabel === "resident" ? (
                <Link href="/minha-conta">Minha conta</Link>
              ) : null}
            </>
          ) : (
            <Link href="/entrar">Entrar</Link>
          )}
        </nav>
      </div>
      {user ? (
        <div className="app-header__meta">
          <span>
            {user.email}
            {roleLabel ? ` · ${roleLabel}` : ""}
          </span>
          <LogoutButton />
        </div>
      ) : null}
    </header>
  );
}
