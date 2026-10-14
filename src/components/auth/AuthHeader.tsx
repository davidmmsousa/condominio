import { BrandMark, Icon } from "@/components/ui/Icon";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  resident: "Morador",
};

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

  const initial = (user?.email ?? "?").trim().charAt(0) || "?";

  return (
    <header className="app-header">
      <div className="app-header__left">
        <Link href="/" className="app-brand">
          <BrandMark />
          Condomínio
        </Link>
        <nav className="app-header__nav" aria-label="Navegação principal">
          {user ? (
            <>
              {roleLabel === "admin" ? (
                <Link href="/admin">
                  <Icon name="shield" size={16} />
                  Administração
                </Link>
              ) : null}
              {roleLabel === "resident" ? (
                <Link href="/minha-conta">
                  <Icon name="user" size={16} />
                  Minha conta
                </Link>
              ) : null}
            </>
          ) : (
            <Link href="/entrar">
              <Icon name="user" size={16} />
              Entrar
            </Link>
          )}
        </nav>
      </div>
      {user ? (
        <div className="app-header__meta">
          <div className="user-chip">
            <span className="user-chip__avatar" aria-hidden="true">
              {initial}
            </span>
            <span className="user-chip__text">
              <span className="user-chip__email">{user.email}</span>
              {roleLabel ? <span className="user-chip__role">{ROLE_LABELS[roleLabel] ?? roleLabel}</span> : null}
            </span>
          </div>
          <LogoutButton />
        </div>
      ) : null}
    </header>
  );
}
