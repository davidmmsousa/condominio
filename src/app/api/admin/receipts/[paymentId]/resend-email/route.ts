import { isGmailConfigured, sendGmailMessage } from "@/lib/gmail/gmail";
import { buildReceiptPdfForPayment } from "@/lib/receipts/buildReceiptPdfForPayment";
import { ensureSingletonCondominiumId } from "@/lib/singletonCondominium";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  if (!paymentId?.length) return NextResponse.json({ error: "ID em falta." }, { status: 400 });

  const supabase = await createServerRouteSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Proibido" }, { status: 403 });

  let cid: string;
  try {
    cid = await ensureSingletonCondominiumId(supabase);
  } catch {
    return NextResponse.json({ error: "Condomínio em falta." }, { status: 500 });
  }

  const { data: payRow, error: payErr } = await supabase
    .from("payments")
    .select("id")
    .eq("id", paymentId)
    .eq("condominium_id", cid)
    .maybeSingle();

  if (payErr || !payRow) {
    return NextResponse.json({ error: "Pagamento não encontrado." }, { status: 404 });
  }

  if (!isGmailConfigured()) {
    return NextResponse.json(
      { error: "Gmail não configurado no servidor (variáveis GMAIL_* em falta)." },
      { status: 400 },
    );
  }

  try {
    const { pdf, receiptNumber, residentEmail, payerName, unitCode } = await buildReceiptPdfForPayment(
      supabase,
      paymentId,
      cid,
    );
    if (!residentEmail) {
      return NextResponse.json(
        { error: "O morador activo desta fração não tem email na ficha (Admin → Moradores)." },
        { status: 400 },
      );
    }

    const { id } = await sendGmailMessage({
      to: residentEmail,
      subject: `Recibo ${receiptNumber} — fração ${unitCode}`,
      text: `Olá ${payerName},\n\nSegue em anexo o recibo do pagamento (reenvio manual pela gestão).\n\nCumprimentos,\nGestão do condomínio`,
      pdfFilename: `recibo-${paymentId.slice(0, 8)}.pdf`,
      pdfBytes: pdf,
    });

    return NextResponse.json({ ok: true as const, to: residentEmail, gmail_message_id: id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro ao reenviar recibo." },
      { status: 500 },
    );
  }
}
