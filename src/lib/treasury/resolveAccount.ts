import type { SupabaseClient } from "@supabase/supabase-js";
import type { TreasuryBookKind } from "@/lib/treasury/types";

export async function getTreasuryAccountId(
  supabase: SupabaseClient,
  condominiumId: string,
  kind: TreasuryBookKind,
): Promise<string> {
  const { data, error } = await supabase
    .from("treasury_accounts")
    .select("id")
    .eq("condominium_id", condominiumId)
    .eq("kind", kind)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.id) {
    throw new Error(
      "Contas de tesouraria em falta. Corre supabase/patch_treasury.sql no Supabase (cria numerário, conta à ordem e a prazo).",
    );
  }
  return data.id;
}
