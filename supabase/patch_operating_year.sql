-- Executar uma vez no SQL Editor (bases já criadas antes desta coluna).
alter table public.condominiums
  add column if not exists operating_year integer;

update public.condominiums
set operating_year = (extract(year from timezone('Europe/Lisbon'::text, now())))::integer
where operating_year is null;

alter table public.condominiums
  alter column operating_year set not null;

alter table public.condominiums enable row level security;

drop policy if exists "condominiums_admin_all" on public.condominiums;
create policy "condominiums_admin_all" on public.condominiums
  for all
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');
