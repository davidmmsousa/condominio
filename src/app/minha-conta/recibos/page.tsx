import { Icon } from "@/components/ui/Icon";
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
          <p className="alert alert--warning">A tua conta ainda não está ligada a uma fração.</p>
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
        <p className="page-eyebrow">Fração {portal.unitCode ?? "—"}</p>
        <h1 className="page-title">Recibos</h1>
        <p className="page-lead">Pagamentos registados para a tua fração, dos mais recentes para os mais antigos.</p>
        {!paymentsNewestFirst.length ? (
          <div className="empty">
            <Icon name="inbox" size={28} />
            Ainda não há pagamentos registados para a tua fração.
          </div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th className="num">Valor</th>
                  <th>Recibo</th>
                </tr>
              </thead>
              <tbody>
                {paymentsNewestFirst.map((p) => (
                  <tr key={p.id}>
                    <td>{new Date(p.paid_at).toLocaleString("pt-PT")}</td>
                    <td className="num">{formatCents(p.amount_cents)}</td>
                    <td>
                      <a href={`/api/portal/receipts/${p.id}`} className="btn btn--sm">
                        <Icon name="download" size={15} />
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
