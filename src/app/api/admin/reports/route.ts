import { fetchCondominiumForRelatorios } from "@/lib/condominiumMeta";
import { ensureSingletonCondominiumId } from "@/lib/singletonCondominium";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { rowsToCsv } from "@/lib/csv";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function eurFromCents(cents: number) {
  return (cents / 100).toFixed(2);
}

async function requireAdmin(supabase: Awaited<ReturnType<typeof createServerRouteSupabaseClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 };

  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle();

  if (profile?.role !== "admin") return { ok: false as const, status: 403 };
  return { ok: true as const };
}

export async function GET(req: NextRequest) {
  const supabase = await createServerRouteSupabaseClient();
  const auth = await requireAdmin(supabase);
  if (!auth.ok) return NextResponse.json({ error: "Não autorizado" }, { status: auth.status });

  const url = req.nextUrl;
  const segment = url.searchParams.get("segment") ?? "full";
  const yearRaw = Number(url.searchParams.get("year"));
  if (!Number.isInteger(yearRaw) || yearRaw < 2000 || yearRaw > 2100) {
    return NextResponse.json({ error: "Ano inválido." }, { status: 400 });
  }
  const year = yearRaw;
  const paidStartIso = `${year}-01-01T00:00:00.000Z`;
  const paidEndExclusiveIso = `${year + 1}-01-01T00:00:00.000Z`;

  let cid: string;
  try {
    cid = await ensureSingletonCondominiumId(supabase);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Condomínio em falta.", hint: "Ver supabase/seed_condominium_if_missing.sql" },
      { status: 500 },
    );
  }

  const { row: condoRow, error: condoErr, missingOperatingYearColumn } = await fetchCondominiumForRelatorios(supabase);
  if (condoErr || !condoRow?.id || condoRow.id !== cid) {
    return NextResponse.json(
      { error: condoErr?.message ?? "Sem condomínio.", hint: "Corre supabase/patch_operating_year.sql se faltar operating_year ou RLS." },
      { status: 500 },
    );
  }
  const operatingYearForReport = missingOperatingYearColumn
    ? "(aplica patch_operating_year.sql — coluna operating_year em falta)"
    : String(condoRow.operating_year ?? "—");

  const bom = "\uFEFF";

  const { data: chargeRowsRaw, error: chErr } = await supabase
    .from("charges")
    .select("due_date, kind, reference_month, amount_cents, units ( code )")
    .eq("condominium_id", cid)
    .gte("due_date", `${year}-01-01`)
    .lte("due_date", `${year}-12-31`)
    .order("due_date", { ascending: true });

  if (chErr) return NextResponse.json({ error: chErr.message }, { status: 500 });

  const { data: payRowsRaw, error: pErr } = await supabase
    .from("payments")
    .select("paid_at, amount_cents, method, note, received_in, units ( code )")
    .eq("condominium_id", cid)
    .gte("paid_at", paidStartIso)
    .lt("paid_at", paidEndExclusiveIso)
    .order("paid_at", { ascending: true });

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  const { data: unitRowsForExp, error: uexpErr } = await supabase.from("units").select("id, code").eq("condominium_id", cid);
  if (uexpErr) return NextResponse.json({ error: uexpErr.message }, { status: 500 });
  const unitCodeById = new Map((unitRowsForExp ?? []).map((u: { id: string; code: string }) => [u.id, u.code]));

  const { data: expRowsRaw, error: expErr } = await supabase
    .from("expenses")
    .select("occurred_on, amount_cents, vendor, note, paid_from, payer_unit_id, expense_categories(name)")
    .eq("condominium_id", cid)
    .gte("occurred_on", `${year}-01-01`)
    .lte("occurred_on", `${year}-12-31`)
    .order("occurred_on", { ascending: true });

  if (expErr) return NextResponse.json({ error: expErr.message }, { status: 500 });

  type U = { code: string };

  type ChargeR = {
    due_date: string;
    kind: string;
    reference_month: string | null;
    amount_cents: number;
    units: U | null;
  };

  const chargeRows = (chargeRowsRaw ?? []) as unknown as ChargeR[];

  type PayR = {
    paid_at: string;
    amount_cents: number;
    method: string | null;
    note: string | null;
    received_in: string | null;
    units: U | null;
  };
  const payRows = (payRowsRaw ?? []) as unknown as PayR[];

  type ExpR = {
    occurred_on: string;
    amount_cents: number;
    vendor: string | null;
    note: string | null;
    paid_from: string | null;
    payer_unit_id: string | null;
    expense_categories: { name: string } | null;
  };
  const expRows = (expRowsRaw ?? []) as unknown as ExpR[];

  const chargesCsvLines: string[][] = [
    ["Fração", "Vencimento", "Tipo", "Mês_ref", "Valor_EUR"],
    ...chargeRows.map((r) => [
      r.units?.code ?? "",
      r.due_date,
      r.kind,
      r.reference_month ? r.reference_month.slice(0, 7) : "",
      eurFromCents(r.amount_cents),
    ]),
  ];

  const paymentsCsvLines: string[][] = [
    ["Fração", "Data_hora_ISO", "Valor_EUR", "Meio", "Destino_tesoura", "Nota"],
    ...payRows.map((r) => [
      r.units?.code ?? "",
      r.paid_at,
      eurFromCents(r.amount_cents),
      r.method ?? "",
      r.received_in ?? "",
      r.note ?? "",
    ]),
  ];

  const expensesCsvLines: string[][] = [
    ["Rubrica", "Data", "Valor_EUR", "Origem_pagamento", "Fracao_antecipou", "Fornecedor", "Referencia"],
    ...expRows.map((r) => [
      r.expense_categories?.name ?? "",
      r.occurred_on,
      eurFromCents(r.amount_cents),
      r.paid_from ?? "",
      r.payer_unit_id ? (unitCodeById.get(r.payer_unit_id) ?? "") : "",
      r.vendor ?? "",
      r.note ?? "",
    ]),
  ];

  type SummaryRow = Map<string, { code: string; charged: number; paid: number }>;
  const sums: SummaryRow = new Map();

  for (const r of chargeRows) {
    const code = r.units?.code ?? "?";
    const cur = sums.get(code) ?? { code, charged: 0, paid: 0 };
    cur.charged += r.amount_cents;
    sums.set(code, cur);
  }
  for (const r of payRows) {
    const code = r.units?.code ?? "?";
    const cur = sums.get(code) ?? { code, charged: 0, paid: 0 };
    cur.paid += r.amount_cents;
    sums.set(code, cur);
  }

  const summaryCsvLines: string[][] = [["Fração", "Total_cobranças_EUR", "Total_pagos_EUR", "Diff_cobra_minus_pagos_EUR"]];
  for (const { code, charged, paid } of Array.from(sums.values()).sort((a, b) => a.code.localeCompare(b.code))) {
    summaryCsvLines.push([code, eurFromCents(charged), eurFromCents(paid), eurFromCents(charged - paid)]);
  }

  function headers(csv: boolean) {
    return {
      "Content-Type": csv ? "text/csv; charset=utf-8" : "text/plain; charset=utf-8",
      "Content-Disposition": `attachment`,
    };
  }

  if (segment === "charges") {
    return new NextResponse(bom + rowsToCsv(chargesCsvLines), {
      headers: {
        ...headers(true),
        "Content-Disposition": `attachment; filename="relatorio-cobrancas-${year}.csv"`,
      },
    });
  }
  if (segment === "payments") {
    return new NextResponse(bom + rowsToCsv(paymentsCsvLines), {
      headers: {
        ...headers(true),
        "Content-Disposition": `attachment; filename="relatorio-pagamentos-${year}.csv"`,
      },
    });
  }
  if (segment === "expenses") {
    return new NextResponse(bom + rowsToCsv(expensesCsvLines), {
      headers: {
        ...headers(true),
        "Content-Disposition": `attachment; filename="relatorio-despesas-${year}.csv"`,
      },
    });
  }
  if (segment === "summary") {
    return new NextResponse(bom + rowsToCsv(summaryCsvLines), {
      headers: {
        ...headers(true),
        "Content-Disposition": `attachment; filename="relatorio-resumo-faccoes-${year}.csv"`,
      },
    });
  }

  const fullTxt = [
    `RELATÓRIO FINAL — ANO CALENDÁRIO ${year}`,
    `Gerado em: ${new Date().toISOString()}`,
    `Ano operacional definido na app (condominiums.operating_year): ${operatingYearForReport}`,
    "",
    "--- RESUMO POR FRAÇÃO ---",
    rowsToCsv(summaryCsvLines),
    "",
    "--- COBRANÇAS ---",
    rowsToCsv(chargesCsvLines),
    "",
    "--- PAGAMENTOS ---",
    rowsToCsv(paymentsCsvLines),
    "",
    "--- DESPESAS ---",
    rowsToCsv(expensesCsvLines),
    "",
    "Nota: Diferença cobrança-pagos é apenas comparação de totais do ano — não equivale ao saldo contabilístico com alocações detalhadas.",
  ].join("\r\n");

  return new NextResponse(bom + fullTxt, {
    headers: {
      ...headers(false),
      "Content-Disposition": `attachment; filename="relatorio-completo-${year}.txt"`,
    },
  });
}
