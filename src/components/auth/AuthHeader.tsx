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
    const { data: profile } = await supabase.from("profiles").select("role").maybeSingle();
    roleLabel = profile?.role ?? null;
  }

  return (
    <header
      style={{
        borderBottom: "1px solid #e5e5e5",
        padding: "12px 24px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 12,
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/" style={{ fontWeight: 600, color: "#111", textDecoration: "none" }}>
          Condomínio
        </Link>
        {user ? (
          <>
            {roleLabel === "admin" ? (
              <Link href="/admin" style={{ color: "#333" }}>
                Admin
              </Link>
            ) : null}
            {roleLabel === "resident" ? (
              <Link href="/minha-conta" style={{ color: "#333" }}>
                Minha conta
              </Link>
            ) : null}
          </>
        ) : (
          <Link href="/entrar" style={{ color: "#333" }}>
            Entrar
          </Link>
        )}
      </div>
      {user ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, color: "#555" }}>
            {user.email}
            {roleLabel ? ` · ${roleLabel}` : ""}
          </span>
          <LogoutButton />
        </div>
      ) : null}
    </header>
  );
}
