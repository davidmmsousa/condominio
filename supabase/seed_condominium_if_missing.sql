-- Stack depth ao usar admin: corre supabase/patch_profiles_admin_mutate_only.sql
-- Condomínio em falha: corre supabase/patch_condominiums_bootstrap_insert.sql (RPC).
--
-- Se ainda precisares de garantir uma linha (como postgres / sem RLS):
-- corre isto uma vez no Supabase SQL Editor (idempotente).
insert into public.condominiums (name)
select 'Condomínio'
where not exists (select 1 from public.condominiums limit 1);
