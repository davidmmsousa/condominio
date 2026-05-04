import { fetchCondominiumForRelatorios } from "@/lib/condominiumMeta";
import { fetchYearReportDataset } from "@/lib/reports/yearReportDataset";
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

  let cid: string;
  try {
    cid = await ensureSingletonCondominiumId(supabase);
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Condomínio em falta.",
        hint: "Ver supabase/seed_condominium_if_missing.sql",
      },
      { status: 500 },
    );
  }

  const { row: condoRow, error: condoErr, missingOperatingYearColumn } = await fetchCondominiumForRelatorios(supabase);
  if (condoErr || !condoRow?.id || condoRow.id !== cid) {
    return NextResponse.json(
      {
        error: condoErr?.message ?? "Sem condomínio.",
        hint: "Corre supabase/patch_operating_year.sql se faltar operating_year ou RLS.",
      },
      { status: 500 },
    );
  }
  const operatingYearForReport = missingOperatingYearColumn
    ? "(aplica patch_operating_year.sql — coluna operating_year em falta)"
    : String(condoRow.operating_year ?? "—");

  let dataset;
  try {
    dataset = await fetchYearReportDataset(supabase, cid, year);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro ao carregar dados." }, { status: 500 });
  }

  const { chargeRows, payRows, expRows, summaryRows, unitCodeById } = dataset;

  const bom = "\uFEFF";

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

  const summaryCsvLines: string[][] = [["Fração", "Total_cobranças_EUR", "Total_pagos_EUR", "Diff_cobra_minus_pagos_EUR"]];
  for (const { code, charged, paid } of summaryRows) {
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
