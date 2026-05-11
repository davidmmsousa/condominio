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
          <p className="page-lead">
            O portal usa a fração em <code>profiles.unit_id</code> (conta com que entras), não só a ficha em Moradores.
            Pede ao administrador para premir <strong>Ligar ao portal</strong> na tua linha em Admin → Moradores (ou editar{" "}
            <code>profiles</code> no Supabase).
          </p>
        </main>
      </ResidentPortalShell>
    );
  }

  const { openCents } = await loadResidentAccountSnapshot(supabase, portal.unitId);

  return (
    <ResidentPortalShell paymentIban={portal.paymentIban}>
      <main className="page-shell page-shell--portal">
        <h1 className="page-title">Minha conta</h1>
        <p className="page-lead">
          Fração <strong>{portal.unitCode ?? "—"}</strong>. Escolhe uma ação abaixo.
        </p>
        <section className="resident-hub-summary" aria-label="Saldo em aberto">
          <p className="resident-hub-summary__label">{openCents > 0 ? "Saldo em aberto" : "Sem nada por pagar"}</p>
          <p className="resident-hub-summary__amount">{formatCents(openCents)}</p>
        </section>
        <ResidentHomeActions />
      </main>
    </ResidentPortalShell>
  );
}
