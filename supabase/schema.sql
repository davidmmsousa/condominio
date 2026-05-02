-- Condo platform schema (single-condo MVP)
-- Apply in Supabase SQL editor.

create extension if not exists "uuid-ossp";

-- 1) Core entities
create table if not exists public.condominiums (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from public.condominiums) then
    insert into public.condominiums (name) values ('Condomínio');
  end if;
end $$;

create type public.user_role as enum ('admin', 'resident');

create table if not exists public.units (
  id uuid primary key default uuid_generate_v4(),
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  code text not null, -- ex: "A", "1ºD", etc.
  permilagem integer not null check (permilagem > 0),
  created_at timestamptz not null default now(),
  unique (condominium_id, code)
);

create table if not exists public.residents (
  id uuid primary key default uuid_generate_v4(),
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete restrict,
  full_name text not null,
  email text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  role public.user_role not null,
  unit_id uuid references public.units(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Auth bootstrap:
-- Automatically creates `public.profiles` on signup using Auth user metadata:
-- raw_user_meta_data should include:
-- - role: 'admin' | 'resident'
-- - condominium_id (optional; defaults to the first row in `public.condominiums`)
-- - unit_id (optional; required if role='resident')
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  c_id uuid;
  r public.user_role;
  u_id uuid;
begin
  select id into c_id from public.condominiums order by created_at asc limit 1;
  if new.raw_user_meta_data ? 'condominium_id' then
    c_id := (new.raw_user_meta_data->>'condominium_id')::uuid;
  end if;

  r := coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'resident');
  if new.raw_user_meta_data ? 'unit_id' then
    u_id := (new.raw_user_meta_data->>'unit_id')::uuid;
  else
    u_id := null;
  end if;

  insert into public.profiles (user_id, condominium_id, role, unit_id)
  values (new.id, c_id, r, u_id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.singleton_condominium_id()
returns uuid
language sql
stable
as $$
  select id from public.condominiums order by created_at asc limit 1;
$$;

-- 2) Charges and payments (account-current model)
create type public.charge_kind as enum ('corrente', 'extraordinaria');

create table if not exists public.charge_projects (
  id uuid primary key default uuid_generate_v4(),
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.charges (
  id uuid primary key default uuid_generate_v4(),
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete restrict,
  kind public.charge_kind not null,
  project_id uuid references public.charge_projects(id) on delete set null,
  reference_month date, -- for corrente: first day of month
  due_date date not null,
  amount_cents integer not null check (amount_cents > 0),
  created_at timestamptz not null default now()
);

create unique index if not exists charges_corrente_one_per_month
  on public.charges (condominium_id, unit_id, reference_month)
  where kind = 'corrente';

create unique index if not exists charges_extra_one_per_project
  on public.charges (condominium_id, unit_id, project_id)
  where kind = 'extraordinaria' and project_id is not null;

create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete restrict,
  paid_at timestamptz not null default now(),
  amount_cents integer not null check (amount_cents > 0),
  method text,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_allocations (
  id uuid primary key default uuid_generate_v4(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  charge_id uuid not null references public.charges(id) on delete restrict,
  applied_cents integer not null check (applied_cents > 0),
  created_at timestamptz not null default now(),
  unique(payment_id, charge_id)
);

create table if not exists public.receipts (
  id uuid primary key default uuid_generate_v4(),
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  payment_id uuid not null unique references public.payments(id) on delete cascade,
  receipt_year integer not null,
  receipt_seq integer not null,
  pdf_path text not null,
  gmail_message_id text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (condominium_id, receipt_year, receipt_seq)
);

-- 3) Expenses
create table if not exists public.expense_categories (
  id uuid primary key default uuid_generate_v4(),
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (condominium_id, name)
);

create table if not exists public.expenses (
  id uuid primary key default uuid_generate_v4(),
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  category_id uuid not null references public.expense_categories(id) on delete restrict,
  occurred_on date not null,
  amount_cents integer not null check (amount_cents > 0),
  vendor text,
  note text,
  attachment_path text,
  created_at timestamptz not null default now()
);

-- 4) RLS helpers + policies
alter table public.units enable row level security;
alter table public.residents enable row level security;
alter table public.profiles enable row level security;
alter table public.charge_projects enable row level security;
alter table public.charges enable row level security;
alter table public.payments enable row level security;
alter table public.payment_allocations enable row level security;
alter table public.receipts enable row level security;
alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;

-- SECURITY DEFINER + search_path evita recursão RLS quando policies chamam estas funções
-- (PostgreSQL volta a aplicar políticas ao ler profiles → "stack depth limit exceeded").
create or replace function public.current_profile_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where user_id = auth.uid()
$$;

create or replace function public.current_profile_unit_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select unit_id
  from public.profiles
  where user_id = auth.uid()
$$;

-- Admin: full access within condominium. Resident: read only for their unit.
create policy "profiles_self_read" on public.profiles
  for select
  using (user_id = auth.uid());

create policy "profiles_admin_write" on public.profiles
  for all
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

create policy "units_admin_all" on public.units
  for all
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

create policy "units_resident_read_own" on public.units
  for select
  using (id = public.current_profile_unit_id());

create policy "residents_admin_all" on public.residents
  for all
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

create policy "residents_resident_read_own_unit" on public.residents
  for select
  using (unit_id = public.current_profile_unit_id());

create policy "charges_admin_all" on public.charges
  for all
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

create policy "charges_resident_read_own" on public.charges
  for select
  using (unit_id = public.current_profile_unit_id());

create policy "payments_admin_all" on public.payments
  for all
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

create policy "payments_resident_read_own" on public.payments
  for select
  using (unit_id = public.current_profile_unit_id());

create policy "alloc_admin_all" on public.payment_allocations
  for all
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

create policy "alloc_resident_read_own" on public.payment_allocations
  for select
  using (
    exists (
      select 1
      from public.charges c
      where c.id = charge_id and c.unit_id = public.current_profile_unit_id()
    )
  );

create policy "receipts_admin_all" on public.receipts
  for all
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

create policy "receipts_resident_read_own" on public.receipts
  for select
  using (
    exists (
      select 1
      from public.payments p
      where p.id = payment_id and p.unit_id = public.current_profile_unit_id()
    )
  );

create policy "expense_categories_admin_all" on public.expense_categories
  for all
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

create policy "expenses_admin_all" on public.expenses
  for all
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

drop policy if exists "charge_projects_admin_all" on public.charge_projects;
create policy "charge_projects_admin_all" on public.charge_projects
  for all
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

