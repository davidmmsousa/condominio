import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { formatCents } from "@/lib/money";
import Link from "next/link";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ unitId: string }> };

type TimelineRow = {
  sort: number;
  tie: number;
  dateLabel: string;
  label: string;
  debit: number;
  credit: number;
  balanceAfter: number;
};

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

export default async function ContaCorrenteUnitPage({ params }: Props) {
  const { unitId } = await params;
  if (!isUuid(unitId)) redirect("/admin/contas-correntes");

  const supabase = await createServerRouteSupabaseClient();
  const { data: unit } = await supabase.from("units").select("id, code").eq("id", unitId).maybeSingle();
  if (!unit) redirect("/admin/contas-correntes");

  const { data: charges } = await supabase
    .from("charges")
    .select("id, due_date, reference_month, kind, amount_cents, charge_projects ( title )")
    .eq("unit_id", unitId)
    .order("due_date", { ascending: true });

  const { data: payments } = await supabase
    .from("payments")
    .select("id, paid_at, amount_cents, method, note")
    .eq("unit_id", unitId)
    .order("paid_at", { ascending: true });

  type Ch = {
    id: string;
    due_date: string;
    reference_month: string | null;
    kind: string;
    amount_cents: number;
    charge_projects: { title: string } | null;
  };
  type Pay = {
    id: string;
    paid_at: string;
    amount_cents: number;
    method: string | null;
    note: string | null;
  };

  const chRows = (charges ?? []) as unknown as Ch[];
  const payRows = (payments ?? []) as unknown as Pay[];

  const raw: Omit<TimelineRow, "balanceAfter">[] = [];

  for (const c of chRows) {
    const sort = new Date(`${c.due_date}T12:00:00`).getTime();
    let label: string;
    if (c.kind === "corrente" && c.reference_month) {
      label = `Quota ${c.reference_month.slice(0, 7)}`;
    } else if (c.kind === "extraordinaria") {
      const t = c.charge_projects?.title?.trim();
      label = t ? `Extraordinária — ${t}` : "Cobrança extraordinária";
    } else {
      label = "Cobrança";
    }
    raw.push({
      sort,
      tie: 0,
      dateLabel: c.due_date,
      label,
      debit: c.amount_cents,
      credit: 0,
    });
  }

  for (const p of payRows) {
    const sort = new Date(p.paid_at).getTime();
    const method = p.method?.trim();
    raw.push({
      sort,
      tie: 1,
      dateLabel: new Date(p.paid_at).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" }),
      label: method ? `Pagamento (${method})` : "Pagamento",
      debit: 0,
      credit: p.amount_cents,
    });
  }

  raw.sort((a, b) => (a.sort !== b.sort ? a.sort - b.sort : a.tie - b.tie));

  const timeline: TimelineRow[] = [];
  let balance = 0;
  for (const r of raw) {
    balance += r.debit - r.credit;
    timeline.push({ ...r, balanceAfter: balance });
  }

  const totalDebit = chRows.reduce((s, c) => s + c.amount_cents, 0);
  const totalCredit = payRows.reduce((s, p) => s + p.amount_cents, 0);
  const saldo = totalDebit - totalCredit;

  return (
    <main style={{ paddingTop: 24 }}>
      <p style={{ marginTop: 0 }}>
        <Link href="/admin/contas-correntes" style={{ color: "#555", fontSize: 14 }}>
          ← Todas as frações
        </Link>
      </p>
      <h1 style={{ marginTop: 8 }}>Conta corrente — fração {unit.code}</h1>
      <p style={{ color: "#555", maxWidth: 720 }}>
        Saldo devedor positivo = o condómino deve ao condomínio (no total das cobranças vs. pagamentos registados).
      </p>

      <section
        style={{
          marginTop: 20,
          padding: 16,
          borderRadius: 10,
          border: "1px solid #e2e8f0",
          maxWidth: 520,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
          fontSize: 14,
        }}
      >
        <div>
          <div style={{ color: "#64748b" }}>Total cobranças</div>
          <strong>{formatCents(totalDebit)}</strong>
        </div>
        <div>
          <div style={{ color: "#64748b" }}>Total pagamentos</div>
          <strong>{formatCents(totalCredit)}</strong>
        </div>
        <div>
          <div style={{ color: "#64748b" }}>Saldo</div>
          <strong style={{ color: saldo > 0 ? "#b45309" : saldo < 0 ? "#047857" : "#111" }}>{formatCents(saldo)}</strong>
        </div>
      </section>

      <h2 style={{ fontSize: 18, marginTop: 32 }}>Extrato cronológico</h2>
      {!timeline.length ? (
        <p style={{ color: "#64748b" }}>Sem movimentos ainda.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", maxWidth: 920, borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
                <th style={{ padding: "8px 6px" }}>Data</th>
                <th style={{ padding: "8px 6px" }}>Descrição</th>
                <th style={{ padding: "8px 6px" }}>Débito</th>
                <th style={{ padding: "8px 6px" }}>Crédito</th>
                <th style={{ padding: "8px 6px" }}>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {timeline.map((r, idx) => (
                <tr key={`${r.sort}-${r.tie}-${idx}`} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>{r.dateLabel}</td>
                  <td style={{ padding: "8px 6px" }}>{r.label}</td>
                  <td style={{ padding: "8px 6px" }}>{r.debit ? formatCents(r.debit) : "—"}</td>
                  <td style={{ padding: "8px 6px" }}>{r.credit ? formatCents(r.credit) : "—"}</td>
                  <td style={{ padding: "8px 6px", fontWeight: 600 }}>{formatCents(r.balanceAfter)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ marginTop: 28 }}>
        <Link href="/admin/pagamentos">Registar pagamento / transferência →</Link>
      </p>
    </main>
  );
}
