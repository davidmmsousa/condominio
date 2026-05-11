import { loadResidentAccountSnapshot, receiptNumberForPayment } from "@/lib/resident/accountSnapshot";
import { loadResidentPortalContext } from "@/lib/resident/portalContext";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { formatCents } from "@/lib/money";
import { ResidentHubNav } from "../ResidentHubNav";
import { ResidentPortalShell } from "../ResidentPortalShell";

export default async function RecibosPage() {
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
          <h1 className="page-title">Recibos</h1>
          <p className="page-lead">A tua conta ainda não está ligada a uma fração.</p>
        </main>
      </ResidentPortalShell>
    );
  }

  const { payments } = await loadResidentAccountSnapshot(supabase, portal.unitId);
  const paymentsNewestFirst = [...payments].reverse();

  return (
    <ResidentPortalShell paymentIban={portal.paymentIban}>
      <main className="page-shell page-shell--portal">
        <ResidentHubNav />
        <h1 className="page-title">Recibos</h1>
        <p className="page-lead">
          Pagamentos registados para a fração <strong>{portal.unitCode ?? "—"}</strong> (mais recentes primeiro).
        </p>
        {!paymentsNewestFirst.length ? (
          <p>Ainda não há pagamentos registados para a tua fração.</p>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Valor</th>
                  <th>Recibo</th>
                </tr>
              </thead>
              <tbody>
                {paymentsNewestFirst.map((p) => (
                  <tr key={p.id}>
                    <td>{new Date(p.paid_at).toLocaleString("pt-PT")}</td>
                    <td>{formatCents(p.amount_cents)}</td>
                    <td>
                      <a href={`/api/portal/receipts/${p.id}`} className="text-link">
                        {receiptNumberForPayment(p.id, p.paid_at)}
                      </a>
                    </td>
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
