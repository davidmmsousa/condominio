import { TreasuryAdjustmentForm } from "@/app/admin/fundo-caixa/TreasuryAdjustmentForm";
import { TreasuryTransferForm } from "@/app/admin/fundo-caixa/TreasuryTransferForm";
import { formatCents } from "@/lib/money";
import { ensureSingletonCondominiumId } from "@/lib/singletonCondominium";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { TREASURY_BOOK_LABELS, type TreasuryBookKind } from "@/lib/treasury/types";
import { Icon } from "@/components/ui/Icon";

export default async function FundoCaixaPage() {
  const supabase = await createServerRouteSupabaseClient();
  let cid: string;
  try {
    cid = await ensureSingletonCondominiumId(supabase);
  } catch {
    return (
      <main>
        <h1 className="page-title">Fundo de caixa</h1>
        <p className="alert alert--error">Condomínio em falta ou erro de configuração.</p>
      </main>
    );
  }

  const { data: accounts, error: aErr } = await supabase
    .from("treasury_accounts")
    .select("id, kind")
    .eq("condominium_id", cid)
    .order("kind");

  if (aErr) {
    return (
      <main>
        <h1 className="page-title">Fundo de caixa</h1>
        <p className="alert alert--error">
          <span>
            Não foi possível ler as contas de tesouraria ({aErr.message}). Aplica{" "}
            <code>supabase/patch_treasury.sql</code> no Supabase.
          </span>
        </p>
      </main>
    );
  }

  const accountRows = (accounts ?? []) as Array<{ id: string; kind: TreasuryBookKind }>;

  const { data: movBal, error: mbErr } = await supabase
    .from("treasury_movements")
    .select("treasury_account_id, amount_cents")
    .eq("condominium_id", cid);

  if (mbErr) {
    return (
      <main>
        <h1 className="page-title">Fundo de caixa</h1>
        <p className="alert alert--error">{mbErr.message}</p>
      </main>
    );
  }

  const balanceByAccount = new Map<string, number>();
  for (const m of movBal ?? []) {
    const id = m.treasury_account_id as string;
    balanceByAccount.set(id, (balanceByAccount.get(id) ?? 0) + (m.amount_cents as number));
  }

  const { data: movRecent, error: mrErr } = await supabase
    .from("treasury_movements")
    .select("id, occurred_at, amount_cents, memo, payment_id, expense_id, transfer_group_id, treasury_accounts(kind)")
    .eq("condominium_id", cid)
    .order("occurred_at", { ascending: false })
    .limit(60);

  if (mrErr) {
    return (
      <main>
        <h1 className="page-title">Fundo de caixa</h1>
        <p className="alert alert--error">{mrErr.message}</p>
      </main>
    );
  }

  type MRow = {
    id: string;
    occurred_at: string;
    amount_cents: number;
    memo: string;
    payment_id: string | null;
    expense_id: string | null;
    transfer_group_id: string | null;
    treasury_accounts: { kind: TreasuryBookKind } | null;
  };
  const recent = (movRecent ?? []) as unknown as MRow[];

  const totalBalance = accountRows.reduce((sum, a) => sum + (balanceByAccount.get(a.id) ?? 0), 0);

  return (
    <main>
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Financeiro</p>
          <h1 className="page-title">Fundo de caixa</h1>
          <p className="page-lead">
            Três contas internas: <strong>numerário</strong>, <strong>conta à ordem</strong> e{" "}
            <strong>conta a prazo</strong>. Os pagamentos dos moradores entram na conta que escolheres; as despesas
            debitam a conta de onde o custo saiu. A antecipação por morador não mexe na tesouraria — gera um pagamento
            simbólico na conta corrente da fração.
          </p>
        </div>
      </header>

      <section className="stat-grid" aria-label="Saldos">
        {accountRows.map((a) => (
          <div key={a.id} className="stat">
            <p className="stat__label">{TREASURY_BOOK_LABELS[a.kind]}</p>
            <p className="stat__value">{formatCents(balanceByAccount.get(a.id) ?? 0)}</p>
          </div>
        ))}
        {accountRows.length > 1 ? (
          <div className="stat" style={{ background: "var(--accent-soft)", borderColor: "rgba(67, 56, 202, 0.2)" }}>
            <p className="stat__label">Total</p>
            <p className="stat__value">{formatCents(totalBalance)}</p>
          </div>
        ) : null}
      </section>

      <div className="card-grid section">
        <section className="card">
          <TreasuryTransferForm />
        </section>
        <section className="card">
          <TreasuryAdjustmentForm />
        </section>
      </div>

      <section className="section">
        <h2 className="section__title">Últimos movimentos</h2>
        {!recent.length ? (
          <div className="empty">
            <Icon name="landmark" size={28} />
            Ainda não há movimentos (ou o patch ainda não foi aplicado).
          </div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Conta</th>
                  <th className="num">Valor</th>
                  <th>Descrição</th>
                  <th>Ligação</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id}>
                    <td className="nowrap">
                      {new Date(r.occurred_at).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td>{r.treasury_accounts?.kind ? TREASURY_BOOK_LABELS[r.treasury_accounts.kind] : "—"}</td>
                    <td className="num">
                      <strong style={{ color: r.amount_cents < 0 ? "var(--danger)" : "var(--success)" }}>
                        {formatCents(r.amount_cents)}
                      </strong>
                    </td>
                    <td>{r.memo || "—"}</td>
                    <td>
                      <span className="badge badge--neutral">
                        {r.payment_id
                          ? "Pagamento"
                          : r.expense_id
                            ? "Despesa"
                            : r.transfer_group_id
                              ? "Transferência"
                              : "Ajuste"}
                      </span>
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
