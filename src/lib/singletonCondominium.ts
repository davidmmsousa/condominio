import type { SupabaseClient } from "@supabase/supabase-js";

function isRpcMissing(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const m = String(error.message ?? "").toLowerCase();
  return (
    m.includes("could not find the function") ||
    m.includes("schema cache") ||
    error.code === "PGRST202" ||
    error.code === "42883"
  );
}

/**
 * MVP: há um único condomínio. Se `condominiums` estiver vazia, cria uma linha
 * "Condomínio". Preferencialmente usa o RPC `bootstrap_singleton_condominium_if_empty`
 * (SECURITY DEFINER no Supabase) para evitar RLS/stack depth nas políticas de INSERT.
 */
export async function ensureSingletonCondominiumId(supabase: SupabaseClient): Promise<string> {
  const { data: row, error: readErr } = await supabase
    .from("condominiums")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (readErr) throw new Error(`Erro ao ler condomínio: ${readErr.message}`);
  const existing = row?.id;
  if (typeof existing === "string" && existing.length > 0) return existing;

  const { data: rpcId, error: rpcErr } = await supabase.rpc("bootstrap_singleton_condominium_if_empty");
  if (!rpcErr && typeof rpcId === "string" && rpcId.length > 0) {
    return rpcId;
  }

  if (rpcErr && !isRpcMissing(rpcErr)) {
    throw new Error(
      `Não foi possível criar o condomínio inicial (${rpcErr.message}). Corre supabase/patch_condominiums_bootstrap_insert.sql no SQL Editor.`,
    );
  }

  const { data: created, error: insErr } = await supabase
    .from("condominiums")
    .insert({ name: "Condomínio" })
    .select("id")
    .single();

  if (insErr) {
    const rlshint =
      insErr.code === "42501" ||
      insErr.message.toLowerCase().includes("row-level security") ||
      insErr.message.toLowerCase().includes("violates row-level security") ||
      insErr.message.toLowerCase().includes("stack depth")
        ? " Corre supabase/patch_condominiums_bootstrap_insert.sql (função RPC) — ou como postgres: insert into public.condominiums (name) values ('Condomínio');"
        : "";
    throw new Error(`Não foi possível criar o condomínio inicial (${insErr.message}).${rlshint}`);
  }

  const id = created?.id;
  if (typeof id !== "string" || !id.length) {
    throw new Error("Não foi possível criar o condomínio inicial (resposta vazia).");
  }

  return id;
}
