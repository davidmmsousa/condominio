"use server";

import { randomUUID } from "node:crypto";
import { allocatePaymentCurrentFirst } from "@/lib/billing/allocatePayment";
import { reconcilePaymentAllocationsForUnit } from "@/lib/billing/reconcileUnitAllocations";
import { isGmailConfigured, sendGmailMessage } from "@/lib/gmail/gmail";
import { buildReceiptPdfForPayment } from "@/lib/receipts/buildReceiptPdfForPayment";
import { correnteDueDateForMonth, extraordinariaDefaultDueDate } from "@/lib/billing/dueDates";
import { splitTotalCentsByPermilages } from "@/lib/billing/splitByPermilage";
import { parseEurosToCents } from "@/lib/money";
import { getTreasuryAccountId } from "@/lib/treasury/resolveAccount";
import type { ExpenseFunding, TreasuryBookKind } from "@/lib/treasury/types";
import { createResidentAuthUserOrLink, tryLinkAuthProfileToResident } from "@/lib/auth/residentAuthBootstrap";
import { env } from "@/lib/env";
import { ensureSingletonCondominiumId } from "@/lib/singletonCondominium";
import { createServerRouteSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase/server-client";
import { revalidatePath } from "next/cache";

export type ActionState = { ok?: boolean; error?: string; message?: string; paymentId?: string };

async function requireAdmin() {
  const supabase = await createServerRouteSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada. Volta a entrar.");
  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
  if (profile?.role !== "admin") throw new Error("Sem permissões de administrador.");
  return { supabase, user };
}

async function singletonCondoId(supabase: Awaited<ReturnType<typeof createServerRouteSupabaseClient>>) {
  return ensureSingletonCondominiumId(supabase);
}

function parseTreasuryBookKind(v: string): TreasuryBookKind | null {
  if (v === "numerario" || v === "conta_ordem" || v === "conta_prazo") return v;
  return null;
}

function parseExpenseFunding(v: string): ExpenseFunding | null {
  if (v === "numerario" || v === "conta_ordem" || v === "conta_prazo" || v === "morador") return v;
  return null;
}

export async function createUnitAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  try {
    const { supabase } = await requireAdmin();
    const cid = await singletonCondoId(supabase);
    const code = String(formData.get("code") ?? "").trim();
    const permRaw = Number(String(formData.get("permilagem") ?? "").replace(",", "."));
    if (!code) throw new Error("Indica o código da fração.");
    if (!Number.isFinite(permRaw) || permRaw <= 0 || !Number.isInteger(permRaw)) {
      throw new Error("A permilagem deve ser um número inteiro positivo.");
    }
    const { error } = await supabase.from("units").insert({
      condominium_id: cid,
      code,
      permilagem: permRaw,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/admin/unidades");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao criar fração." };
  }
}

export async function deleteUnitAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  try {
    const { supabase } = await requireAdmin();
    const cid = await singletonCondoId(supabase);
    const id = String(formData.get("id") ?? "").trim();
    if (!id) throw new Error("ID em falta.");
    const { error } = await supabase.from("units").delete().eq("id", id).eq("condominium_id", cid);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/unidades");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao apagar (há moradores nesta fração?)." };
  }
}

