import { CondominiumIbanForm } from "@/app/admin/CondominiumIbanForm";
import { ensureSingletonCondominiumId } from "@/lib/singletonCondominium";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import Link from "next/link";

export default async function AdminPage() {
  const supabase = await createServerRouteSupabaseClient();
  let paymentIban: string | null = null;
  let ibanLoadError: string | null = null;

  try {
    const cid = await ensureSingletonCondominiumId(supabase);
    const { data, error } = await supabase.from("condominiums").select("payment_iban").eq("id", cid).maybeSingle();
    if (error) {
      if (error.message.includes("payment_iban")) {
        ibanLoadError =
          "A coluna payment_iban ainda não existe — corre supabase/patch_condominiums_payment_iban.sql no Supabase.";
      } else {
        ibanLoadError = error.message;
      }
    } else {
      paymentIban = data?.payment_iban?.trim() || null;
    }
  } catch (e) {
    ibanLoadError = e instanceof Error ? e.message : "Erro ao ler IBAN.";
  }

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
      <section
        style={{
          marginTop: 36,
          padding: 20,
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          maxWidth: 560,
          background: "#fafafa",
        }}
      >
        <h2 className="page-title" style={{ fontSize: "1.15rem", marginBottom: 8 }}>
          IBAN (portal morador)
        </h2>
        {ibanLoadError ? (
          <p style={{ color: "#92400e", fontSize: 14, lineHeight: 1.5 }}>{ibanLoadError}</p>
        ) : (
          <CondominiumIbanForm currentIban={paymentIban} />
        )}
      </section>
    </main>
  );
}
