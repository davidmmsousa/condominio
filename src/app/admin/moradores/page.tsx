import { Icon } from "@/components/ui/Icon";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { CreateResidentForm } from "./CreateResidentForm";
import { DeleteResidentButton } from "./DeleteResidentButton";
import { EditResidentForm } from "./EditResidentForm";
import { LinkResidentProfileButton } from "./LinkResidentProfileButton";

type Row = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  tax_id: string | null;
  unit_id: string;
  units: { code: string } | null;
};

export default async function MoradoresAdminPage() {
  const supabase = await createServerRouteSupabaseClient();
  const { data: units } = await supabase.from("units").select("id, code").order("code");
  const { data: residents } = await supabase
    .from("residents")
    .select("id, full_name, email, phone, tax_id, unit_id, units ( code )")
    .order("full_name");

  const rows = (residents ?? []) as unknown as Row[];
  const unitList = units ?? [];

  return (
    <main>
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Gestão</p>
          <h1 className="page-title">Moradores</h1>
        </div>
      </header>

      <p className="alert alert--info" style={{ marginBottom: 24 }}>
        <span>
          A <strong>lista</strong> é a tabela <code>residents</code> (contactos). Com email e{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code>, ao guardar um morador o sistema <strong>cria a conta Auth</strong> (se
          o email ainda não existir) com password em <code>RESIDENT_DEFAULT_PASSWORD</code> ou, se não definires,{" "}
          <code>tomar2026</code>. Se o email já existir, associa o perfil à fração. «Ligar ao portal» faz o mesmo numa
          ficha antiga. O <strong>NIF</strong> (opcional) aparece nos recibos PDF.
        </span>
      </p>

      <section className="card card--narrow" style={{ maxWidth: 720 }}>
        <CreateResidentForm units={unitList} />
      </section>

      <section className="section">
        <div className="section__head">
          <h2 className="section__title">Lista</h2>
          {rows.length ? <span className="badge badge--neutral">{rows.length} moradores</span> : null}
        </div>
        {!rows.length ? (
          <div className="empty">
            <Icon name="users" size={28} />
            Ainda não há moradores.
          </div>
        ) : (
          <ul className="list">
            {rows.map((r) => (
              <li key={r.id} className="list__item list__item--top list__item--wrap">
                <div className="list__main">
                  <div>
                    <span className="list__title">{r.full_name}</span>{" "}
                    <span className="badge">Fração {r.units?.code ?? "—"}</span>
                  </div>
                  {r.email ? <div className="list__meta">{r.email}</div> : null}
                  {r.phone ? <div className="list__meta">{r.phone}</div> : null}
                  {r.tax_id ? <div className="list__meta">NIF: {r.tax_id}</div> : null}
                </div>
                <div className="list__actions">
                  {r.email ? <LinkResidentProfileButton residentId={r.id} /> : null}
                  <DeleteResidentButton residentId={r.id} />
                </div>
                <details className="disclosure">
                  <summary>Editar morador</summary>
                  <div className="disclosure__body">
                    <EditResidentForm resident={r} units={unitList} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
