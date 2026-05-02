-- Remove a política que usa (select count(*) from condominiums) no WITH CHECK — causa
-- "stack depth limit exceeded" (RLS + current_profile_role em recursão).
-- Substitui por RPC SECURITY DEFINER (contagem/insert sem entrar nesse ciclo).
-- Executa uma vez no Supabase SQL Editor (idempotente).

drop policy if exists "condominiums_bootstrap_insert_when_empty" on public.condominiums;

create or replace function public.bootstrap_singleton_condominium_if_empty()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
begin
  select c.id into cid
  from public.condominiums c
  order by c.created_at asc
  limit 1;

  if cid is not null then
    return cid;
  end if;

  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'::public.user_role
  ) then
    raise exception 'not allowed';
  end if;

  insert into public.condominiums (name)
  values ('Condomínio')
  returning id into cid;

  return cid;
end;
$$;

revoke all on function public.bootstrap_singleton_condominium_if_empty() from public;
grant execute on function public.bootstrap_singleton_condominium_if_empty() to authenticated;
grant execute on function public.bootstrap_singleton_condominium_if_empty() to service_role;

alter function public.bootstrap_singleton_condominium_if_empty() owner to postgres;
