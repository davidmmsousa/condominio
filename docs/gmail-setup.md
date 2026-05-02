## Gmail API (enviar recibos como `ruavincennescondominio@gmail.com`)

Este MVP usa Gmail API com OAuth (refresh token) para enviar emails com PDF.

### 1) Criar projeto no Google Cloud

- Criar projeto no Google Cloud Console
- Ativar **Gmail API**
- Em **APIs & Services → OAuth consent screen**: configurar como *External* (ou o que se aplicar) e preencher o mínimo
- Em **Credentials** criar **OAuth Client ID** do tipo **Web application**

### 2) Obter refresh token

De forma simples (MVP), usa um fluxo OAuth local (script) que peça consentimento à conta do condomínio e guarde:

- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REFRESH_TOKEN`
- `GMAIL_SENDER=ruavincennescondominio@gmail.com`

Escopo mínimo recomendado: `https://www.googleapis.com/auth/gmail.send`

### 3) Colocar variáveis no deploy (Vercel)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (apenas server-side)
- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REFRESH_TOKEN`
- `GMAIL_SENDER`

### 4) Teste

Quando o endpoint de envio estiver ligado, faz um teste enviando para um email teu e confirma:

- chega à inbox (ou Spam)
- PDF abre corretamente