export async function createResidentAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  try {
    const { supabase } = await requireAdmin();
    const cid = await singletonCondoId(supabase);
    const full_name = String(formData.get("full_name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim() || null;
    const phone = String(formData.get("phone") ?? "").trim() || null;
    const unit_id = String(formData.get("unit_id") ?? "").trim();
    if (!full_name) throw new Error("Indica o nome.");
    if (!unit_id) throw new Error("Escolhe a fração.");
    const { error } = await supabase.from("residents").insert({
      condominium_id: cid,
      unit_id,
      full_name,
      email,
      phone,
      is_active: true,
    });
    if (error) throw new Error(error.message);

    let message: string | undefined;
    let authTouched = false;
    if (email) {
      if (!env.SUPABASE_SERVICE_ROLE_KEY) {
        message =
          "Morador guardado. Para criar conta de login automaticamente, define SUPABASE_SERVICE_ROLE_KEY no servidor (e opcionalmente RESIDENT_DEFAULT_PASSWORD).";
      } else {
        const boot = await createResidentAuthUserOrLink({
          email,
          unitId: unit_id,
          condominiumId: cid,
        });
        if (boot.status === "created") {
          authTouched = true;
          message =
            "Morador registado e conta de login criada (email confirmado). Password inicial: valor em RESIDENT_DEFAULT_PASSWORD no servidor, ou tomar2026 se não definires.";
        } else if (boot.status === "linked") {
          authTouched = true;
          message = "Morador registado. Já existia conta com este email — perfil associado à fração no portal.";
        } else {
          message = `Morador registado. Aviso: ${boot.message}`;
        }
      }
    }

    revalidatePath("/admin/moradores");
    if (authTouched) revalidatePath("/minha-conta");
    return { ok: true, message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao criar morador." };
  }
}

export async function linkResidentProfileAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  try {
    const { supabase } = await requireAdmin();
    const cid = await singletonCondoId(supabase);
    const id = String(formData.get("id") ?? "").trim();
    if (!id) throw new Error("ID em falta.");

    const { data: row, error: re } = await supabase
      .from("residents")
      .select("email, unit_id")
      .eq("id", id)
      .eq("condominium_id", cid)
      .maybeSingle();
    if (re) throw new Error(re.message);
    if (!row) throw new Error("Morador não encontrado.");
    if (!row.email?.trim()) throw new Error("Este morador não tem email na ficha.");

    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY no ambiente do servidor.");
    }

    const sync = await tryLinkAuthProfileToResident({
      email: row.email,
      unitId: row.unit_id,
      condominiumId: cid,
    });
    if (sync.rpcError) {
      throw new Error(
        `Sincronização falhou (${sync.rpcError}). Aplica supabase/patch_link_resident_profile_by_email.sql no Supabase.`,
      );
    }
    if (sync.linked) {
      revalidatePath("/admin/moradores");
      revalidatePath("/minha-conta");
      return { ok: true, message: "Perfil de login atualizado com a fração desta ficha." };
    }

    const boot = await createResidentAuthUserOrLink({
      email: row.email,
      unitId: row.unit_id,
      condominiumId: cid,
    });
    if (boot.status === "created") {
      revalidatePath("/admin/moradores");
      revalidatePath("/minha-conta");
      return {
        ok: true,
        message:
          "Conta Auth criada e associada à fração. Password inicial: RESIDENT_DEFAULT_PASSWORD no servidor ou tomar2026.",
      };
    }
    if (boot.status === "linked") {
      revalidatePath("/admin/moradores");
      revalidatePath("/minha-conta");
      return { ok: true, message: "Conta já existia — perfil associado à fração." };
    }
    throw new Error(boot.message);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao ligar ao portal." };
  }
}

export async function deleteResidentAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  try {
    const { supabase } = await requireAdmin();
    const cid = await singletonCondoId(supabase);
    const id = String(formData.get("id") ?? "").trim();
    if (!id) throw new Error("ID em falta.");
    const { error } = await supabase.from("residents").delete().eq("id", id).eq("condominium_id", cid);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/moradores");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao apagar morador." };
  }
}

export async function reconcileUnitAllocationsAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  try {
    const { supabase } = await requireAdmin();
    const cid = await singletonCondoId(supabase);
    const unit_id = String(formData.get("unit_id") ?? "").trim();
    if (!unit_id) throw new Error("Fração em falta.");

    const { data: unit, error: ue } = await supabase
      .from("units")
      .select("id")
      .eq("id", unit_id)
      .eq("condominium_id", cid)
      .maybeSingle();
    if (ue) throw new Error(ue.message);
    if (!unit) throw new Error("Fração inválida.");

    const result = await reconcilePaymentAllocationsForUnit(supabase, { condominiumId: cid, unitId: unit_id });

    revalidatePath(`/admin/contas-correntes/${unit_id}`);
    revalidatePath("/admin/contas-correntes");
    revalidatePath("/admin/pagamentos");
    revalidatePath("/admin/pagamentos/tabela-geral");
    revalidatePath("/admin/fundo-caixa");
    revalidatePath("/minha-conta");

    let message = `Reconciliado: ${result.paymentsProcessed} pagamento(s), ${result.allocationsCreated} alocação(ões).`;
    if (result.remainingTotalCents > 0) {
      message += ` Excesso sem cobrança: ${(result.remainingTotalCents / 100).toFixed(2)} €.`;
    }
    return { ok: true, message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro na reconciliação." };
  }
}

