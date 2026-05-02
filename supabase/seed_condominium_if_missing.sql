-- Se aparecer RLS ou "stack depth" ao criar condomínio pela app:
-- corre supabase/patch_condominiums_bootstrap_insert.sql (função RPC no Supabase).
--
-- Se ainda precisares de garantir uma linha (como postgres / sem RLS):
-- corre isto uma vez no Supabase SQL Editor (idempotente).
insert into public.condominiums (name)
select 'Condomínio'
where not exists (select 1 from public.condominiums limit 1);
