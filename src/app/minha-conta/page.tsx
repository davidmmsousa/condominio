import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { formatCents } from "@/lib/money";

export default async function MinhaContaPage() {
  const supabase = await createServerRouteSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("unit_id").eq("user_id", user.id).maybeSingle();

  const unitId = profile?.unit_id;
  const { data: unitRow } = unitId
    ? await supabase.from("units").select("code").eq("id", unitId).maybeSingle()
    : { data: null };
  const unitCode = unitRow?.code;

  if (!unitId) {
    return (
      <main style={{ padding: 24, maxWidth: 720 }}>
        <h1 style={{ marginTop: 0 }}>Minha conta</h1>
        <p style={{ color: "#555" }}>
          O portal usa a fração em <code>profiles.unit_id</code> (conta com que entras), não só a ficha em
          Moradores. Pede ao administrador para premir <strong>Ligar ao portal</strong> na tua linha em Admin →
          Moradores (ou editar <code>profiles</code> no Supabase).
        </p>
      </main>
    );
  }

  const { data: charges } = await supabase
    .from("charges")
    .select("id, amount_cents, due_date, kind, reference_month")
    .eq("unit_id", unitId)
    .order("due_date", { ascending: true });

  const chargeList = charges ?? [];
  const chargeIds = chargeList.map((c) => c.id);
  const appliedByCharge = new Map<string, number>();

  if (chargeIds.length) {
    const { data: allocs } = await supabase
      .from("payment_allocations")
      .select("charge_id, applied_cents")
      .in("charge_id", chargeIds);
    for (const a of allocs ?? []) {
      appliedByCharge.set(a.charge_id, (appliedByCharge.get(a.charge_id) ?? 0) + a.applied_cents);
    }
  }

  let openCents = 0;
  const rows = chargeList.map((c) => {
    const paid = appliedByCharge.get(c.id) ?? 0;
    const open = Math.max(0, c.amount_cents - paid);
    openCents += open;
    return { ...c, paid, open };
  });

  return (
    <main style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ marginTop: 0 }}>Minha conta</h1>
      <p style={{ color: "#555" }}>
        Fração <strong>{unitCode ?? "—"}</strong>. Saldo estimado em dívida nas cobranças listadas abaixo:{" "}
        <strong>{formatCents(openCents)}</strong>.
      </p>
      {!rows.length ? (
        <p style={{ marginTop: 16 }}>Sem cobranças registadas para a tua fração.</p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
                <th style={{ padding: "8px 6px" }}>Tipo</th>
                <th style={{ padding: "8px 6px" }}>Vencimento</th>
                <th style={{ padding: "8px 6px" }}>Cobrança</th>
                <th style={{ padding: "8px 6px" }}>Pago</th>
                <th style={{ padding: "8px 6px" }}>Em aberto</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px 6px" }}>{r.kind}</td>
                  <td style={{ padding: "8px 6px" }}>{r.due_date}</td>
                  <td style={{ padding: "8px 6px" }}>{formatCents(r.amount_cents)}</td>
                  <td style={{ padding: "8px 6px" }}>{formatCents(r.paid)}</td>
                  <td style={{ padding: "8px 6px" }}>{formatCents(r.open)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
