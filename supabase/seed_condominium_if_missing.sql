-- Se a app falhar por RLS ao criar condomínio, corre primeiro:
--   supabase/patch_condominiums_bootstrap_insert.sql
--
-- Se ainda precisares de garantir uma linha (como postgres / sem RLS):
-- corre isto uma vez no Supabase SQL Editor (idempotente).
insert into public.condominiums (name)
select 'Condomínio'
where not exists (select 1 from public.condominiums limit 1);
