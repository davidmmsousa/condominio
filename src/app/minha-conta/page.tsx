import { computeFifoAppliedPerCharge } from "@/lib/billing/fifoApply";
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
      <main className="page-shell page-shell--narrow">
        <h1 className="page-title">Minha conta</h1>
        <p className="page-lead">
          O portal usa a fração em <code>profiles.unit_id</code> (conta com que entras), não só a ficha em Moradores.
          Pede ao administrador para premir <strong>Ligar ao portal</strong> na tua linha em Admin → Moradores (ou editar{" "}
          <code>profiles</code> no Supabase).
        </p>
      </main>
    );
  }

  const { data: charges } = await supabase
    .from("charges")
    .select("id, amount_cents, due_date, kind, reference_month")
    .eq("unit_id", unitId)
    .order("due_date", { ascending: true });

  const { data: payments } = await supabase
    .from("payments")
    .select("amount_cents, paid_at")
    .eq("unit_id", unitId)
    .order("paid_at", { ascending: true });

  const chargeList = charges ?? [];
  const payRows = payments ?? [];

  const appliedByCharge = computeFifoAppliedPerCharge(
    chargeList.map((c) => ({
      id: c.id,
      amount_cents: c.amount_cents,
      due_date: c.due_date,
      kind: c.kind as "corrente" | "extraordinaria",
    })),
    payRows.map((p) => ({ amount_cents: p.amount_cents, paid_at: p.paid_at })),
  );

  let openCents = 0;
  const rows = chargeList.map((c) => {
    const paid = appliedByCharge.get(c.id) ?? 0;
    const open = Math.max(0, c.amount_cents - paid);
    openCents += open;
    return { ...c, paid, open };
  });

  return (
    <main className="page-shell page-shell--compact">
      <h1 className="page-title">Minha conta</h1>
      <p className="page-lead">
        Fração <strong>{unitCode ?? "—"}</strong>. Saldo estimado em dívida nas cobranças listadas abaixo:{" "}
        <strong>{formatCents(openCents)}</strong>.
      </p>
      {!rows.length ? (
        <p>Sem cobranças registadas para a tua fração.</p>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Vencimento</th>
                <th>Cobrança</th>
                <th>Pago</th>
                <th>Em aberto</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.kind}</td>
                  <td>{r.due_date}</td>
                  <td>{formatCents(r.amount_cents)}</td>
                  <td>{formatCents(r.paid)}</td>
                  <td>{formatCents(r.open)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
