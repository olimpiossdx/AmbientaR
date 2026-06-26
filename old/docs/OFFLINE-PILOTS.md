# Piloto — integração mínima offline / resiliência (Trilho C)

## Objetivo

Ligar a camada existente (`src/lib/offline/`, `fetchApiWithRetry`) a **poucos pontos** sem refatorar o monólito de formulários.

## O que foi ligado

| Área | Ficheiro | Comportamento |
|------|----------|----------------|
| Lista TR via API | [`src/components/termos-referencia-card.tsx`](../src/components/termos-referencia-card.tsx) | `fetchApiWithRetry` na chamada a `/api/termos-referencia/list` |
| Análise geoespacial | [`src/components/licensing/licensing-locational-block.tsx`](../src/components/licensing/licensing-locational-block.tsx) | Bloqueio explícito offline + `fetchApiWithRetry` no POST `/api/geospatial/analyze` |
| Propostas comerciais | [`src/app/(app)/commercial-proposals/proposal-form.tsx`](../src/app/(app)/commercial-proposals/proposal-form.tsx) | Toast informativo quando offline (Firestore SDK continua a persistir escritas) |
| Upload PDF fauna (Storage) | [`src/app/(app)/fauna/fauna-upload-form.tsx`](../src/app/(app)/fauna/fauna-upload-form.tsx) | Bloqueio offline no upload (Storage exige rede); `addDoc` continua a beneficiar do cache Firestore quando aplicável |
| Indicador global | [`src/components/offline-queue-badge.tsx`](../src/components/offline-queue-badge.tsx) + [`src/app/(app)/layout.tsx`](../src/app/(app)/layout.tsx) | Badge “Offline” / “Pendente n” com base em `useOffline()` |

## Próximos candidatos (não feitos neste trilho)

- Substituir mais `fetch('/api/...')` por `fetchApiWithRetry` (ver grep em `src/`).
- Integrar `enqueueStorageUpload` em fluxos com ficheiro grande **com** modelo de dados que guarde `pendingPath` até sync (requer desenho de schema).
- Usar `enqueueOutboxOperation` para **replays idempotentes** de APIs específicas (avaliar risco por rota).
