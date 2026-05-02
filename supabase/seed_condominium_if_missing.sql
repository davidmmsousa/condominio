-- Se a app mostrar "Não há condomínio..." ou relatórios falharem sem linhas:
-- corre isto uma vez no Supabase SQL Editor (idempotente).
insert into public.condominiums (name)
select 'Condomínio'
where not exists (select 1 from public.condominiums limit 1);
