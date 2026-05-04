import { TreasuryAdjustmentForm } from "@/app/admin/fundo-caixa/TreasuryAdjustmentForm";
import { TreasuryTransferForm } from "@/app/admin/fundo-caixa/TreasuryTransferForm";
import { formatCents } from "@/lib/money";
import { ensureSingletonCondominiumId } from "@/lib/singletonCondominium";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import { TREASURY_BOOK_LABELS, type TreasuryBookKind } from "@/lib/treasury/types";
import Link from "next/link";

export default async function FundoCaixaPage() {
  const supabase = await createServerRouteSupabaseClient();
  let cid: string;
  try {
    cid = await ensureSingletonCondominiumId(supabase);
  } catch {
    return (
      <main style={{ paddingTop: 24 }}>
        <h1 style={{ marginTop: 0 }}>Fundo de caixa</h1>
        <p style={{ color: "#b00020" }}>Condomínio em falta ou erro de configuração.</p>
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
      <main style={{ paddingTop: 24 }}>
        <h1 style={{ marginTop: 0 }}>Fundo de caixa</h1>
        <p style={{ color: "#b00020" }}>
          Não foi possível ler as contas de tesouraria ({aErr.message}). Aplica{" "}
          <code>supabase/patch_treasury.sql</code> no Supabase.
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
      <main style={{ paddingTop: 24 }}>
        <h1 style={{ marginTop: 0 }}>Fundo de caixa</h1>
        <p style={{ color: "#b00020" }}>{mbErr.message}</p>
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
      <main style={{ paddingTop: 24 }}>
        <h1 style={{ marginTop: 0 }}>Fundo de caixa</h1>
        <p style={{ color: "#b00020" }}>{mrErr.message}</p>
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

  return (
    <main style={{ paddingTop: 24, maxWidth: 980 }}>
      <h1 style={{ marginTop: 0 }}>Fundo de caixa</h1>
      <p style={{ color: "#555", maxWidth: 720, lineHeight: 1.55 }}>
        Três contas internas: <strong>numerário</strong>, <strong>conta à ordem</strong> e <strong>conta a prazo</strong>
        . Os pagamentos dos moradores registam entrada na conta que escolheres; as despesas debitam a conta de onde o
        custo saiu. Antecipação por morador não mexa na tesouraria — gera um pagamento simbólico na conta corrente da
        fração.
      </p>

      <section
        style={{
          marginTop: 24,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        {accountRows.map((a) => (
          <div
            key={a.id}
            style={{
              padding: 16,
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              background: "#fafafa",
            }}
          >
            <div style={{ fontSize: 13, color: "#64748b" }}>{TREASURY_BOOK_LABELS[a.kind]}</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{formatCents(balanceByAccount.get(a.id) ?? 0)}</div>
          </div>
        ))}
      </section>

      <div
        style={{
          marginTop: 36,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 28,
          alignItems: "start",
        }}
      >
        <div style={{ padding: 20, borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff" }}>
          <TreasuryTransferForm />
        </div>
        <div style={{ padding: 20, borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff" }}>
          <TreasuryAdjustmentForm />
        </div>
      </div>

      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 18 }}>Últimos movimentos</h2>
        {!recent.length ? (
          <p style={{ color: "#64748b" }}>Ainda não há movimentos (ou patch ainda não aplicado).</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
                  <th style={{ padding: "8px 6px" }}>Data</th>
                  <th style={{ padding: "8px 6px" }}>Conta</th>
                  <th style={{ padding: "8px 6px" }}>Valor</th>
                  <th style={{ padding: "8px 6px" }}>Descrição</th>
                  <th style={{ padding: "8px 6px" }}>Ligação</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>
                      {new Date(r.occurred_at).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td style={{ padding: "8px 6px" }}>
                      {r.treasury_accounts?.kind ? TREASURY_BOOK_LABELS[r.treasury_accounts.kind] : "—"}
                    </td>
                    <td style={{ padding: "8px 6px", fontWeight: r.amount_cents < 0 ? 600 : 500 }}>{formatCents(r.amount_cents)}</td>
                    <td style={{ padding: "8px 6px", color: "#334155" }}>{r.memo || "—"}</td>
                    <td style={{ padding: "8px 6px", fontSize: 12, color: "#64748b" }}>
                      {r.payment_id
                        ? "Pagamento"
                        : r.expense_id
                          ? "Despesa"
                          : r.transfer_group_id
                            ? "Transferência"
                            : "Ajuste"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p style={{ marginTop: 32 }}>
        <Link href="/admin" style={{ color: "#555", fontSize: 14 }}>
          ← Início admin
        </Link>
      </p>
    </main>
  );
}
