# Tutorial: email Gmail para enviar recibos automaticamente

A app envia o **PDF do recibo** por email quando registas um **pagamento** em Admin → Pagamentos, desde que:

1. A conta **Gmail do condomínio** (ex.: `ruavincennescondominio@gmail.com`) esteja ligada à **Google Cloud / Gmail API**.
2. As **variáveis de ambiente** na Vercel (ou `.env.local` em desenvolvimento) estejam preenchidas.
3. O **morador** da fração tenha **email** na ficha (Admin → Moradores).

---

## Parte A — Google Cloud e credenciais OAuth

### A1. Criar (ou escolher) um projeto

1. Abre [Google Cloud Console](https://console.cloud.google.com/).
2. No topo, ao lado do nome do projeto, clica e **Cria um projeto** (ou escolhe um existente).
3. Dá um nome reconhecível, por exemplo `Condominio-recibos`.

### A2. Ativar a Gmail API

1. Menu **APIs e serviços** → **Biblioteca** (ou “APIs & Services” → “Library”).
2. Pesquisa **Gmail API**.
3. Abre **Gmail API** e clica **Ativar** (Enable).

### A3. Ecrã de consentimento OAuth (obrigatório)

1. **APIs e serviços** → **Ecrã de consentimento OAuth** (“OAuth consent screen”).
2. Tipo de utilizador: em muitos casos **Externo** (External) — continua.
3. Preenche o mínimo obrigatório:
   - **Nome da aplicação** (ex.: `Gestão condomínio`).
   - **Email de suporte do utilizador** (o teu ou o do condomínio).
   - **Email de contacto do programador** (o teu).
4. **Domínios autorizados** — podes deixar vazio no início (MVP).
5. **Âmbitos (Scopes)** — no passo de scopes, adiciona manualmente (ou no passo seguinte ao criar credenciais):
   - `https://www.googleapis.com/auth/gmail.send`  
   (permite só **enviar** email, não ler a caixa.)
6. Guarda e, se pedir **Test users**, adiciona o email **exacto** da conta Gmail que vai enviar (ex.: `ruavincennescondominio@gmail.com`). Enquanto a app estiver em modo “Testing”, só esses utilizadores podem autorizar.

### A4. Criar o Client ID (Web)

1. **APIs e serviços** → **Credenciais** → **Criar credenciais** → **ID do cliente OAuth**.
2. Tipo de aplicação: **Aplicação Web**.
3. Nome: ex. `Condominio web client`.
4. **URIs de redireccionamento autorizados** — adiciona **exactamente**:
   - `https://developers.google.com/oauthplayground/oauth2callback`  
   (vamos usar o *OAuth 2.0 Playground* da Google para obter o *refresh token* sem programar.)
5. **Criar** e anota:
   - **ID do cliente** → será o `GMAIL_CLIENT_ID`
   - **Segredo do cliente** → será o `GMAIL_CLIENT_SECRET`

---

## Parte B — Obter o *refresh token* (OAuth Playground)

### B1. Abrir o Playground com as tuas credenciais

1. Abre [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/).
2. Canto superior direito: ícone **engrenagem** (⚙️) → **OAuth 2.0 configuration**.
3. Marca **Use your own OAuth credentials**.
4. Cola o **OAuth Client ID** e o **OAuth Client secret** que criaste no passo A4.
5. Fecha a janela da engrenagem.

### B2. Escolher o scope e autorizar

1. Na lista da esquerda, em **Gmail API v1**, marca:
   - `https://www.googleapis.com/auth/gmail.send`
2. Clica **Authorize APIs**.
3. Faz login com a conta **Gmail do condomínio** (a mesma que vai aparecer como remetente).
4. Aceita as permissões.

### B3. Trocar o código por tokens

1. Clica **Exchange authorization code for tokens**.
2. Aparece JSON com `access_token` e **`refresh_token`**.
3. **Copia o `refresh_token`** e guarda-o em local seguro — é o valor da variável `GMAIL_REFRESH_TOKEN` na Vercel.  
   - Se não aparecer *refresh token*, revoga acesso em [Google Account permissions](https://myaccount.google.com/permissions) para a app “OAuth 2.0 Playground” e repete B2–B3.

---

## Parte C — Variáveis na Vercel (produção)

1. Abre o projeto na [Vercel](https://vercel.com/) → **Settings** → **Environment Variables**.
2. Adiciona **uma a uma** (ambiente **Production**; opcionalmente **Preview**):

| Nome | Valor | Notas |
|------|--------|--------|
| `GMAIL_CLIENT_ID` | o ID do cliente OAuth | |
| `GMAIL_CLIENT_SECRET` | o segredo do cliente | Sensível |
| `GMAIL_REFRESH_TOKEN` | o token do passo B3 | Sensível |
| `GMAIL_SENDER` | `ruavincennescondominio@gmail.com` | Tem de ser **exactamente** a conta que autorizaste no Playground |

3. **Guarda** cada variável.
4. Vai a **Deployments** → nos **três pontinhos** do último deploy → **Redeploy** (para a nova env entrar em efeito).

Em **desenvolvimento local**, podes colar as mesmas chaves no ficheiro `.env.local` (não commits este ficheiro).

---

## Parte D — Email do morador na app (para onde vai o recibo)

O recibo é enviado para o **email do primeiro morador activo** da fração.

1. Entra na app como **admin**.
2. Vai a **Admin → Moradores**.
3. Para cada fração, edita ou cria o morador e preenche o campo **Email** com o endereço real (ex.: Gmail do condómino).
4. Guarda.

Se não houver email, o pagamento **regista-se na mesma**, mas aparece aviso de que o recibo **não** foi enviado por email — o PDF continua disponível em **Pagamentos** (link PDF).

---

## Parte E — Testar o fluxo completo

1. Confirma que a Vercel fez **redeploy** após as variáveis Gmail.
2. Garante **morador com email** na fração onde vais testar.
3. **Admin → Pagamentos** → regista um pagamento de teste (valor pequeno).
4. Mensagem de sucesso deve incluir algo como **“Recibo enviado por email (Gmail).”**
5. Verifica a **caixa de entrada** (e **Spam**) do email do morador; o anexo deve ser o PDF do recibo.

### Teste só de email (opcional)

Existe o endpoint `POST /api/admin/send-test-email` (uso interno / admin) para enviar um PDF de exemplo — útil se quiseres validar Gmail antes dos pagamentos.

---

## Desligar o envio automático (opcional)

Define na Vercel:

- `RECEIPT_AUTOSEND_EMAIL` = `false`

O PDF do recibo continua a poder ser descarregado na lista de pagamentos.

---

## Problemas frequentes

| Sintoma | O que verificar |
|---------|------------------|
| “Missing Gmail OAuth env vars” | Falta alguma das 4 variáveis `GMAIL_*` ou `GMAIL_SENDER` na Vercel; faz redeploy. |
| “Failed to refresh Gmail token” | `GMAIL_REFRESH_TOKEN` errado ou revogado; repete a Parte B. |
| “Failed to send Gmail message” 403 / access denied | Conta não está na lista de **Test users** (modo Testing) ou a app não foi publicada; volta ao ecrã de consentimento OAuth. |
| Email não chega | Spam; confirma `GMAIL_SENDER` = conta que autorizaste; confirma `residents.email` na app. |
| “Recibo não enviado por email: morador sem email” | Preenche email em **Moradores** para essa fração. |

---

## Resumo rápido (checklist)

- [ ] Gmail API ativada no Google Cloud  
- [ ] OAuth consent screen + scope `gmail.send`  
- [ ] OAuth Client (Web) com redirect do Playground  
- [ ] Refresh token obtido no OAuth Playground  
- [ ] `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_SENDER` na Vercel  
- [ ] **Redeploy** na Vercel  
- [ ] Email do morador em **Admin → Moradores**  
- [ ] Teste com um pagamento  