export async function reconcileAllUnitsAllocationsAction(
  _prev: ActionState | null,
  _formData: FormData,
): Promise<ActionState> {
  try {
    const { supabase } = await requireAdmin();
    const cid = await singletonCondoId(supabase);

    const { data: units, error: uerr } = await supabase
      .from("units")
      .select("id, code")
      .eq("condominium_id", cid)
      .order("code");
    if (uerr) throw new Error(uerr.message);

    let totalPayments = 0;
    let totalAllocs = 0;
    let totalRemain = 0;

    for (const u of units ?? []) {
      const r = await reconcilePaymentAllocationsForUnit(supabase, { condominiumId: cid, unitId: u.id });
      totalPayments += r.paymentsProcessed;
      totalAllocs += r.allocationsCreated;
      totalRemain += r.remainingTotalCents;
      revalidatePath(`/admin/contas-correntes/${u.id}`);
    }

    revalidatePath("/admin/contas-correntes");
    revalidatePath("/admin/pagamentos");
    revalidatePath("/admin/pagamentos/tabela-geral");
    revalidatePath("/admin/fundo-caixa");
    revalidatePath("/minha-conta");

    let message = `Todas as frações: ${units?.length ?? 0} unidade(s), ${totalPayments} pagamento(s), ${totalAllocs} alocação(ões).`;
    if (totalRemain > 0) {
      message += ` Total em excesso: ${(totalRemain / 100).toFixed(2)} €.`;
    }
    return { ok: true, message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro na reconciliação global." };
  }
}

function firstDayOfMonthFromInput(yyyyMm: string): Date {
  const [y, m] = yyyyMm.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) throw new Error("Mês de referência inválido.");
  return new Date(y, m - 1, 1);
}

