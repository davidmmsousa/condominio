import { ReconcileAllAllocationsButton } from "@/app/admin/contas-correntes/ReconcileAllAllocationsButton";
import { Icon } from "@/components/ui/Icon";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import Link from "next/link";

export default async function ContasCorrentesIndexPage() {
  const supabase = await createServerRouteSupabaseClient();
  const { data: units } = await supabase.from("units").select("id, code").order("code");

  return (
    <main>
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Financeiro</p>
          <h1 className="page-title">Contas correntes</h1>
          <p className="page-lead">
            Extrato por fração: cobranças (débito), pagamentos (crédito) e saldo devedor acumulado ao longo do tempo. A
            alocação às quotas é feita automaticamente na página de Pagamentos.
          </p>
        </div>
      </header>

      <ReconcileAllAllocationsButton />

      {!units?.length ? (
        <div className="empty">
          <Icon name="building" size={28} />
          Ainda não há frações. Cria frações em Admin → Frações.
        </div>
      ) : (
        <ul className="list list--link" style={{ maxWidth: 480 }}>
          {units.map((u) => (
            <li key={u.id} className="list__item">
              <Link href={`/admin/contas-correntes/${u.id}`} className="list__link">
                <span>Fração {u.code}</span>
                <Icon name="arrowRight" size={18} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
