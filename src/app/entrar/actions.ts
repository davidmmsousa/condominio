"use server";

import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";

export async function signOutServer() {
  const supabase = await createServerRouteSupabaseClient();
  await supabase.auth.signOut();
  redirect("/entrar");
}
