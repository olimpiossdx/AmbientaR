# Legislation Pipeline (enterprise RAG)

Worker Python para ingestão de **Legislação Mineira (ALMG)** com destino **PostgreSQL + pgvector**.

## Local

```bash
cd infra/legislation-pipeline
pip install -r requirements.txt
set WORKER_SHARED_SECRET=dev-legislation-secret
uvicorn main:app --reload --port 8092
```

Ou Docker:

```bash
docker compose up --build
```

## App Next.js

```env
LEGISLATION_PIPELINE_ENABLED=true
LEGISLATION_PIPELINE_URL=http://localhost:8092
LEGISLATION_PIPELINE_SECRET=dev-legislation-secret
```

Hub: **Configurações → MCP + RAG → Ingestões** → botão ingestão via pipeline.

API admin: `POST /api/mcp-rag/ingestion/pipeline` body `{ "sourceId": "almg-open-data", "mode": "incremental" }`.

## PostgreSQL

1. Cloud SQL ou Docker `pgvector/pgvector`
2. Aplicar `schema.sql`
3. Definir `DATABASE_URL` no worker (próxima iteração: gravação real em `legal_chunks`)

## ALMG

- API v2: `https://dadosabertos.almg.gov.br/api/v2/*`
- Catálogo CSV Legislação Mineira: documentação em `/documentacao/arquivos/legislacao-mineira`
- Respeitar **1 requisição/segundo** e máximo **2 simultâneas**
