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
 * MVP: um único condomínio. Usa primeiro o RPC SECURITY DEFINER (evita SELECT em
 * condominiums com RLS antes de existir política estável) e evita depender só do client.
 */
export async function ensureSingletonCondominiumId(supabase: SupabaseClient): Promise<string> {
  const { data: rpcId, error: rpcErr } = await supabase.rpc("bootstrap_singleton_condominium_if_empty");
  if (!rpcErr && typeof rpcId === "string" && rpcId.length > 0) {
    return rpcId;
  }

  if (rpcErr && !isRpcMissing(rpcErr)) {
    throw new Error(
      `Não foi possível obter/criar condomínio (${rpcErr.message}). ` +
        `Corre supabase/patch_condominiums_bootstrap_insert.sql e supabase/patch_profiles_admin_mutate_only.sql no SQL Editor.`,
    );
  }

  const { data: row, error: readErr } = await supabase
    .from("condominiums")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (readErr) {
    const stack = readErr.message.toLowerCase().includes("stack depth")
      ? " Corre supabase/patch_profiles_admin_mutate_only.sql (política profiles)."
      : "";
    throw new Error(`Erro ao ler condomínio: ${readErr.message}.${stack}`);
  }
  const existing = row?.id;
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
      insErr.message.toLowerCase().includes("violates row-level security") ||
      insErr.message.toLowerCase().includes("stack depth")
        ? " Corre supabase/patch_condominiums_bootstrap_insert.sql (RPC) e patch_profiles_admin_mutate_only.sql."
        : "";
    throw new Error(`Não foi possível criar o condomínio inicial (${insErr.message}). ${hint}`);
  }

  const id = created?.id;
  if (typeof id !== "string" || !id.length) {
    throw new Error("Não foi possível criar o condomínio inicial (resposta vazia).");
  }

  return id;
}
