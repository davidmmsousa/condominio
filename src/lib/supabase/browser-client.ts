import { createBrowserClient } from "@supabase/ssr";

/**
 * Lê apenas variáveis públicas aqui — não importes `@/lib/env` no browser:
 * em produção o Zod contra `process.env` no cliente causa crashes difíceis de ver.
 */
export function createBrowserSupabaseClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  if (!url || !key) {
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY no build. Na Vercel: Environment Variables → Redeploy.",
    );
  }
  try {
    new URL(url);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL não é um URL válido (revisa a variável na Vercel).");
  }
  return createBrowserClient(url, key, {
    auth: {
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });
}
