import Link from "next/link";

/** Placeholder rápido enquanto cookies/sessão resolvem — evita erros ao carregar layout. */
export function AuthHeaderFallback() {
  return (
    <header className="app-header">
      <div className="app-header__left">
        <Link href="/" className="app-brand">
          Condomínio
        </Link>
      </div>
      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>A carregar…</span>
    </header>
  );
}
