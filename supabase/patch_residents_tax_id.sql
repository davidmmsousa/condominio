-- N.º de contribuinte (NIF) opcional na ficha do morador (recibos).
alter table public.residents
  add column if not exists tax_id text;
