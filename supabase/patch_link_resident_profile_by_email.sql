-- Liga profiles.unit_id ao morador quando existe conta Auth com o mesmo email.
-- Executar no SQL Editor do Supabase. Requer SUPABASE_SERVICE_ROLE_KEY na app
-- para o servidor chamar esta função via RPC.

create or replace function public.link_resident_profile_by_email(
  p_email text,
  p_unit_id uuid,
  p_condominium_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  n int;
begin
  if p_email is null or length(trim(p_email)) = 0 then
    return false;
  end if;

  select id into v_user_id
  from auth.users
  where lower(email) = lower(trim(p_email))
  limit 1;

  if v_user_id is null then
    return false;
  end if;

  update public.profiles
  set
    unit_id = p_unit_id,
    condominium_id = p_condominium_id
  where user_id = v_user_id
    and role = 'resident'::public.user_role;

  get diagnostics n = row_count;
  return n > 0;
end;
$$;

revoke all on function public.link_resident_profile_by_email(text, uuid, uuid) from public;
grant execute on function public.link_resident_profile_by_email(text, uuid, uuid) to service_role;
