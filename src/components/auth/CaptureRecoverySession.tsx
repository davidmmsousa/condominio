"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Alguns templates de email abrem SITE_URL "/" com fragment #access_token&type=recovery.
 * Força leitura da sessão e envia para a página certa antes de remover o fragment.
 */
export function CaptureRecoverySession() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash.includes("access_token")) return;

    const search = window.location.search;
    const supabase = createBrowserSupabaseClient();

    let cancelled = false;
    async function resolve() {
      await supabase.auth.getSession();
      if (cancelled) return;

      const h = hash.toLowerCase();
      const isRecovery = h.includes("type=recovery");
      const { data } = await supabase.auth.getSession();
      if (cancelled || !data.session?.user || !isRecovery) return;

      window.history.replaceState(null, "", `${pathname}${search}`);
      router.replace("/auth/redefinir-password");
      router.refresh();
    }

    const t = window.setTimeout(() => void resolve(), 150);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [pathname, router]);

  return null;
}
