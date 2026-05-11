-- IBAN de pagamentos (portal morador). Executar no SQL Editor do Supabase.
alter table public.condominiums
  add column if not exists payment_iban text;

update public.condominiums
set payment_iban = 'PT50003600219910006353214'
where payment_iban is null or trim(payment_iban) = '';

drop policy if exists "condominiums_resident_read_portal" on public.condominiums;
create policy "condominiums_resident_read_portal" on public.condominiums
  for select
  using (
    id = (
      select condominium_id
      from public.profiles
      where user_id = auth.uid() and role = 'resident'
    )
  );
