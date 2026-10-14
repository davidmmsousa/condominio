import { BrandMark } from "@/components/ui/Icon";
import Link from "next/link";

/** Placeholder rápido enquanto cookies/sessão resolvem — evita erros ao carregar layout. */
export function AuthHeaderFallback() {
  return (
    <header className="app-header">
      <div className="app-header__left">
        <Link href="/" className="app-brand">
          <BrandMark />
          Condomínio
        </Link>
      </div>
      <span className="small muted">A carregar…</span>
    </header>
  );
}
