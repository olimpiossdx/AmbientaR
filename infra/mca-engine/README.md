# MCA Engine (Python)

API auxiliar do Motor Cartográfico Automatizado. A orquestração principal corre em **TypeScript** (`src/lib/mca/`); este serviço expõe health, validação de registry e endpoints para futuro PyQGIS.

## Local

```bash
cd infra/mca-engine
pip install -r requirements.txt
uvicorn main:app --reload --port 8090
```

Variáveis: `MCA_DEBUG=1`, `WORKER_SHARED_SECRET` (opcional, mesmo da app).

## Endpoints

- `GET /health`
- `GET /v1/registry`
- `POST /v1/dag/resolve` — body `{ "agentIds": ["MCA_Uso_Pivo", ...] }`
- `GET /v1/debug/etapa/{n}` — checklist etapa 1–15
