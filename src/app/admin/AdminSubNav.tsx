import Link from "next/link";
import type { CSSProperties } from "react";

const linkStyle: CSSProperties = {
  color: "#333",
  textDecoration: "none",
  padding: "6px 10px",
  borderRadius: 6,
  fontSize: 14,
};

export function AdminSubNav() {
  return (
    <nav
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        padding: "12px 24px",
        borderBottom: "1px solid #e5e5e5",
        background: "#fafafa",
      }}
    >
      <Link href="/admin" style={linkStyle}>
        Início admin
      </Link>
      <Link href="/admin/unidades" style={linkStyle}>
        Frações
      </Link>
      <Link href="/admin/moradores" style={linkStyle}>
        Moradores
      </Link>
      <Link href="/admin/cobrancas" style={linkStyle}>
        Cobranças
      </Link>
      <Link href="/admin/pagamentos" style={linkStyle}>
        Pagamentos
      </Link>
      <Link href="/admin/despesas" style={linkStyle}>
        Despesas
      </Link>
      <Link href="/admin/relatorios" style={linkStyle}>
        Relatórios
      </Link>
    </nav>
  );
}
