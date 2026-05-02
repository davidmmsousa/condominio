import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { formatCents } from "@/lib/money";
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
    <main style={{ paddingTop: 24 }}>
      <h1 style={{ marginTop: 0 }}>Cobranças (conta corrente)</h1>
      <GenerateQuotasForm disabled={!units?.length} />
      <ManualChargeForm units={units ?? []} />
      <h2 style={{ fontSize: 18 }}>Últimas cobranças</h2>
      {!list.length ? (
        <p style={{ color: "#555" }}>Sem cobranças ainda.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
                <th style={{ padding: "8px 6px" }}>Fração</th>
                <th style={{ padding: "8px 6px" }}>Tipo</th>
                <th style={{ padding: "8px 6px" }}>Valor</th>
                <th style={{ padding: "8px 6px" }}>Vencimento</th>
                <th style={{ padding: "8px 6px" }}>Referência</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px 6px" }}>{c.units?.code ?? "—"}</td>
                  <td style={{ padding: "8px 6px" }}>{c.kind}</td>
                  <td style={{ padding: "8px 6px" }}>{formatCents(c.amount_cents)}</td>
                  <td style={{ padding: "8px 6px" }}>{c.due_date}</td>
                  <td style={{ padding: "8px 6px", color: "#555" }}>
                    {c.reference_month ? c.reference_month.slice(0, 7) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
