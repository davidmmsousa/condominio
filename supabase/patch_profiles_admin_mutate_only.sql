-- Corrige "stack depth limit exceeded" em quase todas as queries admin (units, condominiums, …).
-- A política profiles_admin_write estava em FOR ALL + current_profile_role(); no SELECT a
-- ler profiles, o Postgres re-avalia essa política e entra em recursão infinita.
-- Admin continua a poder alterar perfis (insert/update/delete); o SELECT fica só por
-- profiles_self_read (cada um lê a própria linha, ex. user_id = auth.uid()).
--
-- Executar uma vez no Supabase SQL Editor (idempotente).

drop policy if exists "profiles_admin_write" on public.profiles;

create policy "profiles_admin_insert" on public.profiles
  for insert
  with check (public.current_profile_role() = 'admin');

create policy "profiles_admin_update" on public.profiles
  for update
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

create policy "profiles_admin_delete" on public.profiles
  for delete
  using (public.current_profile_role() = 'admin');
