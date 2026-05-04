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
    <main style={{ paddingTop: 24 }}>
      <h1 style={{ marginTop: 0 }}>Relatórios e ano operacional</h1>
      <p style={{ color: "#475569", maxWidth: 720, lineHeight: 1.55 }}>
        Os ficheiros usam filtros pelo <strong>ano civil</strong> (1 jan – 31 dez). O campo{" "}
        <strong>Ano operacional</strong> na base só serve como referência interna antes de iniciares novo ciclo —
        faz os exports em PDF/arquivo antes de clicar “novo ano”.
      </p>

      {user ? (
        <p style={{ marginTop: 8, fontSize: 15 }}>
          Utente sessão: <strong>{user.email}</strong>
        </p>
      ) : null}

      {bootstrapErr ? (
        <p style={{ background: "#fef3c7", color: "#92400e", padding: 12, borderRadius: 8, maxWidth: 720 }}>
          {bootstrapErr}
          {" "}— em alternativa usa o ficheiro <code style={{ fontSize: 13 }}>supabase/seed_condominium_if_missing.sql</code>{" "}
          no SQL Editor.
        </p>
      ) : null}
      {missingOperatingYearColumn ? (
        <p style={{ background: "#fef3c7", color: "#92400e", padding: 12, borderRadius: 8, maxWidth: 720 }}>
          A coluna <code>operating_year</code> ainda não existe na tabela <code>condominiums</code>. Executa no Supabase
          o ficheiro <code style={{ fontSize: 13 }}>supabase/patch_operating_year.sql</code>. Até lá, o botão “novo
          ano” fica desactivado; os relatórios por ano civil continuam a funcionar.
        </p>
      ) : null}
      {err ? (
        <p style={{ background: "#fee2e2", color: "#991b1b", padding: 12, borderRadius: 8, maxWidth: 720 }}>
          {decodeURIComponent(err)}
        </p>
      ) : null}
      {ok === "year_advanced" ? (
        <p style={{ background: "#d1fae5", color: "#065f46", padding: 12, borderRadius: 8, maxWidth: 720 }}>
          Ano operacional actualizado (+1 na base).
        </p>
      ) : null}

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
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Ano operacional (base de dados)</h2>
        <p style={{ color: "#555", marginBottom: 12 }}>
          Conservatório atual: <strong>{operatingYearDisplay}</strong>{" "}
          {condo?.name ? <span style={{ color: "#64748b" }}>({condo.name})</span> : null}
          {cErr && !missingOperatingYearColumn ? (
            <span style={{ color: "#b00020" }}>
              {" "}
              — erro a ler: {cErr.message}
            </span>
          ) : null}
        </p>
        <AdvanceYearForm disabled={missingOperatingYearColumn} />
      </section>

      {reportPreviewErr ? (
        <p style={{ background: "#fee2e2", color: "#991b1b", padding: 12, borderRadius: 8, maxWidth: 820 }}>
          {reportPreviewErr}
        </p>
      ) : null}

      {reportPreview ? <YearReportPreview year={reportYear} data={reportPreview} /> : null}

      <section style={{ marginTop: 36 }}>
        <h2 className="page-title" style={{ fontSize: "1.15rem", marginBottom: 12 }}>
          Ano civil {reportYear} — exportar ficheiros
        </h2>
        <nav aria-label="Escolher ano do relatório" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {yearOptions.map((yy) => {
            const active = yy === reportYear;
            return (
              <Link
                key={yy}
                href={`/admin/relatorios?year=${yy}`}
                aria-current={active ? "page" : undefined}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  textDecoration: "none",
                  border: active ? "1px solid #3730a3" : "1px solid #e2e8f0",
                  background: active ? "#e0e7ff" : "#fff",
                  color: active ? "#312e81" : "#475569",
                }}
              >
                {yy}
              </Link>
            );
          })}
        </nav>
        <YearExportLinks yearChoice={yearOptions} defaultYear={reportYear} />
      </section>

      <p style={{ marginTop: 32 }}>
        <Link href="/admin">← Início admin</Link>
      </p>
    </main>
  );
}

function YearExportLinks({ yearChoice, defaultYear }: { yearChoice: number[]; defaultYear: number }) {
  const base = `/api/admin/reports`;
  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 720 }}>
      <p style={{ color: "#555", margin: 0 }}>
        Escolhe o ano nos links (substitui <code>YEAR</code>). Exemplo relatório único inclui cobranças, pagamentos,
        despesas e um resumo.
      </p>
      <details style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 12 }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>
          Lista de links rápidos ({defaultYear})
        </summary>
        <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
          <li>
            <a href={`${base}?year=${defaultYear}&segment=full`} target="_blank" rel="noopener noreferrer">
              Relatório final (.txt combinado — {defaultYear})
            </a>
          </li>
          <li>
            <a href={`${base}?year=${defaultYear}&segment=charges`}>Cobranças CSV</a>
          </li>
          <li>
            <a href={`${base}?year=${defaultYear}&segment=payments`}>Pagamentos CSV</a>
          </li>
          <li>
            <a href={`${base}?year=${defaultYear}&segment=expenses`}>Despesas CSV</a>
          </li>
          <li>
            <a href={`${base}?year=${defaultYear}&segment=summary`}>Resumo frações CSV</a>
          </li>
        </ul>
      </details>
      <details style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 12 }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Outros anos</summary>
        <ul style={{ marginBottom: 0, columns: 2, gap: 8 }}>
          {yearChoice.map((yy) => (
            <li key={yy} style={{ marginBottom: 8 }}>
              <a href={`${base}?year=${yy}&segment=full`}>{yy} · relatório txt</a>
            </li>
          ))}
        </ul>
      </details>
      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 0 }}>
        Ao início do ano civil novo: faz download destes ficheiros, guarda fora da app e só depois clica{" "}
        <strong>Iniciar novo ano operacional</strong> se queres manter esse número só como marcação organizacional na
        base (não apaga dados).
      </p>
    </div>
  );
}
