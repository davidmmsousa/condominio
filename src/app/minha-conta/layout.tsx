import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function MinhaContaLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerRouteSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar?redirect=%2Fminha-conta");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
  if (profile?.role === "admin") {
    redirect("/admin");
  }
  if (profile?.role !== "resident") {
    redirect("/entrar");
  }

  return <>{children}</>;
}
