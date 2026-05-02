-- Corrige "stack depth limit exceeded" no login (SELECT em profiles com policies que chamam estas funções).
-- Executar uma vez no Supabase SQL Editor.

create or replace function public.current_profile_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where user_id = auth.uid()
$$;

create or replace function public.current_profile_unit_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select unit_id
  from public.profiles
  where user_id = auth.uid()
$$;
