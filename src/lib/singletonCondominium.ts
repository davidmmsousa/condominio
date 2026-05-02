import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * MVP: há um único condomínio. Se `condominiums` estiver vazia (schemas parciais
 * ou base criada à mão), cria uma linha "Condomínio" com as defaults da tabela.
 */
export async function ensureSingletonCondominiumId(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase
    .from("condominiums")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Erro ao ler condomínio: ${error.message}`);
  const existing = data?.id;
  if (typeof existing === "string" && existing.length > 0) return existing;

  const { data: created, error: insErr } = await supabase
    .from("condominiums")
    .insert({ name: "Condomínio" })
    .select("id")
    .single();

  if (insErr) {
    const hint =
      insErr.code === "42501" ||
      insErr.message.toLowerCase().includes("row-level security") ||
      insErr.message.toLowerCase().includes("violates row-level security")
        ? ' Executa no SQL Editor: insert into public.condominiums (name) values (\'Condomínio\');'
        : "";
    throw new Error(`Não foi possível criar o condomínio inicial (${insErr.message}).${hint}`);
  }

  const id = created?.id;
  if (typeof id !== "string" || !id.length) {
    throw new Error("Não foi possível criar o condomínio inicial (resposta vazia).");
  }

  return id;
}
