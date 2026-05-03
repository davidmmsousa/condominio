"use server";

import { allocatePaymentCurrentFirst } from "@/lib/billing/allocatePayment";
import { correnteDueDateForMonth, extraordinariaDefaultDueDate } from "@/lib/billing/dueDates";
import { splitTotalCentsByPermilages } from "@/lib/billing/splitByPermilage";
import { parseEurosToCents } from "@/lib/money";
import { ensureSingletonCondominiumId } from "@/lib/singletonCondominium";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
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
    revalidatePath("/admin/moradores");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao criar morador." };
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
      })
      .select("id")
      .single();

    if (pErr || !payment) throw new Error(pErr?.message ?? "Erro ao registar pagamento.");

    const { remainingCents, allocations } = await allocatePaymentCurrentFirst(supabase, {
      paymentId: payment.id,
      condominiumId: cid,
      unitId: unit_id,
      amountCents: euros,
    });

    revalidatePath("/admin/pagamentos");
    revalidatePath("/admin/cobrancas");

    let message = `Pagamento registado. Alocações: ${allocations.length}.`;
    if (remainingCents > 0) message += ` Crédito / sem cobrança para aplicar: ${(remainingCents / 100).toFixed(2)} €`;

    revalidatePath("/admin/contas-correntes");

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
    const { supabase } = await requireAdmin();
    const cid = await singletonCondoId(supabase);
    const category_id = String(formData.get("category_id") ?? "").trim();
    const occurred_on = String(formData.get("occurred_on") ?? "").trim();
    const reference = String(formData.get("reference") ?? "").trim();
    const vendor = String(formData.get("vendor") ?? "").trim() || null;
    const amountRaw = String(formData.get("amount_euros") ?? "").trim();

    if (!category_id) throw new Error("Escolhe a rubrica.");
    if (!occurred_on) throw new Error("Indica a data da fatura.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(occurred_on)) throw new Error("Data inválida (usa AAAA-MM-DD).");
    if (!reference) throw new Error("Indica a referência (nº fatura ou documento).");

    const amount_cents = parseEurosToCents(amountRaw);
    if (amount_cents <= 0) throw new Error("O valor tem de ser maior que zero.");

    const { data: cat, error: catErr } = await supabase
      .from("expense_categories")
      .select("id")
      .eq("id", category_id)
      .eq("condominium_id", cid)
      .maybeSingle();
    if (catErr || !cat) throw new Error("Rubrica inválida ou de outro condomínio.");

    const { error } = await supabase.from("expenses").insert({
      condominium_id: cid,
      category_id,
      occurred_on,
      amount_cents,
      vendor,
      note: reference,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/admin/despesas");
    revalidatePath("/admin/relatorios");
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
    const { error } = await supabase.from("expenses").delete().eq("id", id).eq("condominium_id", cid);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/despesas");
    revalidatePath("/admin/relatorios");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao apagar despesa." };
  }
}
