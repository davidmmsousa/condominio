import "server-only";
import { z } from "zod";

/** Espaços/newlines colados na Vercel fazem falhar .url() sem trim. */
function trimmedString() {
  return z.preprocess((v) => (typeof v === "string" ? v.trim() : v), z.string());
}

const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: trimmedString().pipe(z.string().url()),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: trimmedString().pipe(z.string().min(1)),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  GMAIL_CLIENT_ID: z.string().min(1).optional(),
  GMAIL_CLIENT_SECRET: z.string().min(1).optional(),
  GMAIL_REFRESH_TOKEN: z.string().min(1).optional(),
  /** String vazia no .env trata como omisso — evita erro de email no servidor. */
  GMAIL_SENDER: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().email().optional(),
  ),
});

export const env = EnvSchema.parse(process.env);

