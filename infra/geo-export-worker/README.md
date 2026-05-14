# Worker de exportação geográfica (B0–B1)

Imagem Docker com **GDAL** (`ogr2ogr`) e **FastAPI**, pensada para **Google Cloud Run** no mesmo projeto que o Firebase (GCS + ADC).

## O que faz

- `POST /v1/export` — lê `input.geojson` no GCS, gera **ZIP (Shapefile)**, **DXF**, **GPKG** (reprojetáveis via `target_crs`, por omissão `EPSG:31983`).
- Opcional: `fetch_osm: true` — consulta **Overpass**, recorta vias/edificações/hidrografia ao polígono e publica `osm_context.geojson` junto dos outros artefactos.
- `GET /health` — readiness.

## Segurança

Defina `WORKER_SHARED_SECRET` no Cloud Run e a mesma variável na app Next (`WORKER_SHARED_SECRET`). O cliente envia o header `X-Worker-Secret`.  
(Numa fase posterior pode trocar-se por verificação **OIDC** invoker → Cloud Run.)

## Build local

```bash
cd infra/geo-export-worker
docker build -t ambientar-geo-export:local .
docker run --rm -p 8080:8080 \
  -e PORT=8080 \
  -e WORKER_SHARED_SECRET=teste-local \
  -e GOOGLE_APPLICATION_CREDENTIALS=/keys/sa.json \
  -v C:/caminho/sa.json:/keys/sa.json:ro \
  ambientar-geo-export:local
```

`curl http://localhost:8080/health`

## Deploy Cloud Run (resumo)

1. Criar segredo `WORKER_SHARED_SECRET` (Secret Manager ou env direto).
2. `gcloud run deploy ambientar-geo-export --source . --region southamerica-east1 --allow-unauthenticated` **ou** autenticado + invoker IAM (recomendado em produção).
3. Conta de serviço da revisão: `roles/storage.objectAdmin` no bucket do Firebase (ou prefixo `study_maps_exports/` com condição IAM).
4. Definir na app Next: `GEO_EXPORT_WORKER_URL=https://....run.app` e o mesmo `WORKER_SHARED_SECRET`.

## Variáveis na app Next (`.env.local`)

| Variável | Obrigatório para export | Descrição |
|----------|-------------------------|-----------|
| `GEO_EXPORT_WORKER_URL` | sim | URL base da Cloud Run (ex. `https://ambientar-geo-export-xxxxx-sa.run.app`). |
| `WORKER_SHARED_SECRET` | sim | Mesmo valor configurado no worker (`X-Worker-Secret`). |
| `GOOGLE_APPLICATION_CREDENTIALS` | dev local | JSON de conta de serviço com Firestore + Storage (para `firebase-admin` verificar tokens e assinar URLs). No App Hosting GCP costuma usar ADC automático. |

## Variáveis de ambiente

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `PORT` | não | Porta HTTP (Cloud Run injeta 8080). |
| `WORKER_SHARED_SECRET` | sim | Mesmo valor que a API Next. |

Credenciais GCS: **ADC** na Cloud Run (metadata) ou `GOOGLE_APPLICATION_CREDENTIALS` em local.
