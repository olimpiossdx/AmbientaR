# Contrato de plataforma (rotina nova)

Rotina **separada** dos contratos comerciais em `/contracts` (consultoria, propostas, fornecedores).

## Coleções Firestore

| Coleção | Função |
|---------|--------|
| `platform_subscription_acceptances` | Cópia imutável do aceite (HTML + metadados + IP/dispositivo) |
| `platform_subscription_ledger` | Espelho financeiro (status **Aprovado**) para caixa e banco |

Campos em `users/{uid}`: `platformSubscriptionAcceptanceId`, `platformSubscriptionLedgerId`.

## Regras de negócio (decisões 2026-05)

1. **Vigência:** início na **assinatura**; **acesso** após confirmação de pagamento.
2. **Parcelamento:** 12× mensal **sem juros** ou à vista.
3. **Rescisão:** continua a cobrança até o fim do período; **sem multa adicional** além do saldo devido.
4. **Gratuito:** mantém regras atuais do cadastro (`gratuito_legacy`).
5. **Financeiro:** registro sempre **Aprovado** no ledger.
6. **Prova:** dados de cadastro + pagamento (sem CVV); IP e equipamento (User-Agent) quando disponível.

## API

- `POST /api/platform-subscription-contract/record` — Bearer do titular (após cadastro).
- `GET /api/platform-subscription-contract/{id}` — titular ou admin/financeiro/supervisor.
- `DELETE /api/platform-subscription-contract/{id}` — **somente admin**.

## UI

- **Cadastro:** chama a API após criar `users/{uid}` (não altera `contract-content.tsx` do aceite na tela).
- **Configurações → Usuários:** ícone com tooltip → dialog com cópia HTML.
- **Financeiro → Contratos Plataforma:** `/financial/platform-subscription-contracts`

## Código

- `src/lib/platform-subscription-contract/`
- `src/components/platform-subscription-contract/acceptance-viewer.tsx`

## Deploy

Publicar regras: `npm run deploy:rules`
