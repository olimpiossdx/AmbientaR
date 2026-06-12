# Fiscal Intelligence Worker (Fase 3)

Detecção de mudanças em previews já arquivadas (perda/ganho de vegetação, solo exposto).

## Endpoints

- `GET /health`
- `POST /v1/change/detect` — header `X-Worker-Secret`

## Variáveis

- `WORKER_SHARED_SECRET`
- `FIREBASE_STORAGE_BUCKET`

## App Next.js

```env
FISCAL_INTELLIGENCE_WORKER_URL=https://....run.app
WORKER_SHARED_SECRET=...
```

Sem worker, a API usa **modo inline** (diff simplificado nas previews).
