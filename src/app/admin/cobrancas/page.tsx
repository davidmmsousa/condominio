import { Icon } from "@/components/ui/Icon";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { formatCents } from "@/lib/money";
import { AdjustQuotasForm } from "./AdjustQuotasForm";
import { GenerateQuotasForm } from "./GenerateQuotasForm";
import { ManualChargeForm } from "./ManualChargeForm";

export default async function CobrancasAdminPage() {
  const supabase = await createServerRouteSupabaseClient();
  const { data: units } = await supabase.from("units").select("id, code").order("code");
  const { data: charges } = await supabase
    .from("charges")
    .select("id, kind, amount_cents, due_date, reference_month, units ( code )")
    .order("due_date", { ascending: false })
    .limit(80);

  type CRow = {
    id: string;
    kind: string;
    amount_cents: number;
    due_date: string;
    reference_month: string | null;
    units: { code: string } | null;
  };

  const list = (charges ?? []) as unknown as CRow[];

  return (
    <main>
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Financeiro</p>
          <h1 className="page-title">Cobranças</h1>
          <p className="page-lead">Gera as quotas do mês ou regista cobranças avulsas na conta corrente das frações.</p>
        </div>
      </header>

      <div className="card-grid">
        <section className="card">
          <GenerateQuotasForm disabled={!units?.length} />
        </section>
        <section className="card">
          <ManualChargeForm units={units ?? []} />
        </section>
        <section className="card">
          <AdjustQuotasForm disabled={!units?.length} />
        </section>
      </div>

      <section className="section">
        <h2 className="section__title">Últimas cobranças</h2>
        {!list.length ? (
          <div className="empty">
            <Icon name="receipt" size={28} />
            Sem cobranças ainda.
          </div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fração</th>
                  <th>Tipo</th>
                  <th className="num">Valor</th>
                  <th>Vencimento</th>
                  <th>Referência</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.units?.code ?? "—"}</strong>
                    </td>
                    <td>
                      <span className={c.kind === "extraordinaria" ? "badge badge--warning" : "badge"}>
                        {c.kind === "extraordinaria" ? "Extraordinária" : c.kind === "corrente" ? "Quota" : c.kind}
                      </span>
                    </td>
                    <td className="num">{formatCents(c.amount_cents)}</td>
                    <td className="nowrap">{c.due_date}</td>
                    <td className="is-muted">{c.reference_month ? c.reference_month.slice(0, 7) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
