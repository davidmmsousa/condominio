import { Icon } from "@/components/ui/Icon";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { formatCents } from "@/lib/money";
import Link from "next/link";
import { PaymentForm } from "./PaymentForm";
import { ResendReceiptEmailButton } from "./ResendReceiptEmailButton";
import { VoidPaymentRowForm } from "./VoidPaymentRowForm";

export default async function PagamentosAdminPage() {
  const supabase = await createServerRouteSupabaseClient();
  const { data: units } = await supabase.from("units").select("id, code").order("code");
  const { data: payments } = await supabase
    .from("payments")
    .select("id, paid_at, amount_cents, method, note, units ( code )")
    .order("paid_at", { ascending: false })
    .limit(40);

  type PRow = {
    id: string;
    paid_at: string;
    amount_cents: number;
    method: string | null;
    note: string | null;
    units: { code: string } | null;
  };

  const list = (payments ?? []) as unknown as PRow[];

  return (
    <main>
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Financeiro</p>
          <h1 className="page-title">Pagamentos</h1>
          <p className="page-lead">Regista pagamentos dos moradores e emite os recibos.</p>
        </div>
        <Link href="/admin/pagamentos/tabela-geral" className="btn">
          Tabela geral
          <Icon name="arrowRight" size={16} />
        </Link>
      </header>

      <section className="card" style={{ maxWidth: 760 }}>
        <PaymentForm units={units ?? []} />
      </section>
      <p className="small muted" style={{ maxWidth: 720, marginTop: 12 }}>
        Pagamento errado? Na tabela abaixo podes <strong>anular</strong> (reverte alocações e tesouraria).
        Opcionalmente enviamos email ao morador a desconsiderar o recibo anterior.
      </p>

      <section className="section">
        <h2 className="section__title">Últimos pagamentos</h2>
        {!list.length ? (
          <div className="empty">
            <Icon name="wallet" size={28} />
            Sem pagamentos registados.
          </div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Fração</th>
                  <th className="num">Valor</th>
                  <th>Meio</th>
                  <th>Nota</th>
                  <th style={{ minWidth: 140 }}>Recibo</th>
                  <th style={{ minWidth: 200 }}>Anulação</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id}>
                    <td className="is-top nowrap">{new Date(p.paid_at).toLocaleString("pt-PT")}</td>
                    <td className="is-top">
                      <strong>{p.units?.code ?? "—"}</strong>
                    </td>
                    <td className="is-top num">{formatCents(p.amount_cents)}</td>
                    <td className="is-top is-muted">{p.method ?? "—"}</td>
                    <td className="is-top is-muted">{p.note ?? "—"}</td>
                    <td className="is-top">
                      <div className="stack" style={{ gap: 8, justifyItems: "start" }}>
                        <a
                          href={`/api/admin/receipts/${p.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn--sm"
                        >
                          <Icon name="download" size={15} />
                          PDF
                        </a>
                        <ResendReceiptEmailButton paymentId={p.id} />
                      </div>
                    </td>
                    <td className="is-top">
                      <VoidPaymentRowForm
                        paymentId={p.id}
                        fractionCode={p.units?.code ?? "—"}
                        amountFormatted={formatCents(p.amount_cents)}
                        paidAtLabel={new Date(p.paid_at).toLocaleString("pt-PT")}
                      />
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
