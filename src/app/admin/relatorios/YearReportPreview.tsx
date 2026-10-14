import { Icon } from "@/components/ui/Icon";
import Link from "next/link";
import { formatCents } from "@/lib/money";
import type { YearReportDataset } from "@/lib/reports/yearReportDataset";

const apiBase = "/api/admin/reports";

function ReportSection({
  title,
  downloadHref,
  downloadLabel,
  children,
}: {
  title: string;
  downloadHref: string;
  downloadLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="section">
      <div className="section__head">
        <h3 className="section__title">{title}</h3>
        <a href={downloadHref} className="btn btn--sm">
          <Icon name="download" size={15} />
          {downloadLabel}
        </a>
      </div>
      {children}
    </div>
  );
}

function TableScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="data-table-wrap data-table-wrap--scroll">
      {children}
    </div>
  );
}

export function YearReportPreview({ year, data }: { year: number; data: YearReportDataset }) {
  const totalCharged = data.chargeRows.reduce((s, r) => s + r.amount_cents, 0);
  const totalPaid = data.payRows.reduce((s, r) => s + r.amount_cents, 0);
  const totalExp = data.expRows.reduce((s, r) => s + r.amount_cents, 0);

  return (
    <section className="section">
      <div className="section__head">
        <h2 className="section__title" style={{ fontSize: "1.35rem" }}>
          Visão do ano {year}
        </h2>
        <a href={`${apiBase}?year=${year}&segment=full`} target="_blank" rel="noopener noreferrer" className="btn btn--sm">
          <Icon name="file" size={15} />
          Relatório completo (.txt)
        </a>
      </div>
      <p className="muted small" style={{ maxWidth: 820 }}>
        Pré-visualização com os mesmos critérios dos exports (cobranças por vencimento no ano; pagamentos por data de
        registo; despesas por data da fatura). Tabelas com scroll se a lista for longa.
      </p>

      <div className="stat-grid">
        <div className="stat">
          <p className="stat__label">Total cobranças</p>
          <p className="stat__value">{formatCents(totalCharged)}</p>
        </div>
        <div className="stat">
          <p className="stat__label">Total pagamentos</p>
          <p className="stat__value">{formatCents(totalPaid)}</p>
        </div>
        <div className="stat">
          <p className="stat__label">Total despesas</p>
          <p className="stat__value">{formatCents(totalExp)}</p>
        </div>
      </div>

      <ReportSection
        title="Resumo por fração"
        downloadHref={`${apiBase}?year=${year}&segment=summary`}
        downloadLabel="CSV resumo"
      >
        {!data.summaryRows.length ? (
          <p className="empty">Sem linhas (sem cobranças nem pagamentos neste ano).</p>
        ) : (
          <TableScroll>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fração</th>
                  <th className="num">Cobranças</th>
                  <th className="num">Pagos</th>
                  <th className="num">Diferença</th>
                </tr>
              </thead>
              <tbody>
                {data.summaryRows.map((r) => (
                  <tr key={r.code}>
                    <td>{r.code}</td>
                    <td className="num">{formatCents(r.charged)}</td>
                    <td className="num">{formatCents(r.paid)}</td>
                    <td className="num">{formatCents(r.charged - r.paid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}
      </ReportSection>

      <ReportSection
        title="Cobranças"
        downloadHref={`${apiBase}?year=${year}&segment=charges`}
        downloadLabel="CSV cobranças"
      >
        {!data.chargeRows.length ? (
          <p className="empty">Sem cobranças com vencimento neste ano civil.</p>
        ) : (
          <TableScroll>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fração</th>
                  <th>Vencimento</th>
                  <th>Tipo</th>
                  <th>Mês ref.</th>
                  <th className="num">Valor</th>
                </tr>
              </thead>
              <tbody>
                {data.chargeRows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.units?.code ?? "—"}</td>
                    <td>{r.due_date}</td>
                    <td>{r.kind}</td>
                    <td>{r.reference_month ? r.reference_month.slice(0, 7) : "—"}</td>
                    <td className="num">{formatCents(r.amount_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}
      </ReportSection>

      <ReportSection
        title="Pagamentos"
        downloadHref={`${apiBase}?year=${year}&segment=payments`}
        downloadLabel="CSV pagamentos"
      >
        {!data.payRows.length ? (
          <p className="empty">Sem pagamentos registados neste ano civil.</p>
        ) : (
          <TableScroll>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fração</th>
                  <th>Data</th>
                  <th className="num">Valor</th>
                  <th>Meio</th>
                  <th>Tesouraria</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                {data.payRows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.units?.code ?? "—"}</td>
                    <td>{new Date(r.paid_at).toLocaleString("pt-PT")}</td>
                    <td className="num">{formatCents(r.amount_cents)}</td>
                    <td>{r.method?.trim() ? r.method : "—"}</td>
                    <td>{r.received_in?.trim() ? r.received_in : "—"}</td>
                    <td>{r.note?.trim() ? r.note : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}
      </ReportSection>

      <ReportSection
        title="Despesas"
        downloadHref={`${apiBase}?year=${year}&segment=expenses`}
        downloadLabel="CSV despesas"
      >
        {!data.expRows.length ? (
          <p className="empty">Sem despesas com data neste ano civil.</p>
        ) : (
          <TableScroll>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rubrica</th>
                  <th>Data</th>
                  <th className="num">Valor</th>
                  <th>Origem</th>
                  <th>Fração</th>
                  <th>Fornecedor</th>
                  <th>Ref.</th>
                </tr>
              </thead>
              <tbody>
                {data.expRows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.expense_categories?.name ?? "—"}</td>
                    <td>{r.occurred_on}</td>
                    <td className="num">{formatCents(r.amount_cents)}</td>
                    <td>{r.paid_from ?? "—"}</td>
                    <td>{r.payer_unit_id ? (data.unitCodeById.get(r.payer_unit_id) ?? "—") : "—"}</td>
                    <td>{r.vendor?.trim() ? r.vendor : "—"}</td>
                    <td>{r.note?.trim() ? r.note : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}
      </ReportSection>

      <p className="muted small" style={{ marginTop: 20, maxWidth: 780 }}>
        A coluna <strong>Diferença</strong> no resumo é apenas cobranças menos pagamentos no ano — não substitui o
        extrato com alocações por cobrança.{" "}
        <Link href="/admin/contas-correntes" className="text-link">
          Contas correntes
        </Link>
      </p>
    </section>
  );
}
