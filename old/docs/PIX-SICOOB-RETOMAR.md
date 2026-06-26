# PIX Sicoob — guia para retomar a integração

Documento de referência para continuar o trabalho de **assinatura da plataforma** com **PIX dinâmico** (QR por cobrança), integração **API Pix Sicoob**, liberação automática de acesso e expiração por falta de renovação.

**Última atualização:** junho/2026  
**Decisão de produto:** API Pix Sicoob direta (dinheiro na conta cooperativa); QR estático descartado como fluxo principal.

---

## Índice

1. [O que já está pronto](#1-o-que-já-está-pronto)
2. [O que falta fazer](#2-o-que-falta-fazer)
3. [Cadastro no Portal Developers Sicoob](#3-cadastro-no-portal-developers-sicoob)
4. [Variáveis de ambiente](#4-variáveis-de-ambiente)
5. [Testar sem Sicoob (mock)](#5-testar-sem-sicoob-mock)
6. [Testar com Sicoob (homologação)](#6-testar-com-sicoob-homologação)
7. [Debugger por fase](#7-debugger-por-fase)
8. [Fluxos de negócio](#8-fluxos-de-negócio)
9. [Mapa de arquivos](#9-mapa-de-arquivos)
10. [Firestore e regras](#10-firestore-e-regras)
11. [Deploy e produção](#11-deploy-e-produção)
12. [Problemas comuns](#12-problemas-comuns)

---

## 1. O que já está pronto

### Decisões confirmadas

| Tema | Decisão |
|------|---------|
| Escopo | Assinatura anual **Cliente Autônomo** (planos pagos no `/register`) |
| Provedor | **API Pix Sicoob** (não Asaas) |
| QR | **Dinâmico** por cobrança (`txid` + valor fixo do plano) |
| QR estático | Apenas fallback legado; não é mais exibido no cadastro |
| Vencimento | Downgrade suave para gratuito + ads (`isSubscriptionLapsed`) |
| Bloqueio total | Só enquanto `platformPaymentStatus: pending_verification` |

### Preços (fonte única)

Arquivo: [`src/lib/package-pricing.ts`](../src/lib/package-pricing.ts)

| Plano | Valor anual |
|-------|-------------|
| básico | R$ 696 |
| intermediário | R$ 1.396 |
| avançado | R$ 1.996 |
| completo | R$ 2.996 |

### Fases implementadas no código

| Fase | O quê | Status |
|------|-------|--------|
| 1 | `sync-platform-access` — confirma/rejeita/expira acesso | ✅ |
| 2 | `src/lib/sicoob-pix/` — mTLS, OAuth, cobrança, webhook parser | ✅ |
| 3 | APIs `create-charge`, `charge-status`, webhooks | ✅ |
| 4 | Debugger `/api/billing/debug` + UI `/financial/billing-debug` | ✅ |
| 5 | `DynamicPixCheckout` no cadastro `/register` | ✅ |
| 6 | Cron `subscription-lapse` + admin `platform-payment-requests` | ✅ |
| 7 | Docs + `.env.example` | ✅ |

### Pendente (próxima sessão)

- [ ] Concluir credenciais no **Portal Developers Sicoob** (homologação)
- [ ] Testar **Fase 2** (OAuth mTLS) com certificado real
- [ ] Registrar **webhook** na URL de produção/App Hosting
- [ ] Integrar `create-charge` no **UpgradeDialog** (troca de plano logado)
- [ ] Agendar **Cloud Scheduler** → `POST /api/cron/subscription-lapse`
- [ ] `npm run deploy:rules` após validar em homologação
- [ ] Cartão / 12× — fora da API Pix Sicoob (fase futura ou outro provedor)

---

## 2. O que falta fazer

Ordem sugerida ao retomar:

```
1. Portal Sicoob → Client ID + certificado A1 em homologação
2. .env.local com credenciais reais + SICOOB_MOCK_MODE=false
3. Debugger Fase 2 → OAuth OK?
4. Debugger Fase 3 → QR real gerado?
5. Cadastro /register com plano pago → pagar PIX teste no sandbox
6. Webhook registrado → confirmação automática sem polling
7. Deploy regras + variáveis no App Hosting
8. Cron diário de expiração
9. UpgradeDialog (opcional mas recomendado)
```

---

## 3. Cadastro no Portal Developers Sicoob

URL: [https://developers.sicoob.com.br/portal/](https://developers.sicoob.com.br/portal/)

### Antes de abrir o portal

- [ ] Certificado **e-CNPJ A1** (`.pfx`) válido
- [ ] Conta cooperativa: agência, conta, **chave PIX** já cadastrada
- [ ] Login do internet banking Sicoob

### Ao criar o aplicativo

- [ ] Nome sugerido: `AmbientaR Assinatura Plataforma`
- [ ] **Integração por empresa parceira?** → **Não**
- [ ] Produto: **Pix Recebimentos** (cobrança imediata)
- [ ] Escopos:
  - `cob.read`, `cob.write`
  - `pix.read`
  - `webhook.read`, `webhook.write`
- [ ] Upload certificado público (`.pem` / `.cer`)

### Guardar com segurança (nunca no Git)

| Item | Uso |
|------|-----|
| **Client ID** | `SICOOB_CLIENT_ID` |
| **Chave PIX** | `SICOOB_PIX_KEY` |
| **Certificado `.pfx` ou par `.pem` + `.key`** | mTLS no servidor |
| Ambiente | `sandbox` primeiro, depois `production` |

### Webhook (após deploy da API)

- URL base: `https://<dominio>/api/webhooks/sicoob`
- O Sicoob pode chamar `.../sicoob/pix` — ambas as rotas existem no código
- Header opcional: `x-sicoob-webhook-token` = `SICOOB_WEBHOOK_ACCESS_TOKEN`

---

## 4. Variáveis de ambiente

Copiar para `.env.local` (ver também [`.env.example`](../.env.example)):

```env
# --- Desenvolvimento sem Sicoob (simulação) ---
SICOOB_MOCK_MODE=true
BILLING_DEBUG_SECRET=dev-debug
CRON_SECRET=dev-cron

# --- Sicoob real (homologação ou produção) ---
# SICOOB_MOCK_MODE=false
# SICOOB_CLIENT_ID=
# SICOOB_PIX_KEY=
# SICOOB_ENVIRONMENT=sandbox
# SICOOB_CERT_PEM=
# SICOOB_CERT_KEY=
# ou caminhos absolutos no Windows:
# SICOOB_CERT_PATH=E:\caminho\cert.pem
# SICOOB_KEY_PATH=E:\caminho\key.key
# SICOOB_WEBHOOK_ACCESS_TOKEN=
# SICOOB_CHARGE_EXPIRATION_SECONDS=86400
```

**Comportamento do mock:** se `SICOOB_CLIENT_ID` estiver vazio e `NODE_ENV !== production`, o sistema entra em mock automaticamente.

**Firebase Admin** (obrigatório para APIs): `GOOGLE_APPLICATION_CREDENTIALS` ou `config/firebase-service-account.json` — ver `AGENTS.md`.

---

## 5. Testar sem Sicoob (mock)

### 5.1 Subir o app

```bash
npm install
npm run dev
```

Abrir: [http://localhost:9002](http://localhost:9002)

### 5.2 Debugger visual

1. Login como **admin**, **financeiro** ou **supervisor**
2. Menu **Financeiro → Debug PIX Assinatura** (`/financial/billing-debug`)
3. Opcional: preencher `BILLING_DEBUG_SECRET` se não for admin
4. Clicar **Carregar status (GET)** e depois **Fase 1** … **Fase 6**

### 5.3 Debugger via API (curl / Postman)

```bash
# Visão geral
curl -s http://localhost:9002/api/billing/debug \
  -H "x-billing-debug-secret: dev-debug"

# Fase 1 — txid e preços
curl -s -X POST http://localhost:9002/api/billing/debug \
  -H "Content-Type: application/json" \
  -H "x-billing-debug-secret: dev-debug" \
  -d "{\"phase\":1}"

# Fase 2 — config Sicoob (mock = OK)
curl -s -X POST http://localhost:9002/api/billing/debug \
  -H "Content-Type: application/json" \
  -H "x-billing-debug-secret: dev-debug" \
  -d "{\"phase\":2}"

# Fase 3 — gerar cobrança mock
curl -s -X POST http://localhost:9002/api/billing/debug \
  -H "Content-Type: application/json" \
  -H "x-billing-debug-secret: dev-debug" \
  -d "{\"phase\":3,\"packageId\":\"basico\"}"

# Fase 6 — listar usuários pagos (dry run)
curl -s -X POST http://localhost:9002/api/billing/debug \
  -H "Content-Type: application/json" \
  -H "x-billing-debug-secret: dev-debug" \
  -d "{\"phase\":6,\"dryRun\":true}"
```

### 5.4 Fluxo completo no cadastro

1. Abrir `/register` → Cliente Autônomo → plano **básico** (ou outro pago)
2. Etapa pagamento: escolher **PIX** e concluir cadastro
3. Tela exibe **QR dinâmico** (`DynamicPixCheckout`)
4. Clicar **Simular pagamento (somente mock/dev)** ou chamar:

```bash
curl -s -X POST http://localhost:9002/api/billing/mock-confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <idToken do usuário>" \
  -d "{\"txid\":\"<txid exibido na tela>\"}"
```

5. Após confirmação: `platformPaymentStatus: paid`, acesso liberado

---

## 6. Testar com Sicoob (homologação)

1. Preencher credenciais reais no `.env.local`
2. `SICOOB_MOCK_MODE=false`
3. Reiniciar `npm run dev`
4. **Fase 2** no debugger → deve retornar `oauth.ok: true` e `tokenPreview`
5. **Fase 3** → `mock: false` e `pixCopiaECola` real
6. Cadastro com plano pago → pagar PIX no app do banco (sandbox)
7. Confirmar via webhook ou polling (`charge-status` a cada 5 s na UI)

### URLs da API Sicoob (referência)

| Ambiente | Base Pix API |
|----------|----------------|
| sandbox | `https://sandbox.sicoob.com.br/sicoob/sandbox/pix/api/v2` |
| production | `https://api.sicoob.com.br/pix/api/v2` |

OAuth: `https://auth.sicoob.com.br/auth/realms/cooperado/protocol/openid-connect/token`

---

## 7. Debugger por fase

| Fase | Body POST `/api/billing/debug` | O que valida |
|------|--------------------------------|--------------|
| 1 | `{"phase":1}` | Geração de `txid`, preço do plano |
| 2 | `{"phase":2}` | Config + OAuth Sicoob |
| 3 | `{"phase":3,"packageId":"basico"}` | Cobrança + QR (mock ou real) |
| 4 | `{"phase":4,"txid":"amb..."}` | Webhook simulado → libera acesso |
| 4 dry | `{"phase":4,"txid":"...","dryRun":true}` | Só mostra payload, não grava |
| 5 | `{"phase":5}` | Confirma componente UI no register |
| 6 | `{"phase":6,"dryRun":true}` | Lista amostra de assinaturas pagas |
| 6 expirar | `{"phase":6,"userId":"uid","dryRun":false}` | Marca `expired` (cuidado) |

**Autenticação do debugger:**

- Header `x-billing-debug-secret` = `BILLING_DEBUG_SECRET`, **ou**
- Bearer token de usuário com role `admin` | `financial` | `supervisor`

---

## 8. Fluxos de negócio

### Liberar acesso (pagamento confirmado)

```
Webhook Sicoob / mock-confirm / admin / polling charge-status
    → markPlatformPaymentConfirmed()
    → users: platformPaymentStatus = "paid"
    → users: platformAccessValidUntil = +12 meses
    → platform_payment_requests: status = "confirmed"
```

### Bloquear antes do pagamento

```
Cadastro plano pago → platformPaymentStatus = "pending_verification"
    → shouldBlockPlatformAccess() = true
    → tela PlatformAccessBlocked
```

### Cancelar / restringir por vencimento

```
platformAccessValidUntil < hoje
    → cron subscription-lapse → platformPaymentStatus = "expired"
    → isSubscriptionLapsed() = true
    → limites do plano gratuito + banner + publicidade
    (login mantido — não bloqueio total)
```

### Valores dos planos

Sempre lidos no **servidor** de [`package-pricing.ts`](../src/lib/package-pricing.ts) — o browser não define o valor da cobrança.

---

## 9. Mapa de arquivos

### Biblioteca billing

| Arquivo | Função |
|---------|--------|
| [`src/lib/billing/sync-platform-access.ts`](../src/lib/billing/sync-platform-access.ts) | Confirma / rejeita / expira acesso |
| [`src/lib/billing/create-charge.ts`](../src/lib/billing/create-charge.ts) | Orquestra cobrança + Firestore |
| [`src/lib/billing/process-webhook.ts`](../src/lib/billing/process-webhook.ts) | Processa POST do Sicoob |
| [`src/lib/billing/txid.ts`](../src/lib/billing/txid.ts) | Gera `txid` único |
| [`src/lib/billing/pricing.ts`](../src/lib/billing/pricing.ts) | Valor BRL do plano |

### Sicoob

| Arquivo | Função |
|---------|--------|
| [`src/lib/sicoob-pix/config.ts`](../src/lib/sicoob-pix/config.ts) | Env e URLs |
| [`src/lib/sicoob-pix/tls.ts`](../src/lib/sicoob-pix/tls.ts) | Certificado mTLS |
| [`src/lib/sicoob-pix/oauth.ts`](../src/lib/sicoob-pix/oauth.ts) | Token OAuth |
| [`src/lib/sicoob-pix/cob.ts`](../src/lib/sicoob-pix/cob.ts) | `PUT /cob/{txid}` |
| [`src/lib/sicoob-pix/diagnostics.ts`](../src/lib/sicoob-pix/diagnostics.ts) | Diagnóstico de config |

### APIs

| Rota | Método | Uso |
|------|--------|-----|
| `/api/billing/create-charge` | POST | Titular autenticado — gera QR |
| `/api/billing/charge-status?txid=` | GET | Polling de pagamento |
| `/api/billing/mock-confirm` | POST | Simular pagamento (mock) |
| `/api/billing/debug` | GET/POST | Debugger por fase |
| `/api/webhooks/sicoob` | POST | Webhook Sicoob |
| `/api/webhooks/sicoob/pix` | POST | Webhook (sufixo `/pix`) |
| `/api/cron/subscription-lapse` | POST | Expira assinaturas vencidas |
| `/api/admin/platform-payment-requests` | GET/POST | Fila admin |

### UI

| Arquivo | Função |
|---------|--------|
| [`src/components/billing/dynamic-pix-checkout.tsx`](../src/components/billing/dynamic-pix-checkout.tsx) | QR + copia-e-cola + polling |
| [`src/app/register/page.tsx`](../src/app/register/page.tsx) | Cadastro → chama create-charge |
| [`src/app/(app)/financial/billing-debug/page.tsx`](../src/app/(app)/financial/billing-debug/page.tsx) | Tela debugger |

### Lógica de acesso existente (não alterar sem motivo)

| Arquivo | Função |
|---------|--------|
| [`src/lib/platform-access.ts`](../src/lib/platform-access.ts) | `shouldBlockPlatformAccess` |
| [`src/lib/package-subscription.ts`](../src/lib/package-subscription.ts) | `isSubscriptionLapsed` |
| [`src/components/platform-access-blocked.tsx`](../src/components/platform-access-blocked.tsx) | Tela bloqueio |
| [`src/components/subscription-expired-banner.tsx`](../src/components/subscription-expired-banner.tsx) | Banner vencimento |

---

## 10. Firestore e regras

### Coleções

| Coleção | Conteúdo |
|---------|----------|
| `users/{uid}` | `platformPaymentStatus`, `platformAccessValidUntil`, … |
| `platform_payment_requests` | Pedido com `txid`, valor, QR, status |
| `platform_billing_events` | Idempotência webhooks + log |

### Campos principais em `users`

```text
platformPaymentStatus: exempt | pending_verification | paid | expired | pending_contract
platformAccessValidUntil: ISO 8601 (+12 meses quando pago)
platformPaymentMethod: pix | credit_card | debit_card
platformPaymentVerifiedAt: timestamp
platformSubscriptionLapsedAt: timestamp (quando expira)
```

### Regras

Arquivo: [`src/firebase/rules/firestore.rules`](../src/firebase/rules/firestore.rules)

- `platform_payment_requests`: create **só Admin SDK** (API); leitura titular ou staff
- `platform_billing_events`: leitura admin/financeiro/supervisor; escrita só servidor

Publicar após mudanças:

```bash
npm run deploy:rules
```

---

## 11. Deploy e produção

### App Hosting / Cloud Run

1. Configurar secrets (mesmas variáveis `SICOOB_*`, `CRON_SECRET`, `BILLING_DEBUG_SECRET`)
2. **Não** usar `SICOOB_MOCK_MODE=true` em produção
3. Registrar webhook no portal Sicoob com URL pública HTTPS
4. `npm run apphosting:check` antes do rollout

### Cron de expiração

Agendar diariamente (ex. Cloud Scheduler):

```http
POST https://<dominio>/api/cron/subscription-lapse
x-cron-secret: <CRON_SECRET>
```

### Confirmação manual (fallback)

Admin autenticado:

```http
GET /api/admin/platform-payment-requests?status=pending_verification
POST /api/admin/platform-payment-requests
{ "requestId": "...", "action": "confirm" }
```

---

## 12. Problemas comuns

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| QR não aparece após cadastro | Firebase Admin sem credencial | Configurar service account; ver `AGENTS.md` |
| Sempre modo mock | `SICOOB_MOCK_MODE=true` ou sem `SICOOB_CLIENT_ID` | Ajustar `.env.local` |
| OAuth Fase 2 falha | Certificado errado/expirado | Renovar e-CNPJ; conferir par `.pem` + `.key` |
| Webhook não chega | URL errada ou sem HTTPS | Registrar no portal; testar `/api/webhooks/sicoob/pix` |
| Pagamento não libera | `txid` não bate com pedido | Ver `platform_payment_requests` no Firestore |
| Acesso bloqueado eternamente | `pending_verification` | Confirmar pagamento ou admin POST confirm |
| Debugger 401 | Sem secret nem role staff | Usar `x-billing-debug-secret` ou login admin |

---

## Documentos relacionados

- [`docs/ASSINATURA-PLATAFORMA-PAGAMENTOS.md`](ASSINATURA-PLATAFORMA-PAGAMENTOS.md) — resumo técnico curto
- [`docs/PACOTES-PORTAL-AUTONOMO.md`](PACOTES-PORTAL-AUTONOMO.md) — planos e limites
- [`docs/firebase-deploy-rules.md`](firebase-deploy-rules.md) — liberação manual legada
- [`docs/PLATFORM-SUBSCRIPTION-CONTRACT.md`](PLATFORM-SUBSCRIPTION-CONTRACT.md) — contrato e ledger
- [`AGENTS.md`](../AGENTS.md) — dev local e Firebase

---

## Comando rápido ao retomar

```text
1. Abrir este arquivo: docs/PIX-SICOOB-RETOMAR.md
2. Verificar checklist Portal Sicoob (secção 3)
3. npm run dev → /financial/billing-debug → Fases 1–3
4. Quando OAuth OK: cadastro /register com plano pago
5. npm run deploy:rules antes de produção
```

Para pedir ao agente Cursor: *"Continue a integração PIX Sicoob seguindo docs/PIX-SICOOB-RETOMAR.md — próximo passo: [credenciais Sicoob / upgrade dialog / produção]."*
