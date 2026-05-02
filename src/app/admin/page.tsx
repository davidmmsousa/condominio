import Link from "next/link";
import type { CSSProperties } from "react";

const cardStyle: CSSProperties = {
  display: "block",
  padding: 20,
  borderRadius: 10,
  border: "1px solid #e5e5e5",
  textDecoration: "none",
  color: "#111",
  background: "#fff",
};

export default function AdminPage() {
  return (
    <main style={{ paddingTop: 24 }}>
      <h1 style={{ marginTop: 0 }}>Administração</h1>
      <p style={{ color: "#555", maxWidth: 640 }}>
        Configura frações, moradores, gera quotas mensais e regista pagamentos. Tudo fica na base Supabase com
        regras de acesso (RLS).
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
          marginTop: 24,
        }}
      >
        <Link href="/admin/unidades" style={cardStyle}>
          <strong>Frações</strong>
          <div style={{ fontSize: 14, color: "#555", marginTop: 6 }}>Códigos e permilagens</div>
        </Link>
        <Link href="/admin/moradores" style={cardStyle}>
          <strong>Moradores</strong>
          <div style={{ fontSize: 14, color: "#555", marginTop: 6 }}>Contactos por fração</div>
        </Link>
        <Link href="/admin/cobrancas" style={cardStyle}>
          <strong>Cobranças</strong>
          <div style={{ fontSize: 14, color: "#555", marginTop: 6 }}>Quotas e extraordinárias</div>
        </Link>
        <Link href="/admin/pagamentos" style={cardStyle}>
          <strong>Pagamentos</strong>
          <div style={{ fontSize: 14, color: "#555", marginTop: 6 }}>Alocação automática</div>
        </Link>
        <Link href="/admin/relatorios" style={cardStyle}>
          <strong>Relatórios</strong>
          <div style={{ fontSize: 14, color: "#555", marginTop: 6 }}>
            CSV, relatório final e novo ano operacional
          </div>
        </Link>
      </div>
    </main>
  );
}
