import { fetchCondominiumForRelatorios } from "@/lib/condominiumMeta";
import { fetchYearReportDataset } from "@/lib/reports/yearReportDataset";
import { ensureSingletonCondominiumId } from "@/lib/singletonCondominium";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import Link from "next/link";
import { AdvanceYearForm } from "./AdvanceYearForm";
import { YearReportPreview } from "./YearReportPreview";

type Props = {
  searchParams: Promise<{ err?: string | string[]; ok?: string | string[]; year?: string | string[] }>;
};

function first(v: string | string[] | undefined) {
  return typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;
}

export default async function RelatoriosAdminPage({ searchParams }: Props) {
  const sp = await searchParams;
  const err = first(sp.err);
  const ok = first(sp.ok);
  const yearParam = first(sp.year);

  const supabase = await createServerRouteSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let operatingYearDisplay: number | string = "—";
  let bootstrapErr: string | null = null;
  try {
    await ensureSingletonCondominiumId(supabase);
  } catch (e) {
    bootstrapErr = e instanceof Error ? e.message : "Não foi possível preparar o condomínio.";
  }

  const { row: condo, error: cErr, missingOperatingYearColumn } = await fetchCondominiumForRelatorios(supabase);

  if (!cErr && condo?.operating_year !== undefined && condo.operating_year !== null) {
    operatingYearDisplay = condo.operating_year as number;
  }

  const defaultReportYear =
    typeof operatingYearDisplay === "number"
      ? operatingYearDisplay
      : new Date().getFullYear();
  let reportYear = defaultReportYear;
  if (yearParam && /^\d{4}$/.test(yearParam)) {
    const n = Number(yearParam);
    if (n >= 2000 && n <= 2100) reportYear = n;
  }
  const yearOptions = Array.from({ length: 11 }, (_, i) => reportYear - 5 + i).filter((n) => n >= 2000 && n <= 2100);

  let reportPreview: Awaited<ReturnType<typeof fetchYearReportDataset>> | null = null;
  let reportPreviewErr: string | null = null;
  if (condo?.id && !bootstrapErr) {
    try {
      reportPreview = await fetchYearReportDataset(supabase, condo.id, reportYear);
    } catch (e) {
      reportPreviewErr = e instanceof Error ? e.message : "Erro ao carregar dados do relatório.";
    }
  }

  return (
    <main>
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Análise</p>
          <h1 className="page-title">Relatórios e ano operacional</h1>
          <p className="page-lead">
            Os ficheiros usam filtros pelo <strong>ano civil</strong> (1 jan – 31 dez). O campo{" "}
            <strong>Ano operacional</strong> na base só serve como referência interna antes de iniciares novo ciclo —
            faz os exports em PDF/arquivo antes de clicar «novo ano».
          </p>
        </div>
      </header>

      <div className="stack" style={{ maxWidth: 760 }}>
        {bootstrapErr ? (
          <p className="alert alert--warning">
            <span>
              {bootstrapErr} — em alternativa usa o ficheiro <code>supabase/seed_condominium_if_missing.sql</code> no
              SQL Editor.
            </span>
          </p>
        ) : null}
        {missingOperatingYearColumn ? (
          <p className="alert alert--warning">
            <span>
              A coluna <code>operating_year</code> ainda não existe na tabela <code>condominiums</code>. Executa no
              Supabase o ficheiro <code>supabase/patch_operating_year.sql</code>. Até lá, o botão «novo ano» fica
              desativado; os relatórios por ano civil continuam a funcionar.
            </span>
          </p>
        ) : null}
        {err ? <p className="alert alert--error">{decodeURIComponent(err)}</p> : null}
        {ok === "year_advanced" ? <p className="alert alert--success">Ano operacional atualizado (+1 na base).</p> : null}
      </div>

      <section className="card card--narrow section" style={{ maxWidth: 760 }}>
        <h2 className="card__title">Ano operacional (base de dados)</h2>
        <p className="card__lead">
          Ano atual: <strong>{operatingYearDisplay}</strong>{" "}
          {condo?.name ? <span className="muted">({condo.name})</span> : null}
          {cErr && !missingOperatingYearColumn ? <span style={{ color: "var(--danger)" }}> — erro a ler: {cErr.message}</span> : null}
        </p>
        <AdvanceYearForm disabled={missingOperatingYearColumn} />
        {user ? (
          <p className="small muted" style={{ margin: "14px 0 0" }}>
            Sessão: {user.email}
          </p>
        ) : null}
      </section>

      {reportPreviewErr ? (
        <p className="alert alert--error" style={{ marginTop: 20 }}>
          {reportPreviewErr}
        </p>
      ) : null}

      {reportPreview ? <YearReportPreview year={reportYear} data={reportPreview} /> : null}

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Ano civil {reportYear} — exportar ficheiros</h2>
        </div>
        <nav aria-label="Escolher ano do relatório" className="pill-nav" style={{ marginBottom: 16 }}>
          {yearOptions.map((yy) => {
            const active = yy === reportYear;
            return (
              <Link
                key={yy}
                href={`/admin/relatorios?year=${yy}`}
                aria-current={active ? "page" : undefined}
                className={active ? "pill is-active" : "pill"}
              >
                {yy}
              </Link>
            );
          })}
        </nav>
        <YearExportLinks yearChoice={yearOptions} defaultYear={reportYear} />
      </section>
    </main>
  );
}

function YearExportLinks({ yearChoice, defaultYear }: { yearChoice: number[]; defaultYear: number }) {
  const base = `/api/admin/reports`;
  return (
    <div className="stack" style={{ maxWidth: 760 }}>
      <p className="muted" style={{ margin: 0 }}>
        O relatório único inclui cobranças, pagamentos, despesas e um resumo. Escolhe o ano acima ou abre a lista de
        links rápidos.
      </p>
      <details className="disclosure">
        <summary>Lista de links rápidos ({defaultYear})</summary>
        <div className="disclosure__body">
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9 }}>
            <li>
              <a href={`${base}?year=${defaultYear}&segment=full`} target="_blank" rel="noopener noreferrer" className="text-link">
                Relatório final (.txt combinado — {defaultYear})
              </a>
            </li>
            <li>
              <a href={`${base}?year=${defaultYear}&segment=charges`} className="text-link">
                Cobranças CSV
              </a>
            </li>
            <li>
              <a href={`${base}?year=${defaultYear}&segment=payments`} className="text-link">
                Pagamentos CSV
              </a>
            </li>
            <li>
              <a href={`${base}?year=${defaultYear}&segment=expenses`} className="text-link">
                Despesas CSV
              </a>
            </li>
            <li>
              <a href={`${base}?year=${defaultYear}&segment=summary`} className="text-link">
                Resumo frações CSV
              </a>
            </li>
          </ul>
        </div>
      </details>
      <details className="disclosure">
        <summary>Outros anos</summary>
        <div className="disclosure__body">
          <ul style={{ margin: 0, paddingLeft: 20, columns: 2, gap: 8, lineHeight: 1.9 }}>
            {yearChoice.map((yy) => (
              <li key={yy}>
                <a href={`${base}?year=${yy}&segment=full`} className="text-link">
                  {yy} · relatório txt
                </a>
              </li>
            ))}
          </ul>
        </div>
      </details>
      <p className="small muted" style={{ margin: 0 }}>
        Ao início do ano civil novo: faz download destes ficheiros, guarda fora da app e só depois clica{" "}
        <strong>Iniciar novo ano operacional</strong> se queres manter esse número só como marcação organizacional na
        base (não apaga dados).
      </p>
    </div>
  );
}
