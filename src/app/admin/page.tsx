import { CondominiumIbanForm } from "@/app/admin/CondominiumIbanForm";
import { Icon } from "@/components/ui/Icon";
import { ensureSingletonCondominiumId } from "@/lib/singletonCondominium";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { formatCents } from "@/lib/money";
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

  let unitCount = 0;
  let openCents: number | null = null;
  let treasuryCents: number | null = null;
  try {
    const { count } = await supabase.from("units").select("id", { count: "exact", head: true });
    unitCount = count ?? 0;
    const [{ data: ch }, { data: al }, { data: mv }] = await Promise.all([
      supabase.from("charges").select("amount_cents"),
      supabase.from("payment_allocations").select("applied_cents"),
      supabase.from("treasury_movements").select("amount_cents"),
    ]);
    const sum = (rows: Array<Record<string, number>> | null, key: string) =>
      (rows ?? []).reduce((a, r) => a + (r[key] ?? 0), 0);
    openCents = sum(ch, "amount_cents") - sum(al, "applied_cents");
    treasuryCents = sum(mv, "amount_cents");
  } catch {
    /* indicadores são opcionais */
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

      <section className="stat-grid" aria-label="Indicadores">
        <div className="stat">
          <p className="stat__label">Frações</p>
          <p className="stat__value">{unitCount}</p>
        </div>
        <div className="stat">
          <p className="stat__label">Quotas em aberto</p>
          <p className={`stat__value ${openCents && openCents > 0 ? "stat__value--negative" : "stat__value--positive"}`}>
            {openCents === null ? "—" : formatCents(openCents)}
          </p>
        </div>
        <div className="stat">
          <p className="stat__label">Fundo de caixa</p>
          <p className="stat__value">{treasuryCents === null ? "—" : formatCents(treasuryCents)}</p>
        </div>
      </section>

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
