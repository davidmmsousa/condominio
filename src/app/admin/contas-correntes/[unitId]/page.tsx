import { ReconcileUnitAllocationsButton } from "@/app/admin/contas-correntes/ReconcileUnitAllocationsButton";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { formatCents } from "@/lib/money";
import { Icon } from "@/components/ui/Icon";
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
    <main>
      <Link href="/admin/contas-correntes" className="back-link">
        <Icon name="arrowLeft" size={16} />
        Todas as frações
      </Link>
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Conta corrente</p>
          <h1 className="page-title">Fração {unit.code}</h1>
          <p className="page-lead">
            Saldo positivo = o condómino deve ao condomínio (total das cobranças menos pagamentos registados).
          </p>
        </div>
        <Link href="/admin/pagamentos" className="btn btn--primary">
          Registar pagamento
          <Icon name="arrowRight" size={16} />
        </Link>
      </header>

      <div className="stat-grid">
        <div className="stat">
          <p className="stat__label">Total cobranças</p>
          <p className="stat__value">{formatCents(totalDebit)}</p>
        </div>
        <div className="stat">
          <p className="stat__label">Total pagamentos</p>
          <p className="stat__value">{formatCents(totalCredit)}</p>
        </div>
        <div className="stat">
          <p className="stat__label">Saldo</p>
          <p
            className={
              saldo > 0 ? "stat__value stat__value--positive" : saldo < 0 ? "stat__value stat__value--negative" : "stat__value"
            }
          >
            {formatCents(saldo)}
          </p>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <ReconcileUnitAllocationsButton unitId={unit.id} />
      </div>

      <section className="section">
        <h2 className="section__title">Extrato cronológico</h2>
        {!timeline.length ? (
          <div className="empty">
            <Icon name="inbox" size={28} />
            Sem movimentos ainda.
          </div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th className="num">Débito</th>
                  <th className="num">Crédito</th>
                  <th className="num">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {timeline.map((r, idx) => (
                  <tr key={`${r.sort}-${r.tie}-${idx}`}>
                    <td className="nowrap">{r.dateLabel}</td>
                    <td>{r.label}</td>
                    <td className="num">{r.debit ? formatCents(r.debit) : "—"}</td>
                    <td className="num">{r.credit ? formatCents(r.credit) : "—"}</td>
                    <td className="num">
                      <strong>{formatCents(r.balanceAfter)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
