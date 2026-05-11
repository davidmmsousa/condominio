import { buildReceiptPdfForPayment } from "@/lib/receipts/buildReceiptPdfForPayment";
import { ensureSingletonCondominiumId } from "@/lib/singletonCondominium";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  if (!paymentId?.length) return NextResponse.json({ error: "ID em falta." }, { status: 400 });

  const supabase = await createServerRouteSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, unit_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profile?.role !== "resident" || !profile.unit_id) {
    return NextResponse.json({ error: "Proibido" }, { status: 403 });
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("id, unit_id")
    .eq("id", paymentId)
    .maybeSingle();
  if (!payment || payment.unit_id !== profile.unit_id) {
    return NextResponse.json({ error: "Recibo não encontrado." }, { status: 404 });
  }

  let cid: string;
  try {
    cid = await ensureSingletonCondominiumId(supabase);
  } catch {
    return NextResponse.json({ error: "Condomínio em falta." }, { status: 500 });
  }

  try {
    const { pdf } = await buildReceiptPdfForPayment(supabase, paymentId, cid);
    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="recibo-${paymentId.slice(0, 8)}.pdf"`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro ao gerar recibo." },
      { status: 404 },
    );
  }
}
