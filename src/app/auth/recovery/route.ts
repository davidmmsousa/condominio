import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Link dedicado recuperação palavra-passe.
 * Evita Supabase Substituir a query "?next=..." do /auth/callback e enviar-te para /
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!code || !supabaseUrl?.length || !anon?.length) {
    return NextResponse.redirect(new URL("/entrar/recuperar?msg=invalid_link", request.url));
  }

  const target = new URL("/auth/redefinir-password", request.url);

  let response = NextResponse.redirect(target);

  const supabase = createServerClient(supabaseUrl, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    response = NextResponse.redirect(new URL("/entrar/recuperar?msg=invalid_link", request.url));
    return response;
  }

  return response;
}
