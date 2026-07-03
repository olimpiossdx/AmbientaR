# Assinatura da plataforma — PIX dinâmico (Sicoob)

Integração para gerar **QR PIX por cobrança** (valor fixo + `txid` único), confirmar pagamento via webhook e liberar/revogar acesso.

**Guia completo para retomar o trabalho:** [PIX-SICOOB-RETOMAR.md](PIX-SICOOB-RETOMAR.md) (checklist Sicoob, testes, mapa de arquivos, troubleshooting).

## Fases implementadas

| Fase | Módulo / rota | Debugger |
|------|----------------|----------|
| 1 | `src/lib/billing/sync-platform-access.ts` | `POST /api/billing/debug` `{ "phase": 1 }` |
| 2 | `src/lib/sicoob-pix/*` | `{ "phase": 2 }` — config + OAuth |
| 3 | `POST /api/billing/create-charge` | `{ "phase": 3, "packageId": "basico" }` |
| 4 | `POST /api/webhooks/sicoob` (+ `/pix`) | `{ "phase": 4, "txid": "..." }` |
| 5 | `DynamicPixCheckout` no `/register` | `{ "phase": 5 }` |
| 6 | `POST /api/cron/subscription-lapse` | `{ "phase": 6, "dryRun": true }` |

**UI debugger:** Financeiro → `/financial/billing-debug` (admin/financeiro/supervisor).

**CLI exemplo (admin logado ou secret):**

```bash
curl -s http://localhost:9002/api/billing/debug \
  -H "x-billing-debug-secret: SEU_SECRET"

curl -s -X POST http://localhost:9002/api/billing/debug \
  -H "Content-Type: application/json" \
  -H "x-billing-debug-secret: SEU_SECRET" \
  -d '{"phase":2}'
```

## Variáveis (`.env.local`)

```env
SICOOB_MOCK_MODE=true
SICOOB_CLIENT_ID=...
SICOOB_PIX_KEY=sua-chave-pix
SICOOB_ENVIRONMENT=sandbox
SICOOB_CERT_PEM=...
SICOOB_CERT_KEY=...
SICOOB_WEBHOOK_ACCESS_TOKEN=token_longo
BILLING_DEBUG_SECRET=dev-debug
CRON_SECRET=dev-cron
```

Sem credenciais Sicoob, `SICOOB_MOCK_MODE=true` (padrão em dev se `SICOOB_CLIENT_ID` vazio) gera cobranças simuladas. Use **Simular pagamento** na tela ou `POST /api/billing/mock-confirm`.

## Portal Developers Sicoob (produção)

1. Produto **Pix Recebimentos**, escopos `cob.*`, `pix.read`, `webhook.*`
2. Certificado e-CNPJ A1 (mTLS)
3. Webhook: `https://<dominio>/api/webhooks/sicoob` (banco pode chamar `.../sicoob/pix`)

## Fluxo cadastro

1. Titular conclui cadastro com plano pago + PIX
2. `create-charge` grava `platform_payment_requests` + QR dinâmico
3. `DynamicPixCheckout` faz polling em `charge-status`
4. Webhook Sicoob (ou mock) → `sync-platform-access` → `platformPaymentStatus: paid`

## Admin

- `GET/POST /api/admin/platform-payment-requests` — fila e confirmação manual
- `npm run deploy:rules` após alterações em `platform_billing_events`

## Cron

Agendar `POST /api/cron/subscription-lapse` com header `x-cron-secret` diariamente.
