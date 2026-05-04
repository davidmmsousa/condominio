import Link from "next/link";

export default function AdminPage() {
  return (
    <main>
      <h1 className="page-title">Administração</h1>
      <p className="page-lead" style={{ marginBottom: 0 }}>
        Configura frações, moradores, gera quotas mensais e regista pagamentos. Tudo fica na base Supabase com regras
        de acesso (RLS).
      </p>
      <div className="admin-tile-grid">
        <Link href="/admin/unidades" className="admin-tile">
          <strong>Frações</strong>
          <span>Códigos e permilagens</span>
        </Link>
        <Link href="/admin/moradores" className="admin-tile">
          <strong>Moradores</strong>
          <span>Contactos por fração</span>
        </Link>
        <Link href="/admin/cobrancas" className="admin-tile">
          <strong>Cobranças</strong>
          <span>Quotas e extraordinárias</span>
        </Link>
        <Link href="/admin/pagamentos" className="admin-tile">
          <strong>Pagamentos</strong>
          <span>Alocação automática</span>
        </Link>
        <Link href="/admin/fundo-caixa" className="admin-tile">
          <strong>Fundo de caixa</strong>
          <span>Numerário, banco, prazo e movimentos</span>
        </Link>
        <Link href="/admin/contas-correntes" className="admin-tile">
          <strong>Contas correntes</strong>
          <span>Extrato por fração</span>
        </Link>
        <Link href="/admin/despesas" className="admin-tile">
          <strong>Despesas</strong>
          <span>Rubricas e faturas (água, luz, …)</span>
        </Link>
        <Link href="/admin/relatorios" className="admin-tile">
          <strong>Relatórios</strong>
          <span>CSV, relatório final e novo ano operacional</span>
        </Link>
      </div>
    </main>
  );
}
