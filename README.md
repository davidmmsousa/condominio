# condominio-app

Plataforma de gestão de condomínio (MVP):

- Admin: frações, permilagens, moradores/contactos, quotas, extraordinárias, pagamentos, recibos PDF e email.
- Morador: portal read-only com extrato e recibos.

## Stack

- Next.js (App Router) + TypeScript
- Supabase (Postgres + Auth + Storage) com RLS
- Gmail API (OAuth) para enviar recibos como `ruavincennescondominio@gmail.com`

## Notas importantes (ambiente)

Neste workspace, a criação automática de ficheiros `.json` (ex.: `package.json`, `tsconfig.json`) pode falhar. Se isso acontecer, cria esses ficheiros manualmente seguindo os templates indicados em `docs/templates/` (ver abaixo).

