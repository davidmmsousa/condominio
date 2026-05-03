import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import Link from "next/link";

export default async function ContasCorrentesIndexPage() {
  const supabase = await createServerRouteSupabaseClient();
  const { data: units } = await supabase.from("units").select("id, code").order("code");

  return (
    <main style={{ paddingTop: 24 }}>
      <h1 style={{ marginTop: 0 }}>Contas correntes</h1>
      <p style={{ color: "#555", maxWidth: 640, lineHeight: 1.55 }}>
        Extrato por fração: cobranças (débito), pagamentos (crédito) e saldo devedor acumulado ao longo do tempo. Os
        pagamentos são os valores que entraram na conta do condomínio; a alocação às quotas é feita automaticamente na
        página de Pagamentos.
      </p>
      {!units?.length ? (
        <p style={{ color: "#64748b" }}>Ainda não há frações. Cria frações em Admin → Frações.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, maxWidth: 420 }}>
          {units.map((u) => (
            <li key={u.id} style={{ borderBottom: "1px solid #eee" }}>
              <Link
                href={`/admin/contas-correntes/${u.id}`}
                style={{
                  display: "block",
                  padding: "14px 8px",
                  textDecoration: "none",
                  color: "#111",
                  fontWeight: 600,
                }}
              >
                Fração {u.code} →
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p style={{ marginTop: 28 }}>
        <Link href="/admin">← Início admin</Link>
      </p>
    </main>
  );
}
