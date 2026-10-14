import { Icon } from "@/components/ui/Icon";
import { loadResidentAccountSnapshot } from "@/lib/resident/accountSnapshot";
import { loadResidentPortalContext } from "@/lib/resident/portalContext";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { formatCents } from "@/lib/money";
import { ResidentHomeActions } from "./ResidentHomeActions";
import { ResidentPortalShell } from "./ResidentPortalShell";

export default async function MinhaContaPage() {
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
          <h1 className="page-title">Minha conta</h1>
          <p className="alert alert--warning">
            <span>
              O portal usa a fração em <code>profiles.unit_id</code> (conta com que entras), não só a ficha em
              Moradores. Pede ao administrador para premir <strong>Ligar ao portal</strong> na tua linha em Admin →
              Moradores (ou editar <code>profiles</code> no Supabase).
            </span>
          </p>
        </main>
      </ResidentPortalShell>
    );
  }

  const { openCents } = await loadResidentAccountSnapshot(supabase, portal.unitId);
  const upToDate = openCents <= 0;

  return (
    <ResidentPortalShell paymentIban={portal.paymentIban}>
      <main className="page-shell page-shell--portal">
        <p className="page-eyebrow">Fração {portal.unitCode ?? "—"}</p>
        <h1 className="page-title">Minha conta</h1>
        <p className="page-lead">Consulta o teu saldo e escolhe uma ação abaixo.</p>
        <section
          className={upToDate ? "resident-hub-summary resident-hub-summary--ok" : "resident-hub-summary"}
          aria-label="Saldo em aberto"
        >
          <div>
            <p className="resident-hub-summary__label">{upToDate ? "Sem nada por pagar" : "Saldo em aberto"}</p>
            <p className="resident-hub-summary__amount">{formatCents(openCents)}</p>
          </div>
          <span className="resident-hub-summary__pill">
            <Icon name={upToDate ? "check" : "alertCircle"} size={16} />
            {upToDate ? "Contas em dia" : "Pagamento pendente"}
          </span>
        </section>
        <ResidentHomeActions />
      </main>
    </ResidentPortalShell>
  );
}
