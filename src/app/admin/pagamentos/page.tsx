import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { formatCents } from "@/lib/money";
import { PaymentForm } from "./PaymentForm";
import { ResendReceiptEmailButton } from "./ResendReceiptEmailButton";

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
    <main style={{ paddingTop: 24 }}>
      <h1 style={{ marginTop: 0 }}>Pagamentos</h1>
      <PaymentForm units={units ?? []} />
      <h2 style={{ fontSize: 18, marginTop: 40 }}>Últimos pagamentos</h2>
      {!list.length ? (
        <p style={{ color: "#555" }}>Sem pagamentos registados.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
                <th style={{ padding: "8px 6px" }}>Data</th>
                <th style={{ padding: "8px 6px" }}>Fração</th>
                <th style={{ padding: "8px 6px" }}>Valor</th>
                <th style={{ padding: "8px 6px" }}>Meio</th>
                <th style={{ padding: "8px 6px" }}>Nota</th>
                <th style={{ padding: "8px 6px", minWidth: 140 }}>Recibo</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px 6px" }}>{new Date(p.paid_at).toLocaleString("pt-PT")}</td>
                  <td style={{ padding: "8px 6px" }}>{p.units?.code ?? "—"}</td>
                  <td style={{ padding: "8px 6px" }}>{formatCents(p.amount_cents)}</td>
                  <td style={{ padding: "8px 6px", color: "#555" }}>{p.method ?? "—"}</td>
                  <td style={{ padding: "8px 6px", color: "#555" }}>{p.note ?? "—"}</td>
                  <td style={{ padding: "8px 6px", verticalAlign: "top" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
                      <a
                        href={`/api/admin/receipts/${p.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 13 }}
                      >
                        PDF
                      </a>
                      <ResendReceiptEmailButton paymentId={p.id} />
                    </div>
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
