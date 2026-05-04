import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { CreateResidentForm } from "./CreateResidentForm";
import { DeleteResidentButton } from "./DeleteResidentButton";
import { LinkResidentProfileButton } from "./LinkResidentProfileButton";

export default async function MoradoresAdminPage() {
  const supabase = await createServerRouteSupabaseClient();
  const { data: units } = await supabase.from("units").select("id, code").order("code");
  const { data: residents } = await supabase
    .from("residents")
    .select("id, full_name, email, phone, unit_id, units ( code )")
    .order("full_name");

  type Row = {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    unit_id: string;
    units: { code: string } | null;
  };

  const rows = (residents ?? []) as unknown as Row[];

  return (
    <main style={{ paddingTop: 24 }}>
      <h1 style={{ marginTop: 0 }}>Moradores</h1>
      <p style={{ color: "#555", maxWidth: 720 }}>
        A <strong>lista</strong> é a tabela <code>residents</code> (contactos). Com email e{" "}
        <code>SUPABASE_SERVICE_ROLE_KEY</code>, ao guardar um morador o sistema <strong>cria a conta Auth</strong> (se
        o email ainda não existir) com password em <code>RESIDENT_DEFAULT_PASSWORD</code> ou, se não definires,{" "}
        <code>tomar2026</code>. Se o email já existir, associa o perfil à fração. &quot;Ligar ao portal&quot; faz o
        mesmo numa ficha antiga.
      </p>
      <CreateResidentForm units={units ?? []} />
      <h2 style={{ fontSize: 18 }}>Lista</h2>
      {!rows.length ? (
        <p style={{ color: "#555" }}>Ainda não há moradores.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {rows.map((r) => (
            <li
              key={r.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
                padding: "12px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <div>
                <strong>{r.full_name}</strong>
                <span style={{ color: "#555" }}>
                  {" "}
                  · Fração {(r.units as { code: string } | null)?.code ?? "—"}
                </span>
                {r.email ? (
                  <div style={{ fontSize: 14, color: "#333" }}>{r.email}</div>
                ) : null}
                {r.phone ? (
                  <div style={{ fontSize: 14, color: "#333" }}>{r.phone}</div>
                ) : null}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                {r.email ? <LinkResidentProfileButton residentId={r.id} /> : null}
                <DeleteResidentButton residentId={r.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
