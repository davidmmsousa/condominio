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
    <div style={{ marginTop: 28 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "baseline",
          gap: 12,
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 17 }}>{title}</h3>
        <a href={downloadHref} className="text-link" style={{ fontSize: 14 }}>
          {downloadLabel}
        </a>
      </div>
      {children}
    </div>
  );
}

function TableScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="data-table-wrap" style={{ maxHeight: 380, overflow: "auto" }}>
      {children}
    </div>
  );
}

export function YearReportPreview({ year, data }: { year: number; data: YearReportDataset }) {
  const totalCharged = data.chargeRows.reduce((s, r) => s + r.amount_cents, 0);
  const totalPaid = data.payRows.reduce((s, r) => s + r.amount_cents, 0);
  const totalExp = data.expRows.reduce((s, r) => s + r.amount_cents, 0);

  return (
    <section style={{ marginTop: 8 }}>
      <h2 className="page-title" style={{ fontSize: "1.35rem", marginBottom: 8 }}>
        Visão do ano {year}
      </h2>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20, maxWidth: 820, lineHeight: 1.55 }}>
        Pré-visualização com os mesmos critérios dos exports (cobranças por vencimento no ano; pagamentos por data de
        registo; despesas por data da fatura). Tabelas com scroll se a lista for longa.
      </p>

      <p style={{ marginBottom: 16 }}>
        <a
          href={`${apiBase}?year=${year}&segment=full`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-link"
        >
          Relatório completo (.txt) — {year}
        </a>
      </p>

      <div
        className="admin-tile-grid"
        style={{
          marginTop: 0,
          marginBottom: 8,
          gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))",
        }}
      >
        <div className="admin-tile" style={{ cursor: "default" }}>
          <strong>Total cobranças</strong>
          <span>{formatCents(totalCharged)}</span>
        </div>
        <div className="admin-tile" style={{ cursor: "default" }}>
          <strong>Total pagamentos</strong>
          <span>{formatCents(totalPaid)}</span>
        </div>
        <div className="admin-tile" style={{ cursor: "default" }}>
          <strong>Total despesas</strong>
          <span>{formatCents(totalExp)}</span>
        </div>
      </div>

      <ReportSection
        title="Resumo por fração"
        downloadHref={`${apiBase}?year=${year}&segment=summary`}
        downloadLabel="CSV resumo"
      >
        {!data.summaryRows.length ? (
          <p style={{ color: "#64748b" }}>Sem linhas (sem cobranças nem pagamentos neste ano).</p>
        ) : (
          <TableScroll>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fração</th>
                  <th>Cobranças</th>
                  <th>Pagos</th>
                  <th>Diferença</th>
                </tr>
              </thead>
              <tbody>
                {data.summaryRows.map((r) => (
                  <tr key={r.code}>
                    <td>{r.code}</td>
                    <td>{formatCents(r.charged)}</td>
                    <td>{formatCents(r.paid)}</td>
                    <td>{formatCents(r.charged - r.paid)}</td>
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
          <p style={{ color: "#64748b" }}>Sem cobranças com vencimento neste ano civil.</p>
        ) : (
          <TableScroll>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fração</th>
                  <th>Vencimento</th>
                  <th>Tipo</th>
                  <th>Mês ref.</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {data.chargeRows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.units?.code ?? "—"}</td>
                    <td>{r.due_date}</td>
                    <td>{r.kind}</td>
                    <td>{r.reference_month ? r.reference_month.slice(0, 7) : "—"}</td>
                    <td>{formatCents(r.amount_cents)}</td>
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
          <p style={{ color: "#64748b" }}>Sem pagamentos registados neste ano civil.</p>
        ) : (
          <TableScroll>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fração</th>
                  <th>Data</th>
                  <th>Valor</th>
                  <th>Meio</th>
                  <th>Tesoura</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                {data.payRows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.units?.code ?? "—"}</td>
                    <td>{new Date(r.paid_at).toLocaleString("pt-PT")}</td>
                    <td>{formatCents(r.amount_cents)}</td>
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
          <p style={{ color: "#64748b" }}>Sem despesas com data neste ano civil.</p>
        ) : (
          <TableScroll>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rubrica</th>
                  <th>Data</th>
                  <th>Valor</th>
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
                    <td>{formatCents(r.amount_cents)}</td>
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

      <p style={{ marginTop: 20, fontSize: 13, color: "#64748b", maxWidth: 780 }}>
        A coluna <strong>Diferença</strong> no resumo é apenas cobranças menos pagamentos no ano — não substitui o
        extrato com alocações por cobrança.{" "}
        <Link href="/admin/contas-correntes" className="text-link">
          Contas correntes
        </Link>
      </p>
    </section>
  );
}
