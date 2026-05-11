import { isGmailConfigured, sendGmailMessage } from "@/lib/gmail/gmail";
import { env } from "@/lib/env";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FILES = 4;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TITLE_LEN = 120;
const MAX_BODY_LEN = 2000;

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

function sanitizeFilename(name: string, index: number, mime: string): string {
  const base = name.replace(/[^\w.\-]+/g, "_").slice(0, 80) || `foto-${index + 1}`;
  if (base.includes(".")) return base;
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  return `${base}.${ext}`;
}

export async function POST(req: Request) {
  const supabase = await createServerRouteSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, unit_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profile?.role !== "resident") return NextResponse.json({ error: "Proibido." }, { status: 403 });
  if (!profile.unit_id) {
    return NextResponse.json({ error: "A tua conta ainda não está ligada a uma fração." }, { status: 400 });
  }

  if (!isGmailConfigured() || !env.GMAIL_SENDER) {
    return NextResponse.json({ error: "Envio de reportes por email não está configurado no servidor." }, { status: 503 });
  }

  const form = await req.formData();
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  if (!title) return NextResponse.json({ error: "Indica um título." }, { status: 400 });
  if (title.length > MAX_TITLE_LEN) return NextResponse.json({ error: "Título demasiado longo." }, { status: 400 });
  if (!description) return NextResponse.json({ error: "Indica uma descrição." }, { status: 400 });
  if (description.length > MAX_BODY_LEN) {
    return NextResponse.json({ error: "Descrição demasiado longa." }, { status: 400 });
  }

  const { data: unitRow } = await supabase.from("units").select("code").eq("id", profile.unit_id).maybeSingle();
  const unitCode = unitRow?.code ?? "—";

  const fileEntries = form.getAll("photos").filter((v): v is File => v instanceof File && v.size > 0);
  if (fileEntries.length > MAX_FILES) {
    return NextResponse.json({ error: `Máximo ${MAX_FILES} fotografias.` }, { status: 400 });
  }

  const attachments = [];
  for (let i = 0; i < fileEntries.length; i++) {
    const file = fileEntries[i];
    const mime = (file.type || "application/octet-stream").toLowerCase();
    if (!ALLOWED_MIME.has(mime)) {
      return NextResponse.json({ error: "Só são aceites imagens (JPG, PNG, WebP)." }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "Cada fotografia pode ter no máximo 5 MB." }, { status: 400 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    attachments.push({
      filename: sanitizeFilename(file.name, i, mime),
      mimeType: mime,
      bytes,
    });
  }

  const text = [
    "Novo reporte de problema no portal do morador.",
    "",
    `Título: ${title}`,
    `Fração: ${unitCode}`,
    `Morador: ${user.email ?? "—"}`,
    "",
    "Descrição:",
    description,
    "",
    attachments.length ? `Anexos: ${attachments.length} fotografia(s).` : "Sem fotografias anexadas.",
  ].join("\n");

  try {
    await sendGmailMessage({
      to: env.GMAIL_SENDER,
      subject: `Condominio - Reporte: ${title}`,
      text,
      attachments,
    });
    return NextResponse.json({ ok: true as const });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro ao enviar o reporte." },
      { status: 500 },
    );
  }
}
