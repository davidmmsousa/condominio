import Link from "next/link";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { formatCents } from "@/lib/money";
import { CreateCategoryForm } from "./CreateCategoryForm";
import { EXPENSE_FUNDING_LABELS, type ExpenseFunding } from "@/lib/treasury/types";
import { CreateExpenseForm } from "./CreateExpenseForm";
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
    <main style={{ paddingTop: 24 }}>
      <h1 style={{ marginTop: 0 }}>Despesas e rubricas</h1>
      <p style={{ color: "#555", maxWidth: 720, lineHeight: 1.55 }}>
        As <strong>rubricas</strong> classificam custos (água, electricidade, elevador, limpeza, …). Cada{" "}
        <strong>fatura</strong> fica com referência, data, valor e rubrica; indica se o custo saiu do{" "}
        <strong>numerário</strong>, da <strong>conta à ordem</strong>, da <strong>conta a prazo</strong> ou se foi{" "}
        <strong>pago por um morador</strong> (gera acerto na conta corrente dessa fração). Os dados entram nos relatórios
        CSV e no <Link href="/admin/fundo-caixa">fundo de caixa</Link>.
      </p>

      <section
        style={{
          marginTop: 28,
          padding: 20,
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          maxWidth: 720,
          background: "#fafafa",
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Rubricas</h2>
        <CreateCategoryForm />
        {!categories?.length ? (
          <p style={{ color: "#64748b", marginBottom: 0 }}>Ainda não há rubricas. Adiciona a primeira (ex.: Água).</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {categories.map((c) => (
              <li
                key={c.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid #e5e5e5",
                  gap: 12,
                }}
              >
                <strong>{c.name}</strong>
                <DeleteCategoryButton categoryId={c.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginTop: 32, maxWidth: 720 }}>
        <h2 style={{ fontSize: 18 }}>Registar fatura / despesa</h2>
        <CreateExpenseForm categories={categories ?? []} units={units ?? []} />
      </section>

      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 18 }}>Últimas despesas</h2>
        {!expenseRows.length ? (
          <p style={{ color: "#555" }}>Ainda não há despesas registadas.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", maxWidth: 960, borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
                  <th style={{ padding: "8px 6px" }}>Data</th>
                  <th style={{ padding: "8px 6px" }}>Rubrica</th>
                  <th style={{ padding: "8px 6px" }}>Origem</th>
                  <th style={{ padding: "8px 6px" }}>Referência</th>
                  <th style={{ padding: "8px 6px" }}>Fornecedor</th>
                  <th style={{ padding: "8px 6px" }}>Valor</th>
                  <th style={{ padding: "8px 6px" }} />
                </tr>
              </thead>
              <tbody>
                {expenseRows.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>{r.occurred_on}</td>
                    <td style={{ padding: "8px 6px" }}>{r.expense_categories?.name ?? "—"}</td>
                    <td style={{ padding: "8px 6px", fontSize: 13, color: "#444" }}>
                      {!r.paid_from
                        ? "—"
                        : `${EXPENSE_FUNDING_LABELS[r.paid_from as ExpenseFunding] ?? r.paid_from}${
                            r.paid_from === "morador" && r.payer_unit_id
                              ? ` · ${unitCodeById.get(r.payer_unit_id) ?? "?"}`
                              : ""
                          }`}
                    </td>
                    <td style={{ padding: "8px 6px", color: "#333" }}>{r.note ?? "—"}</td>
                    <td style={{ padding: "8px 6px", color: "#555" }}>{r.vendor ?? "—"}</td>
                    <td style={{ padding: "8px 6px" }}>{formatCents(r.amount_cents)}</td>
                    <td style={{ padding: "8px 6px" }}>
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
