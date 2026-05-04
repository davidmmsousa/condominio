-- Fundo de caixa: contas (numerário, conta à ordem, conta a prazo), movimentos,
-- origem do pagamento nas despesas e destino do numerário nos pagamentos dos moradores.
-- Executar no SQL Editor do Supabase (projeto já com schema base).

do $$ begin
  create type public.treasury_book_kind as enum ('numerario', 'conta_ordem', 'conta_prazo');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.expense_funding as enum ('numerario', 'conta_ordem', 'conta_prazo', 'morador');
exception when duplicate_object then null;
end $$;

create table if not exists public.treasury_accounts (
  id uuid primary key default uuid_generate_v4(),
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  kind public.treasury_book_kind not null,
  created_at timestamptz not null default now(),
  unique (condominium_id, kind)
);

create table if not exists public.treasury_movements (
  id uuid primary key default uuid_generate_v4(),
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  treasury_account_id uuid not null references public.treasury_accounts(id) on delete restrict,
  occurred_at timestamptz not null default now(),
  amount_cents integer not null,
  memo text not null default '',
  payment_id uuid references public.payments(id) on delete cascade,
  expense_id uuid references public.expenses(id) on delete cascade,
  transfer_group_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists treasury_movements_account_occurred_idx
  on public.treasury_movements (treasury_account_id, occurred_at desc);

create index if not exists treasury_movements_condo_idx
  on public.treasury_movements (condominium_id, occurred_at desc);

alter table public.expenses
  add column if not exists paid_from public.expense_funding not null default 'conta_ordem';

alter table public.expenses
  add column if not exists payer_unit_id uuid references public.units(id) on delete set null;

alter table public.expenses
  add column if not exists imputed_payment_id uuid references public.payments(id) on delete set null;

alter table public.payments
  add column if not exists received_in public.treasury_book_kind;

-- Pagamentos antigos: assumir entrada na conta à ordem (transferências habituais).
update public.payments set received_in = 'conta_ordem' where received_in is null;

-- Despesas antigas já têm default conta_ordem na coluna.

insert into public.treasury_accounts (condominium_id, kind)
select c.id, v.kind::public.treasury_book_kind
from public.condominiums c
cross join (
  values ('numerario'), ('conta_ordem'), ('conta_prazo')
) as v(kind)
on conflict (condominium_id, kind) do nothing;

alter table public.treasury_accounts enable row level security;
alter table public.treasury_movements enable row level security;

drop policy if exists "treasury_accounts_admin_all" on public.treasury_accounts;
create policy "treasury_accounts_admin_all" on public.treasury_accounts
  for all
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

drop policy if exists "treasury_movements_admin_all" on public.treasury_movements;
create policy "treasury_movements_admin_all" on public.treasury_movements
  for all
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');
