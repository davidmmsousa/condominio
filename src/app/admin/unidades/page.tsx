import { Icon } from "@/components/ui/Icon";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { CreateUnitForm } from "./CreateUnitForm";
import { DeleteUnitButton } from "./DeleteUnitButton";

export default async function UnidadesAdminPage() {
  const supabase = await createServerRouteSupabaseClient();
  const { data: units } = await supabase.from("units").select("id, code, permilagem").order("code");

  return (
    <main>
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Gestão</p>
          <h1 className="page-title">Frações e permilagens</h1>
          <p className="page-lead">A permilagem de cada fração define a repartição das quotas mensais.</p>
        </div>
      </header>

      <div className="card-grid">
        <section className="card">
          <CreateUnitForm />
        </section>

        <section>
          <div className="section__head">
            <h2 className="section__title">Lista</h2>
            {units?.length ? <span className="badge badge--neutral">{units.length} frações</span> : null}
          </div>
          {!units?.length ? (
            <div className="empty">
              <Icon name="building" size={28} />
              Ainda não há frações. Cria a primeira ao lado.
            </div>
          ) : (
            <ul className="list">
              {units.map((u) => (
                <li key={u.id} className="list__item">
                  <span>
                    <span className="list__title">{u.code}</span> <span className="list__meta">· {u.permilagem} ‰</span>
                  </span>
                  <DeleteUnitButton unitId={u.id} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
