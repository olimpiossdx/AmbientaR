# MCA QGIS Worker (v3)

Render **PDF final** a partir de **Layout JSON v2** + layers GeoJSON.

## Modo bridge (actual)

Usa **ReportLab** para validar o pipeline v3 (`/v1/layout/render-pdf`). Em produção, substituir por **PyQGIS** (`QgsLayoutExporter`).

### Docker (recomendado)

```bash
cd infra/mca-qgis-worker
docker compose up --build
```

Ou:

```bash
docker build -t ambientar-mca-qgis-worker .
docker run -p 8091:8091 -e WORKER_SHARED_SECRET=dev-secret ambientar-mca-qgis-worker
```

## Local (uvicorn)

```bash
cd infra/mca-qgis-worker
pip install -r requirements.txt
uvicorn main:app --reload --port 8091
```

Variáveis:

- `WORKER_SHARED_SECRET` — mesmo segredo da app Next.js
- `MCA_QGIS_RENDERER=reportlab-bridge` (default)
- `MCA_PYQGIS=0` até imagem Docker com QGIS

## App Next.js

```env
MCA_QGIS_WORKER_URL=http://localhost:8091
WORKER_SHARED_SECRET=...
```

Endpoint consumido: `POST /api/mca/projects/{id}/export-final`

## Endpoints

- `GET /health`
- `POST /v1/layout/render-pdf` — body `{ layoutJson, layers, projectId?, mapImageDataUrl? }` → PDF
