# MVP offline-first — âmbito e bloqueadores

Este documento fecha a **Fase 0** do plano “restaurante na mala”: o que entra no primeiro corte, o que fica online-only, e quais rotas `/api/*` o cliente chama (para substituir por Firestore direto, fila local, ou aceitar “só com rede”).

## 1. Objetivo do MVP

**In:** utilizadores **portal cliente** (`client`, `cliente_autonomo`, `representative`) conseguem, após **login com rede** pelo menos uma vez:

- Ver e editar **dados já sincronizados** no dispositivo (Firestore cache + camada local em evolução).
- **Enfileirar** escritas e uploads quando a rede falhar; **enviar** quando voltar (via motor `src/lib/offline/`).

**Out (online-only no MVP):**

- **IA** (`/api/ai-lab/*`, `/api/ai/*`, `/api/geospatial/analyze`).
- **Geração DOCX / notificações** que passam pelo servidor Next (`/api/laudos/*`, `/api/canais/*`).
- **Primeira instalação sem rede nunca** — exige PWA com shell em cache ou bootstrap no Capacitor; ver [OFFLINE-PWA-SHELL.md](./OFFLINE-PWA-SHELL.md).

## 2. Primeira abertura “sem internet”

| Cenário | Estado com o stack atual + PWA ativado em produção |
|--------|------------------------------------------------------|
| Já visitou o site com rede (PWA instalou cache) | Páginas em cache podem abrir; dados Firestore já lidos podem aparecer. |
| App Capacitor só com `server.url`, sem PWA/cache | **Sem rede = ecrã em branco** até haver casca local. |

**Decisão MVP:** aceitar **login + primeira carga com rede**; iterar para “cold start offline” com precache do shell (Fase 2).

## 3. SLA de conflito (rascunho)

- **Rascunhos / inventário / parcelas:** última escrita vence (`updatedAt` / servidor).
- **Contratos / propostas com valores firmes:** preferir **bloquear edição offline** ou “cópia local + revisão na reconciliação” — definir com negócio antes de ativar write offline nesses módulos.

## 4. Inventário de chamadas `fetch` a `/api/*` no frontend

Estas dependem do **Node** em `www.ambientar.ia.br` e **não** funcionam offline sem fila ou redesign:

| Rota | Ficheiro(s) aproximado(s) | Uso |
|------|---------------------------|-----|
| `POST /api/geospatial/analyze` | `src/components/licensing/licensing-locational-block.tsx` | Análise geoespacial (IA/servidor) |
| `POST /api/canais/notificar-laudo-pronto` | `src/app/(app)/laudos/[id]/page.tsx` | Notificação canal |
| `POST /api/laudos/gerar-docx` | `src/app/(app)/laudos/[id]/page.tsx` | Geração DOCX |
| `POST /api/ai-lab/import-reference-files` | `empreendedor-form`, `client-form`, `settings/ai-local-source`, `ai-lab/rag` | Upload refs para IA |
| `POST /api/ai-lab/autofill-empreendedor` | `empreendedor-form`, `client-form` | Autofill IA |
| `POST /api/ai-lab/generate-report` | `ai-lab/automations/page.tsx` | Relatório IA |
| `GET /api/termos-referencia/list` | `src/components/termos-referencia-card.tsx` | Lista termos por estudo |
| `POST /api/ai/preencher-relatorio` | `studies/rca/page.tsx` | Preencher relatório IA |
| `POST /api/uploads/licenses` | `licenses/license-form-SERVIDOR.tsx` | Upload licenças (exemplo servidor) |

**Rotas `src/app/api/uploads/*` existentes** (muitas usadas por formulários via padrões sem `fetch` direto neste grep — rever por módulo ao ativar fila de Storage):

- `branding`, `car-geometry`, `car-pdf`, `compliance`, `fauna`, `intervencoes`, `invoices`, `licenses`, `outorgas`, `proposals`, `signed-contracts`, `transactions`, `usos-insignificantes`, etc.

**Estratégia:** uploads devem migrar para **Firebase Storage SDK no cliente** + metadados no Firestore + fila em `src/lib/offline/storage-queue.ts` (ver [OFFLINE-STORAGE-QUEUE.md](./OFFLINE-STORAGE-QUEUE.md)).

## 5. Coleções Firestore prioritárias para manifesto (portal cliente)

Alinhado a filtros já existentes (`clientIdsForUser`, CPF/CNPJ, `approvedUserIds`):

- `users/{uid}`, `clients`, `empreendedores`, `projects` (ou equivalentes usados nas páginas de cliente), `commercialProposals`, `contracts`, `invoices`, `access_requests`, notificações em `users/{uid}/notifications`, `inventoryProjectPhotos` / inventário conforme [APP-OFFLINE-FASE5.md](./APP-OFFLINE-FASE5.md).

Implementação incremental do **manifesto** em `src/lib/offline/manifest.ts`.

## 6. Próximo passo técnico

Motor local em [`src/lib/offline/`](../src/lib/offline/), PWA em [OFFLINE-PWA-SHELL.md](./OFFLINE-PWA-SHELL.md), fila Storage em [OFFLINE-STORAGE-QUEUE.md](./OFFLINE-STORAGE-QUEUE.md), rollout em [OFFLINE-ROLLOUT.md](./OFFLINE-ROLLOUT.md), critérios nativos em [OFFLINE-NATIVE-CRITERIA.md](./OFFLINE-NATIVE-CRITERIA.md).
