# Fiscal Satellite Worker (Fase 1)

Worker Cloud Run para o **Fiscal Ambiental Digital**: lê cena STAC INPE, grava preview (e GeoTIFF quando existir asset COG) no Firebase Storage.

## Endpoints

- `GET /health`
- `POST /v1/mosaic/assemble` — header `X-Worker-Secret`

## Variáveis

- `WORKER_SHARED_SECRET`
- `FIREBASE_STORAGE_BUCKET`
- `INPE_STAC_URL` (opcional)

## App Next.js

```env
FISCAL_SATELLITE_WORKER_URL=https://....run.app
WORKER_SHARED_SECRET=...
```

Sem worker configurado, a API Next usa **modo inline** (descarrega assets STAC directamente).

## Deploy (resumo)

```bash
cd infra/fiscal-satellite-worker
gcloud run deploy ambientar-fiscal-satellite --source . --region southamerica-east1
```
