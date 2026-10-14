import { fetchCondominiumForRelatorios } from "@/lib/condominiumMeta";
import { ensureSingletonCondominiumId } from "@/lib/singletonCondominium";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { Icon } from "@/components/ui/Icon";
import Link from "next/link";

const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"] as const;

function refMonth(year: number, month1to12: number): string {
  return `${year}-${String(month1to12).padStart(2, "0")}-01`;
}

type Props = { searchParams: Promise<{ ano?: string }> };

export default async function TabelaGeralPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = await createServerRouteSupabaseClient();

  let cid: string;
  try {
    cid = await ensureSingletonCondominiumId(supabase);
  } catch {
    return (
      <main>
        <h1 className="page-title">Tabela geral</h1>
        <p className="alert alert--error">Condomínio em falta.</p>
      </main>
    );
  }

  const { row: condo } = await fetchCondominiumForRelatorios(supabase);
  const anoParam = Number(String(sp.ano ?? "").trim());
  const defaultYear = condo?.operating_year ?? new Date().getFullYear();
  const year =
    Number.isInteger(anoParam) && anoParam >= 2000 && anoParam <= 2100 ? anoParam : defaultYear;

  const { data: units, error: uErr } = await supabase
    .from("units")
    .select("id, code")
    .eq("condominium_id", cid)
    .order("code", { ascending: true });

  if (uErr) {
    return (
      <main>
        <h1 className="page-title">Tabela geral</h1>
        <p className="alert alert--error">{uErr.message}</p>
      </main>
    );
  }

  const unitRows = units ?? [];
  const startRef = refMonth(year, 1);
  const endRef = refMonth(year, 12);

  const { data: charges, error: cErr } = await supabase
    .from("charges")
    .select("id, unit_id, reference_month, amount_cents")
    .eq("condominium_id", cid)
    .eq("kind", "corrente")
    .not("reference_month", "is", null)
    .gte("reference_month", startRef)
    .lte("reference_month", endRef);

  if (cErr) {
    return (
      <main>
        <h1 className="page-title">Tabela geral</h1>
        <p className="alert alert--error">{cErr.message}</p>
      </main>
    );
  }

  type Ch = { id: string; unit_id: string; reference_month: string; amount_cents: number };
  const chList = (charges ?? []) as unknown as Ch[];
  const chargeIds = chList.map((c) => c.id);

  const appliedByCharge = new Map<string, number>();
  if (chargeIds.length) {
    const { data: allocs, error: aErr } = await supabase
      .from("payment_allocations")
      .select("charge_id, applied_cents")
      .in("charge_id", chargeIds);
    if (aErr) {
      return (
        <main>
          <h1 className="page-title">Tabela geral</h1>
          <p className="alert alert--error">{aErr.message}</p>
        </main>
      );
    }
    for (const a of allocs ?? []) {
      const id = a.charge_id as string;
      appliedByCharge.set(id, (appliedByCharge.get(id) ?? 0) + (a.applied_cents as number));
    }
  }

  const chargeByUnitMonth = new Map<string, { id: string; amount_cents: number; applied: number }>();
  for (const c of chList) {
    const rm = c.reference_month.slice(0, 10);
    const m = Number(rm.slice(5, 7));
    if (!m || m < 1 || m > 12) continue;
    const key = `${c.unit_id}:${m}`;
    const applied = appliedByCharge.get(c.id) ?? 0;
    chargeByUnitMonth.set(key, { id: c.id, amount_cents: c.amount_cents, applied });
  }

  const yearsNav = [year - 1, year, year + 1].filter((y) => y >= 2000 && y <= 2100);

  return (
    <main>
      <Link href="/admin/pagamentos" className="back-link">
        <Icon name="arrowLeft" size={16} />
        Pagamentos
      </Link>
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Financeiro</p>
          <h1 className="page-title">Tabela geral — quotas {year}</h1>
          <p className="page-lead">
            Uma linha por fração. Cada mês mostra <strong>✓</strong> quando a quota corrente está{" "}
            <strong>totalmente paga</strong>; sem cobrança gerada, a célula fica vazia.
          </p>
        </div>
        <nav className="pill-nav" aria-label="Escolher ano">
          {yearsNav.map((y) => (
            <Link
              key={y}
              href={`/admin/pagamentos/tabela-geral?ano=${y}`}
              className={y === year ? "pill is-active" : "pill"}
              aria-current={y === year ? "page" : undefined}
            >
              {y}
            </Link>
          ))}
        </nav>
      </header>

      <div className="matrix-wrap">
        <table className="matrix">
          <thead>
            <tr>
              <th className="matrix__unit">Fração</th>
              {MESES.map((m) => (
                <th key={m}>{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {unitRows.length === 0 ? (
              <tr>
                <td colSpan={13} className="muted" style={{ padding: 20 }}>
                  Sem frações. Cria frações em Admin → Frações.
                </td>
              </tr>
            ) : (
              unitRows.map((u) => (
                <tr key={u.id}>
                  <td className="matrix__unit">{u.code}</td>
                  {MESES.map((_, idx) => {
                    const month = idx + 1;
                    const cell = chargeByUnitMonth.get(`${u.id}:${month}`);
                    const ok = cell && cell.amount_cents > 0 && cell.applied >= cell.amount_cents;
                    return (
                      <td key={month} className={ok ? "matrix__ok" : undefined}>
                        {ok ? "✓" : ""}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
