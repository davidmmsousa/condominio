-- Executa uma vez no SQL Editor se já aplicaste schema.sql antes desta política existir.
drop policy if exists "charge_projects_admin_all" on public.charge_projects;
create policy "charge_projects_admin_all" on public.charge_projects
  for all
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');
