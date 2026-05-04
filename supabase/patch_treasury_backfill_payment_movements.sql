-- Retrocesso: criar movimentos de tesouraria para pagamentos já registados
-- antes de existir `treasury_movements`, ou quando o registo foi feito sem patch.
--
-- Pré-requisito: já ter corrido `patch_treasury.sql` (tabelas e coluna `received_in`).
-- Executar uma vez no SQL Editor do Supabase.

-- Se correste uma versão antiga do patch que punha conta_ordem em pagamentos de antecipação:
update public.payments
set received_in = null
where coalesce(method, '') ilike '%Antecipação (despesa)%'
  and received_in is not null;

insert into public.treasury_movements (
  condominium_id,
  treasury_account_id,
  occurred_at,
  amount_cents,
  memo,
  payment_id
)
select
  p.condominium_id,
  ta.id,
  p.paid_at,
  p.amount_cents,
  'Entrada — pagamento de fração (regularização)',
  p.id
from public.payments p
inner join public.treasury_accounts ta
  on ta.condominium_id = p.condominium_id
  and ta.kind = coalesce(p.received_in, 'conta_ordem'::public.treasury_book_kind)
where not exists (
  select 1 from public.treasury_movements tm where tm.payment_id = p.id
)
-- Acertos por despesa antecipada pelo morador: não são entrada na caixa do condomínio
and coalesce(p.method, '') not ilike '%Antecipação (despesa)%';
