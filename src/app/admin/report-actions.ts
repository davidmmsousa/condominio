"use server";

import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function advanceOperatingYear() {
  const supabase = await createServerRouteSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/minha-conta");

  const { data: condo, error } = await supabase
    .from("condominiums")
    .select("id, operating_year")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !condo) {
    redirect("/admin/relatorios?err=" + encodeURIComponent("Não foi possível ler o condomínio. Corre o patch_operating_year.sql na base."));
  }

  const current = condo.operating_year;
  if (typeof current !== "number" || !Number.isFinite(current)) {
    redirect("/admin/relatorios?err=" + encodeURIComponent("operating_year inválido na base."));
  }

  const nextY = current + 1;
  const { error: uErr } = await supabase.from("condominiums").update({ operating_year: nextY }).eq("id", condo.id);
  if (uErr) redirect("/admin/relatorios?err=" + encodeURIComponent(uErr.message));

  revalidatePath("/admin");
  revalidatePath("/admin/relatorios");
  redirect("/admin/relatorios?ok=year_advanced");
}
