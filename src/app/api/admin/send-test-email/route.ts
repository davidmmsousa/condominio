import { sendGmailMessage } from "@/lib/gmail/gmail";
import { renderReceiptPdf } from "@/lib/receipts/receiptPdf";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await createServerRouteSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (profile?.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as null | { to?: string };
  const to = body?.to;
  if (!to) return Response.json({ error: "Missing { to }" }, { status: 400 });

  const pdfBytes = await renderReceiptPdf({
    condominiumName: "Condomínio Rua Vincennes",
    receiptNumber: "2026-00001",
    issuedAtIso: new Date().toISOString(),
    payerName: "Teste",
    payerEmail: to,
    unitCode: "A",
    amountCents: 1234,
    lines: [{ label: "Quota corrente (exemplo)", amountCents: 1234 }],
  });

  const { id } = await sendGmailMessage({
    to,
    subject: "Teste: recibo (MVP condomínio)",
    text: "Email de teste do MVP do condomínio. Em anexo segue um PDF de exemplo.",
    pdfFilename: "recibo-teste.pdf",
    pdfBytes,
  });

  return Response.json({ ok: true, gmail_message_id: id });
}

