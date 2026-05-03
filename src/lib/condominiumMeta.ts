import type { SupabaseClient } from "@supabase/supabase-js";

export type CondominiumRelatoriosRow = {
  id: string;
  name: string | null;
  operating_year: number | null;
};

/** Lê condominiums; se a coluna operating_year ainda não existir na base, faz fallback só com id/name. */
export async function fetchCondominiumForRelatorios(
  supabase: SupabaseClient,
): Promise<{ row: CondominiumRelatoriosRow | null; error: Error | null; missingOperatingYearColumn: boolean }> {
  const { data, error } = await supabase
    .from("condominiums")
    .select("id, name, operating_year")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!error && data) {
    return {
      row: data as CondominiumRelatoriosRow,
      error: null,
      missingOperatingYearColumn: false,
    };
  }

  const msg = error?.message ?? "";
  if (msg.includes("operating_year") && msg.includes("does not exist")) {
    const { data: row2, error: err2 } = await supabase
      .from("condominiums")
      .select("id, name")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (err2 || !row2) {
      return { row: null, error: err2 ? new Error(err2.message) : new Error("Sem condomínio."), missingOperatingYearColumn: true };
    }
    return {
      row: { id: row2.id, name: row2.name, operating_year: null },
      error: null,
      missingOperatingYearColumn: true,
    };
  }

  return { row: null, error: error ? new Error(msg) : new Error("Sem condomínio."), missingOperatingYearColumn: false };
}
