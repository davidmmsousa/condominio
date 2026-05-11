import type { SupabaseClient } from "@supabase/supabase-js";

export type ResidentPortalContext = {
  userEmail: string;
  condominiumId: string | null;
  paymentIban: string | null;
  unitId: string | null;
  unitCode: string | null;
};

export async function loadResidentPortalContext(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string,
): Promise<ResidentPortalContext> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("unit_id, condominium_id")
    .eq("user_id", userId)
    .maybeSingle();

  let paymentIban: string | null = null;
  if (profile?.condominium_id) {
    const { data: condo } = await supabase
      .from("condominiums")
      .select("payment_iban")
      .eq("id", profile.condominium_id)
      .maybeSingle();
    paymentIban = condo?.payment_iban?.trim() || null;
  }

  const unitId = profile?.unit_id ?? null;
  const { data: unitRow } = unitId
    ? await supabase.from("units").select("code").eq("id", unitId).maybeSingle()
    : { data: null };

  return {
    userEmail,
    condominiumId: profile?.condominium_id ?? null,
    paymentIban,
    unitId,
    unitCode: unitRow?.code ?? null,
  };
}
