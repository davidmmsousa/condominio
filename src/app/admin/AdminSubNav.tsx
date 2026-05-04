"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items: { href: string; label: string; exact?: boolean }[] = [
  { href: "/admin", label: "Início admin", exact: true },
  { href: "/admin/unidades", label: "Frações" },
  { href: "/admin/moradores", label: "Moradores" },
  { href: "/admin/cobrancas", label: "Cobranças" },
  { href: "/admin/pagamentos", label: "Pagamentos" },
  { href: "/admin/fundo-caixa", label: "Fundo de caixa" },
  { href: "/admin/contas-correntes", label: "Contas correntes" },
  { href: "/admin/despesas", label: "Despesas" },
  { href: "/admin/relatorios", label: "Relatórios" },
];

function linkActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSubNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="admin-nav" aria-label="Secções de administração">
      {items.map(({ href, label, exact }) => (
        <Link key={href} href={href} className={linkActive(pathname, href, exact) ? "is-active" : undefined}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
