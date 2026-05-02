-- Corrige "new row violates row-level security policy" ao criar a primeira linha em
-- public.condominiums pela app (condominiums_admin_all + current_profile_role no INSERT).
-- Executa uma vez no Supabase SQL Editor (idempotente).

drop policy if exists "condominiums_bootstrap_insert_when_empty" on public.condominiums;

create policy "condominiums_bootstrap_insert_when_empty" on public.condominiums
  for insert
  to authenticated
  with check (
    (select count(*)::bigint from public.condominiums) = 0
    and exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.role = 'admin'::public.user_role
    )
  );
