import { loadResidentAccountSnapshot } from "@/lib/resident/accountSnapshot";
import { loadResidentPortalContext } from "@/lib/resident/portalContext";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { formatCents } from "@/lib/money";
import { ResidentHubNav } from "../ResidentHubNav";
import { ResidentPortalShell } from "../ResidentPortalShell";

export default async function SaldosPage() {
  const supabase = await createServerRouteSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const portal = await loadResidentPortalContext(supabase, user.id, user.email ?? "");

  if (!portal.unitId) {
    return (
      <ResidentPortalShell paymentIban={portal.paymentIban}>
        <main className="page-shell page-shell--portal">
          <ResidentHubNav />
          <h1 className="page-title">Conta corrente</h1>
          <p className="page-lead">A tua conta ainda não está ligada a uma fração.</p>
        </main>
      </ResidentPortalShell>
    );
  }

  const { openCents, charges } = await loadResidentAccountSnapshot(supabase, portal.unitId);

  return (
    <ResidentPortalShell paymentIban={portal.paymentIban}>
      <main className="page-shell page-shell--portal">
        <ResidentHubNav />
        <h1 className="page-title">Conta corrente</h1>
        <p className="page-lead">
          Fração <strong>{portal.unitCode ?? "—"}</strong>. Saldo estimado em dívida nas cobranças listadas:{" "}
          <strong>{formatCents(openCents)}</strong>.
        </p>
        {!charges.length ? (
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
                {charges.map((r) => (
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
    </ResidentPortalShell>
  );
}
