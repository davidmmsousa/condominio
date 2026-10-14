import { CondominiumIbanForm } from "@/app/admin/CondominiumIbanForm";
import { Icon } from "@/components/ui/Icon";
import { ensureSingletonCondominiumId } from "@/lib/singletonCondominium";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import Link from "next/link";
import { ADMIN_NAV_GROUPS } from "./navItems";

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
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Painel</p>
          <h1 className="page-title">Administração</h1>
          <p className="page-lead">
            Configura frações e moradores, gera quotas mensais e regista pagamentos. Os dados ficam na base Supabase
            com regras de acesso (RLS).
          </p>
        </div>
      </header>

      {ADMIN_NAV_GROUPS.map((group) => (
        <section key={group.title} className="admin-group" aria-label={group.title}>
          <h2 className="admin-group__title">{group.title}</h2>
          <div className="admin-tile-grid">
            {group.items.map((item) => (
              <Link key={item.href} href={item.href} className="admin-tile">
                <span className="admin-tile__icon">
                  <Icon name={item.icon} size={22} />
                </span>
                <span className="admin-tile__body">
                  <strong>{item.label}</strong>
                  <span className="admin-tile__desc">{item.description}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className="card card--narrow section">
        <h2 className="card__title">IBAN do portal do morador</h2>
        <p className="card__lead">Aparece no portal quando o morador escolhe «Ver IBAN».</p>
        {ibanLoadError ? (
          <p className="alert alert--warning">{ibanLoadError}</p>
        ) : (
          <CondominiumIbanForm currentIban={paymentIban} />
        )}
      </section>
    </main>
  );
}
