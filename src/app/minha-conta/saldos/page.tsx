import { Icon } from "@/components/ui/Icon";
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
          <p className="alert alert--warning">A tua conta ainda não está ligada a uma fração.</p>
        </main>
      </ResidentPortalShell>
    );
  }

  const { openCents, upcomingCents, charges } = await loadResidentAccountSnapshot(supabase, portal.unitId);

  return (
    <ResidentPortalShell paymentIban={portal.paymentIban}>
      <main className="page-shell page-shell--portal">
        <ResidentHubNav />
        <p className="page-eyebrow">Fração {portal.unitCode ?? "—"}</p>
        <h1 className="page-title">Conta corrente</h1>
        <p className="page-lead">Cobranças registadas e valores já pagos em cada uma.</p>
        <div className="stat-grid" style={{ marginBottom: 20 }}>
          <div className="stat">
            <p className="stat__label">Saldo estimado em dívida</p>
            <p className={openCents > 0 ? "stat__value stat__value--positive" : "stat__value stat__value--negative"}>
              {formatCents(openCents)}
            </p>
          </div>
        </div>
        {!charges.length ? (
          <div className="empty">
            <Icon name="inbox" size={28} />
            Sem cobranças registadas para a tua fração.
          </div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Vencimento</th>
                  <th className="num">Cobrança</th>
                  <th className="num">Pago</th>
                  <th className="num">Em aberto</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className={r.kind === "extraordinaria" ? "badge badge--warning" : "badge"}>
                        {r.kind === "extraordinaria" ? "Extraordinária" : r.kind === "corrente" ? "Quota" : r.kind}
                      </span>
                    </td>
                    <td className="nowrap">{r.due_date}</td>
                    <td className="num">{formatCents(r.amount_cents)}</td>
                    <td className="num">{formatCents(r.paid)}</td>
                    <td className="num">
                      {r.open > 0 ? <strong>{formatCents(r.open)}</strong> : <span className="badge badge--success">Pago</span>}
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
