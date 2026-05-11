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
    <main style={{ paddingTop: 24 }}>
      <h1 style={{ marginTop: 0 }}>Moradores</h1>
      <p style={{ color: "#555", maxWidth: 720 }}>
        A <strong>lista</strong> é a tabela <code>residents</code> (contactos). Com email e{" "}
        <code>SUPABASE_SERVICE_ROLE_KEY</code>, ao guardar um morador o sistema <strong>cria a conta Auth</strong> (se
        o email ainda não existir) com password em <code>RESIDENT_DEFAULT_PASSWORD</code> ou, se não definires,{" "}
        <code>tomar2026</code>. Se o email já existir, associa o perfil à fração. &quot;Ligar ao portal&quot; faz o
        mesmo numa ficha antiga. O <strong>NIF</strong> (opcional) aparece nos recibos PDF.
      </p>
      <CreateResidentForm units={unitList} />
      <h2 style={{ fontSize: 18 }}>Lista</h2>
      {!rows.length ? (
        <p style={{ color: "#555" }}>Ainda não há moradores.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {rows.map((r) => (
            <li key={r.id} style={{ padding: "12px 0", borderBottom: "1px solid #eee" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <div>
                  <strong>{r.full_name}</strong>
                  <span style={{ color: "#555" }}> · Fração {r.units?.code ?? "—"}</span>
                  {r.email ? <div style={{ fontSize: 14, color: "#333" }}>{r.email}</div> : null}
                  {r.phone ? <div style={{ fontSize: 14, color: "#333" }}>{r.phone}</div> : null}
                  {r.tax_id ? <div style={{ fontSize: 14, color: "#333" }}>NIF: {r.tax_id}</div> : null}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  {r.email ? <LinkResidentProfileButton residentId={r.id} /> : null}
                  <DeleteResidentButton residentId={r.id} />
                </div>
              </div>
              <details style={{ marginTop: 10 }}>
                <summary style={{ cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#3730a3" }}>
                  Editar morador
                </summary>
                <EditResidentForm resident={r} units={unitList} />
              </details>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
