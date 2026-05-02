import Link from "next/link";

/** Placeholder rápido enquanto cookies/sessão resolvem — evita erros ao carregar layout. */
export function AuthHeaderFallback() {
  return (
    <header
      style={{
        borderBottom: "1px solid #e5e5e5",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <Link href="/" style={{ fontWeight: 600, color: "#111", textDecoration: "none" }}>
        Condomínio
      </Link>
      <span style={{ fontSize: 14, color: "#999" }}>A carregar…</span>
    </header>
  );
}
