import { fetchCondominiumForRelatorios } from "@/lib/condominiumMeta";
import { ensureSingletonCondominiumId } from "@/lib/singletonCondominium";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
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
      <main style={{ paddingTop: 24 }}>
        <h1 style={{ marginTop: 0 }}>Tabela geral</h1>
        <p style={{ color: "#b00020" }}>Condomínio em falta.</p>
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
      <main style={{ paddingTop: 24 }}>
        <h1 style={{ marginTop: 0 }}>Tabela geral</h1>
        <p style={{ color: "#b00020" }}>{uErr.message}</p>
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
      <main style={{ paddingTop: 24 }}>
        <h1 style={{ marginTop: 0 }}>Tabela geral</h1>
        <p style={{ color: "#b00020" }}>{cErr.message}</p>
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
        <main style={{ paddingTop: 24 }}>
          <h1 style={{ marginTop: 0 }}>Tabela geral</h1>
          <p style={{ color: "#b00020" }}>{aErr.message}</p>
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
    <main style={{ paddingTop: 24, maxWidth: 1100 }}>
      <p style={{ marginTop: 0 }}>
        <Link href="/admin/pagamentos" style={{ color: "#555", fontSize: 14 }}>
          ← Pagamentos
        </Link>
      </p>
      <h1 style={{ marginTop: 8 }}>Tabela geral — quotas {year}</h1>
      <p style={{ color: "#555", maxWidth: 720, lineHeight: 1.55, fontSize: 14 }}>
        Uma linha por fração (por ordem de código). Em cada mês aparece <strong>✓</strong> quando a quota corrente desse
        mês está <strong>totalmente paga</strong> (alocações aos pagamentos). Sem cobrança gerada para esse mês fica
        vazio.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginTop: 16, marginBottom: 20 }}>
        <span style={{ fontSize: 14, color: "#555" }}>Ano:</span>
        {yearsNav.map((y) =>
          y === year ? (
            <span
              key={y}
              style={{
                fontSize: 14,
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #64748b",
                color: "#111",
                fontWeight: 700,
                background: "#f1f5f9",
              }}
            >
              {y}
            </span>
          ) : (
            <Link
              key={y}
              href={`/admin/pagamentos/tabela-geral?ano=${y}`}
              style={{
                fontSize: 14,
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #ccc",
                textDecoration: "none",
                color: "#2563eb",
                background: "#fff",
              }}
            >
              {y}
            </Link>
          ),
        )}
      </div>

      <div style={{ overflowX: "auto", border: "1px solid #cbd5e1", borderRadius: 8 }}>
        <table style={{ borderCollapse: "collapse", fontSize: 13, minWidth: 720, width: "100%" }}>
          <thead>
            <tr style={{ background: "#e2e8f0" }}>
              <th
                style={{
                  padding: "10px 8px",
                  textAlign: "left",
                  borderBottom: "2px solid #94a3b8",
                  borderRight: "1px solid #94a3b8",
                  position: "sticky",
                  left: 0,
                  background: "#e2e8f0",
                  zIndex: 1,
                  whiteSpace: "nowrap",
                }}
              >
                Fração
              </th>
              {MESES.map((m) => (
                <th
                  key={m}
                  style={{
                    padding: "10px 6px",
                    textAlign: "center",
                    borderBottom: "2px solid #94a3b8",
                    borderRight: "1px solid #cbd5e1",
                    minWidth: 44,
                    fontWeight: 700,
                  }}
                >
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {unitRows.length === 0 ? (
              <tr>
                <td colSpan={13} style={{ padding: 16, color: "#64748b" }}>
                  Sem frações. Cria frações em Admin → Frações.
                </td>
              </tr>
            ) : (
              unitRows.map((u) => (
                <tr key={u.id}>
                  <td
                    style={{
                      padding: "8px 8px",
                      borderBottom: "1px solid #e2e8f0",
                      borderRight: "1px solid #cbd5e1",
                      fontWeight: 600,
                      position: "sticky",
                      left: 0,
                      background: "#fff",
                      zIndex: 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {u.code}
                  </td>
                  {MESES.map((_, idx) => {
                    const month = idx + 1;
                    const cell = chargeByUnitMonth.get(`${u.id}:${month}`);
                    const ok =
                      cell && cell.amount_cents > 0 && cell.applied >= cell.amount_cents;
                    return (
                      <td
                        key={month}
                        style={{
                          padding: "8px 4px",
                          textAlign: "center",
                          borderBottom: "1px solid #e2e8f0",
                          borderRight: "1px solid #e2e8f0",
                          color: ok ? "#047857" : "#94a3b8",
                          fontSize: 16,
                        }}
                      >
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
