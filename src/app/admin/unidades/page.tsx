import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { CreateUnitForm } from "./CreateUnitForm";
import { DeleteUnitButton } from "./DeleteUnitButton";

export default async function UnidadesAdminPage() {
  const supabase = await createServerRouteSupabaseClient();
  const { data: units } = await supabase.from("units").select("id, code, permilagem").order("code");

  return (
    <main style={{ paddingTop: 24 }}>
      <h1 style={{ marginTop: 0 }}>Frações e permilagens</h1>
      <CreateUnitForm />
      <h2 style={{ fontSize: 18 }}>Lista</h2>
      {!units?.length ? (
        <p style={{ color: "#555" }}>Ainda não há frações. Cria a primeira acima.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {units.map((u) => (
            <li
              key={u.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 12px",
                borderBottom: "1px solid #eee",
                gap: 12,
              }}
            >
              <span>
                <strong>{u.code}</strong> — {u.permilagem} ‰
              </span>
              <DeleteUnitButton unitId={u.id} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