export async function createManualChargeAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  try {
    const { supabase } = await requireAdmin();
    const cid = await singletonCondoId(supabase);
    const unit_id = String(formData.get("unit_id") ?? "").trim();
    const kind = String(formData.get("kind") ?? "").trim();
    const eurosRaw = String(formData.get("euros") ?? "");
    const euros = parseEurosToCents(eurosRaw);

    if (!unit_id) throw new Error("Escolhe a fração.");
    if (kind !== "corrente" && kind !== "extraordinaria") throw new Error("Tipo de cobrança inválido.");
    if (euros <= 0) throw new Error("Valor deve ser maior que zero.");

    let reference_month: string | null = null;
    let due_date: string;
    let project_id: string | null = null;

    if (kind === "corrente") {
      const ym = String(formData.get("reference_month") ?? "");
      const ref = firstDayOfMonthFromInput(ym);
      reference_month = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}-01`;
      const due = correnteDueDateForMonth(ref);
      due_date = due.toISOString().slice(0, 10);
    } else {
      const projTitle = String(formData.get("project_title") ?? "").trim();
      if (projTitle) {
        const { data: proj, error: pe } = await supabase
          .from("charge_projects")
          .insert({ condominium_id: cid, title: projTitle })
          .select("id")
          .single();
        if (pe || !proj) throw new Error(pe?.message ?? "Erro ao criar projeto de obra.");
        project_id = proj.id;
      }
      const dueInput = String(formData.get("due_date") ?? "").trim();
      if (dueInput) {
        due_date = dueInput;
      } else {
        due_date = extraordinariaDefaultDueDate(new Date()).toISOString().slice(0, 10);
      }
    }

    const { error } = await supabase.from("charges").insert({
      condominium_id: cid,
      unit_id,
      kind,
      project_id,
      reference_month,
      due_date,
      amount_cents: euros,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/admin/cobrancas");
    if (kind === "corrente") revalidatePath("/admin/pagamentos/tabela-geral");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao registar cobrança." };
  }
}

export async function generateMonthlyQuotasAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  try {
    const { supabase } = await requireAdmin();
    const cid = await singletonCondoId(supabase);
    const ym = String(formData.get("reference_month") ?? "");
    const eurosTotal = parseEurosToCents(String(formData.get("total_euros") ?? ""));
    const ref = firstDayOfMonthFromInput(ym);
    const reference_month = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}-01`;
    const due = correnteDueDateForMonth(ref);
    const due_date = due.toISOString().slice(0, 10);

    if (eurosTotal <= 0) throw new Error("Indica o valor total mensal (maior que zero).");

    const { data: units, error: ue } = await supabase
      .from("units")
      .select("id, permilagem, code")
      .eq("condominium_id", cid)
      .order("code", { ascending: true });
    if (ue) throw new Error(ue.message);
    if (!units?.length) throw new Error("Cria primeiro as frações.");

    const parts = splitTotalCentsByPermilages(
      units.map((u) => u.permilagem),
      eurosTotal,
    );

    const rows = units.map((u, i) => ({
      condominium_id: cid,
      unit_id: u.id,
      kind: "corrente" as const,
      reference_month,
      due_date,
      amount_cents: parts[i] ?? 0,
    }));

    if (rows.some((r) => r.amount_cents <= 0)) {
      throw new Error("Após repartição ficaram frações com valor zero; revisa permilagens ou total.");
    }

    const { error: insErr } = await supabase.from("charges").insert(rows);
    if (insErr) {
      if (insErr.code === "23505" || insErr.message.includes("unique")) {
        throw new Error("Já existem quotas correntes para esse mês (ou apaga/edita na base).");
      }
      throw new Error(insErr.message);
    }
    revalidatePath("/admin/cobrancas");
    revalidatePath("/admin/pagamentos/tabela-geral");
    return { ok: true, message: `Geradas ${rows.length} quotas para ${reference_month.slice(0, 7)}.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao gerar quotas." };
  }
}

export async function createPaymentAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await requireAdmin();
    const cid = await singletonCondoId(supabase);
    const unit_id = String(formData.get("unit_id") ?? "").trim();
    const eurosRaw = String(formData.get("euros") ?? "");
    const euros = parseEurosToCents(eurosRaw);
    const paid_at_raw = String(formData.get("paid_at") ?? "");
    const method = String(formData.get("method") ?? "").trim() || null;
    const note = String(formData.get("note") ?? "").trim() || null;
    const received_in =
      parseTreasuryBookKind(String(formData.get("received_in") ?? "").trim()) ?? ("conta_ordem" as TreasuryBookKind);

    if (!unit_id) throw new Error("Escolhe a fração.");
    if (euros <= 0) throw new Error("Valor deve ser maior que zero.");

    let paid_at: string;
    if (paid_at_raw) {
      const d = new Date(paid_at_raw);
      if (Number.isNaN(d.getTime())) throw new Error("Data/hora de pagamento inválida.");
      paid_at = d.toISOString();
    } else {
      paid_at = new Date().toISOString();
    }

    const { data: payment, error: pErr } = await supabase
      .from("payments")
      .insert({
        condominium_id: cid,
        unit_id,
        paid_at,
        amount_cents: euros,
        method,
        note,
        created_by: user.id,
        received_in,
      })
      .select("id")
      .single();

    if (pErr || !payment) throw new Error(pErr?.message ?? "Erro ao registar pagamento.");

    const treasuryAccountId = await getTreasuryAccountId(supabase, cid, received_in);
    const { error: tmErr } = await supabase.from("treasury_movements").insert({
      condominium_id: cid,
      treasury_account_id: treasuryAccountId,
      occurred_at: paid_at,
      amount_cents: euros,
      memo: "Entrada — pagamento de fração",
      payment_id: payment.id,
    });
    if (tmErr) throw new Error(tmErr.message);

    const { remainingCents, allocations } = await allocatePaymentCurrentFirst(supabase, {
      paymentId: payment.id,
      condominiumId: cid,
      unitId: unit_id,
      amountCents: euros,
    });

    revalidatePath("/admin/pagamentos");
    revalidatePath("/admin/pagamentos/tabela-geral");
    revalidatePath("/admin/cobrancas");

    let message = `Pagamento registado. Alocações: ${allocations.length}.`;
    if (remainingCents > 0) message += ` Crédito / sem cobrança para aplicar: ${(remainingCents / 100).toFixed(2)} €`;

    if (process.env.RECEIPT_AUTOSEND_EMAIL !== "false" && isGmailConfigured()) {
      try {
        const { pdf, receiptNumber, residentEmail, payerName, unitCode } = await buildReceiptPdfForPayment(
          supabase,
          payment.id,
          cid,
        );
        if (residentEmail) {
          await sendGmailMessage({
            to: residentEmail,
            subject: `Recibo ${receiptNumber} — fração ${unitCode}`,
            text: `Olá ${payerName},\n\nSegue em anexo o recibo do pagamento registado no condomínio.\n\nCumprimentos,\nGestão do condomínio`,
            pdfFilename: `recibo-${payment.id.slice(0, 8)}.pdf`,
            pdfBytes: pdf,
          });
          message += " Recibo enviado por email (Gmail).";
        } else {
          message += " Recibo não enviado por email: o morador da fração não tem email na ficha.";
        }
      } catch (mailErr) {
        message += ` Aviso: envio automático do recibo falhou (${mailErr instanceof Error ? mailErr.message : "erro"}). Podes descarregar o PDF na lista de pagamentos.`;
      }
    }

    revalidatePath("/admin/contas-correntes");
    revalidatePath("/admin/fundo-caixa");

    return { ok: true, message, paymentId: payment.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao registar pagamento." };
  }
}

export async function createExpenseCategoryAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  try {
    const { supabase } = await requireAdmin();
    const cid = await singletonCondoId(supabase);
    const name = String(formData.get("name") ?? "").trim();
    if (!name) throw new Error("Indica o nome da rubrica.");
    const { error } = await supabase.from("expense_categories").insert({ condominium_id: cid, name });
    if (error) {
      if (error.code === "23505") throw new Error("Já existe uma rubrica com esse nome.");
      throw new Error(error.message);
    }
    revalidatePath("/admin/despesas");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao criar rubrica." };
  }
}

export async function deleteExpenseCategoryAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  try {
    const { supabase } = await requireAdmin();
    const cid = await singletonCondoId(supabase);
    const id = String(formData.get("id") ?? "").trim();
    if (!id) throw new Error("ID em falta.");
    const { count, error: cErr } = await supabase
      .from("expenses")
      .select("*", { count: "exact", head: true })
      .eq("category_id", id)
      .eq("condominium_id", cid);
    if (cErr) throw new Error(cErr.message);
    if ((count ?? 0) > 0) {
      throw new Error("Esta rubrica tem despesas associadas. Apaga primeiro as faturas ou recategoriza.");
    }
    const { error } = await supabase.from("expense_categories").delete().eq("id", id).eq("condominium_id", cid);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/despesas");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao apagar rubrica." };
  }
}

export async function createExpenseAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  try {
    const { supabase, user } = await requireAdmin();
    const cid = await singletonCondoId(supabase);
    const category_id = String(formData.get("category_id") ?? "").trim();
    const occurred_on = String(formData.get("occurred_on") ?? "").trim();
    const reference = String(formData.get("reference") ?? "").trim();
    const vendor = String(formData.get("vendor") ?? "").trim() || null;
    const amountRaw = String(formData.get("amount_euros") ?? "").trim();
    const paid_from =
      parseExpenseFunding(String(formData.get("paid_from") ?? "").trim()) ?? ("conta_ordem" as ExpenseFunding);
    const payer_unit_id_raw = String(formData.get("payer_unit_id") ?? "").trim();

    if (!category_id) throw new Error("Escolhe a rubrica.");
    if (!occurred_on) throw new Error("Indica a data da fatura.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(occurred_on)) throw new Error("Data inválida (usa AAAA-MM-DD).");
    if (!reference) throw new Error("Indica a referência (nº fatura ou documento).");

    const amount_cents = parseEurosToCents(amountRaw);
    if (amount_cents <= 0) throw new Error("O valor tem de ser maior que zero.");

    if (paid_from === "morador" && !payer_unit_id_raw) {
      throw new Error("Indica a fração que suportou o custo (encontro de contas na conta corrente).");
    }

    const { data: cat, error: catErr } = await supabase
      .from("expense_categories")
      .select("id")
      .eq("id", category_id)
      .eq("condominium_id", cid)
      .maybeSingle();
    if (catErr || !cat) throw new Error("Rubrica inválida ou de outro condomínio.");

    let payer_unit_id: string | null = null;
    if (paid_from === "morador") {
      const { data: urow, error: uerr } = await supabase
        .from("units")
        .select("id")
        .eq("id", payer_unit_id_raw)
        .eq("condominium_id", cid)
        .maybeSingle();
      if (uerr || !urow) throw new Error("Fração inválida para antecipação.");
      payer_unit_id = urow.id;
    }

    const { data: expense, error: expErr } = await supabase
      .from("expenses")
      .insert({
        condominium_id: cid,
        category_id,
        occurred_on,
        amount_cents,
        vendor,
        note: reference,
        paid_from,
        payer_unit_id,
      })
      .select("id")
      .single();

    if (expErr || !expense) throw new Error(expErr?.message ?? "Erro ao registar despesa.");

    const paidAtIso = `${occurred_on}T12:00:00.000Z`;

    if (paid_from === "morador" && payer_unit_id) {
      const { data: payment, error: pErr } = await supabase
        .from("payments")
        .insert({
          condominium_id: cid,
          unit_id: payer_unit_id,
          paid_at: paidAtIso,
          amount_cents,
          method: "Antecipação (despesa)",
          note: `Despesa: ${reference}`,
          created_by: user.id,
          received_in: null,
        })
        .select("id")
        .single();

      if (pErr || !payment) throw new Error(pErr?.message ?? "Erro ao criar acerto na conta corrente.");

      const { error: upErr } = await supabase
        .from("expenses")
        .update({ imputed_payment_id: payment.id })
        .eq("id", expense.id);
      if (upErr) throw new Error(upErr.message);

      try {
        await allocatePaymentCurrentFirst(supabase, {
          paymentId: payment.id,
          condominiumId: cid,
          unitId: payer_unit_id,
          amountCents: amount_cents,
        });
      } catch (allocEx) {
        await supabase.from("payments").delete().eq("id", payment.id);
        await supabase.from("expenses").delete().eq("id", expense.id);
        throw allocEx;
      }
    } else if (paid_from === "numerario" || paid_from === "conta_ordem" || paid_from === "conta_prazo") {
      const treasuryAccountId = await getTreasuryAccountId(supabase, cid, paid_from);
      const { error: tmErr } = await supabase.from("treasury_movements").insert({
        condominium_id: cid,
        treasury_account_id: treasuryAccountId,
        occurred_at: paidAtIso,
        amount_cents: -amount_cents,
        memo: `Despesa: ${reference}`,
        expense_id: expense.id,
      });
      if (tmErr) throw new Error(tmErr.message);
    }

    revalidatePath("/admin/despesas");
    revalidatePath("/admin/relatorios");
    revalidatePath("/admin/pagamentos");
    revalidatePath("/admin/pagamentos/tabela-geral");
    revalidatePath("/admin/contas-correntes");
    revalidatePath("/admin/fundo-caixa");
    revalidatePath("/minha-conta");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao registar despesa." };
  }
}

export async function deleteExpenseAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  try {
    const { supabase } = await requireAdmin();
    const cid = await singletonCondoId(supabase);
    const id = String(formData.get("id") ?? "").trim();
    if (!id) throw new Error("ID em falta.");

    const { data: row, error: fe } = await supabase
      .from("expenses")
      .select("imputed_payment_id")
      .eq("id", id)
      .eq("condominium_id", cid)
      .maybeSingle();
    if (fe) throw new Error(fe.message);

    if (row?.imputed_payment_id) {
      const { error: pdErr } = await supabase.from("payments").delete().eq("id", row.imputed_payment_id);
      if (pdErr) throw new Error(pdErr.message);
    }

    const { error } = await supabase.from("expenses").delete().eq("id", id).eq("condominium_id", cid);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/despesas");
    revalidatePath("/admin/relatorios");
    revalidatePath("/admin/pagamentos");
    revalidatePath("/admin/pagamentos/tabela-geral");
    revalidatePath("/admin/contas-correntes");
    revalidatePath("/admin/fundo-caixa");
    revalidatePath("/minha-conta");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao apagar despesa." };
  }
}

export async function createTreasuryTransferAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  try {
    const { supabase } = await requireAdmin();
    const cid = await singletonCondoId(supabase);
    const from_kind = parseTreasuryBookKind(String(formData.get("from_kind") ?? "").trim());
    const to_kind = parseTreasuryBookKind(String(formData.get("to_kind") ?? "").trim());
    const euros = parseEurosToCents(String(formData.get("euros") ?? ""));
    const memo = String(formData.get("memo") ?? "").trim() || "Transferência interna";
    const occurred_raw = String(formData.get("occurred_at") ?? "").trim();

    if (!from_kind || !to_kind) throw new Error("Indica origem e destino.");
    if (from_kind === to_kind) throw new Error("Origem e destino têm de ser diferentes.");
    if (euros <= 0) throw new Error("O valor tem de ser maior que zero.");

    let occurred_at: string;
    if (occurred_raw) {
      const d = new Date(occurred_raw);
      if (Number.isNaN(d.getTime())) throw new Error("Data/hora inválida.");
      occurred_at = d.toISOString();
    } else {
      occurred_at = new Date().toISOString();
    }

    const fromId = await getTreasuryAccountId(supabase, cid, from_kind);
    const toId = await getTreasuryAccountId(supabase, cid, to_kind);
    const transfer_group_id = randomUUID();

    const { error: insErr } = await supabase.from("treasury_movements").insert([
      {
        condominium_id: cid,
        treasury_account_id: fromId,
        occurred_at,
        amount_cents: -euros,
        memo,
        transfer_group_id,
      },
      {
        condominium_id: cid,
        treasury_account_id: toId,
        occurred_at,
        amount_cents: euros,
        memo,
        transfer_group_id,
      },
    ]);
    if (insErr) throw new Error(insErr.message);

    revalidatePath("/admin/fundo-caixa");
    return { ok: true, message: "Transferência registada." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao transferir." };
  }
}

export async function createTreasuryAdjustmentAction(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  try {
    const { supabase } = await requireAdmin();
    const cid = await singletonCondoId(supabase);
    const kind = parseTreasuryBookKind(String(formData.get("kind") ?? "").trim());
    const direction = String(formData.get("direction") ?? "").trim();
    const euros = parseEurosToCents(String(formData.get("euros") ?? ""));
    const memo = String(formData.get("memo") ?? "").trim() || "Ajuste de saldo";
    const occurred_on = String(formData.get("occurred_on") ?? "").trim();

    if (!kind) throw new Error("Indica a conta.");
    if (direction !== "entrada" && direction !== "saida") throw new Error("Indica entrada ou saída.");
    if (euros <= 0) throw new Error("O valor tem de ser maior que zero.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(occurred_on)) throw new Error("Data inválida (AAAA-MM-DD).");

    const accId = await getTreasuryAccountId(supabase, cid, kind);
    const sign = direction === "entrada" ? 1 : -1;
    const occurred_at = `${occurred_on}T12:00:00.000Z`;

    const { error: insErr } = await supabase.from("treasury_movements").insert({
      condominium_id: cid,
      treasury_account_id: accId,
      occurred_at,
      amount_cents: sign * euros,
      memo,
    });
    if (insErr) throw new Error(insErr.message);

    revalidatePath("/admin/fundo-caixa");
    return { ok: true, message: "Ajuste registado." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro no ajuste." };
  }
}
