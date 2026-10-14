import { Icon } from "@/components/ui/Icon";
import Link from "next/link";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { formatCents } from "@/lib/money";
import { CreateCategoryForm } from "./CreateCategoryForm";
import { EXPENSE_FUNDING_LABELS, type ExpenseFunding } from "@/lib/treasury/types";
import { RegisterExpenseSection } from "./RegisterExpenseSection";
import { DeleteCategoryButton } from "./DeleteCategoryButton";
import { DeleteExpenseButton } from "./DeleteExpenseButton";

export default async function DespesasAdminPage() {
  const supabase = await createServerRouteSupabaseClient();
  const { data: categories } = await supabase.from("expense_categories").select("id, name").order("name");
  const { data: units } = await supabase.from("units").select("id, code").order("code");

  const { data: expenses } = await supabase
    .from("expenses")
    .select("id, occurred_on, amount_cents, vendor, note, paid_from, payer_unit_id, expense_categories ( name )")
    .order("occurred_on", { ascending: false })
    .limit(100);

  type ERow = {
    id: string;
    occurred_on: string;
    amount_cents: number;
    vendor: string | null;
    note: string | null;
    paid_from: string | null;
    payer_unit_id: string | null;
    expense_categories: { name: string } | null;
  };

  const expenseRows = (expenses ?? []) as unknown as ERow[];
  const unitCodeById = new Map((units ?? []).map((u) => [u.id, u.code]));

  return (
    <main>
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Financeiro</p>
          <h1 className="page-title">Despesas e rubricas</h1>
          <p className="page-lead">
            As <strong>rubricas</strong> classificam custos (água, eletricidade, elevador, limpeza, …). Cada{" "}
            <strong>fatura</strong> fica com referência, data, valor e rubrica; indica se o custo saiu do{" "}
            <strong>numerário</strong>, da <strong>conta à ordem</strong>, da <strong>conta a prazo</strong> ou se foi{" "}
            <strong>pago por um morador</strong> (gera acerto na conta corrente dessa fração). Os dados entram nos
            relatórios CSV e no <Link href="/admin/fundo-caixa" className="text-link">fundo de caixa</Link>.
          </p>
        </div>
      </header>

      <div className="card-grid">
        <section className="card">
          <h2 className="card__title">Rubricas</h2>
          <CreateCategoryForm />
          {!categories?.length ? (
            <p className="muted small" style={{ margin: 0 }}>
              Ainda não há rubricas. Adiciona a primeira (ex.: Água).
            </p>
          ) : (
            <ul className="list">
              {categories.map((c) => (
                <li key={c.id} className="list__item">
                  <span className="list__title">{c.name}</span>
                  <DeleteCategoryButton categoryId={c.id} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h2 className="card__title">Registar fatura / despesa</h2>
          <RegisterExpenseSection categories={categories ?? []} units={units ?? []} />
        </section>
      </div>

      <section className="section">
        <h2 className="section__title">Últimas despesas</h2>
        {!expenseRows.length ? (
          <div className="empty">
            <Icon name="tag" size={28} />
            Ainda não há despesas registadas.
          </div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Rubrica</th>
                  <th>Origem</th>
                  <th>Referência</th>
                  <th>Fornecedor</th>
                  <th className="num">Valor</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {expenseRows.map((r) => (
                  <tr key={r.id}>
                    <td className="nowrap">{r.occurred_on}</td>
                    <td>
                      <span className="badge">{r.expense_categories?.name ?? "—"}</span>
                    </td>
                    <td className="is-muted">
                      {!r.paid_from
                        ? "—"
                        : `${EXPENSE_FUNDING_LABELS[r.paid_from as ExpenseFunding] ?? r.paid_from}${
                            r.paid_from === "morador" && r.payer_unit_id
                              ? ` · ${unitCodeById.get(r.payer_unit_id) ?? "?"}`
                              : ""
                          }`}
                    </td>
                    <td>{r.note ?? "—"}</td>
                    <td className="is-muted">{r.vendor ?? "—"}</td>
                    <td className="num">{formatCents(r.amount_cents)}</td>
                    <td>
                      <DeleteExpenseButton expenseId={r.id} />
                    </td>
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
