# Biblioteca IA — OneDrive (cloud-rag)

Módulo **isolado** do import local (`/api/ai-lab/import-reference-files`). Sincroniza metadados via Microsoft Graph, extrai texto, indexa chunks no Firestore e expõe pesquisa para IA e formulários.

## Variáveis (`.env.local` / App Hosting)

| Variável | Omissão | Efeito |
|----------|---------|--------|
| `ONEDRIVE_RAG_ENABLED` | `false` | APIs `/api/cloud-rag/*` respondem 503 |
| `ONEDRIVE_RAG_SEARCH_ENABLED` | `true` | Desliga `POST /api/cloud-rag/search` |
| `NEXT_PUBLIC_ONEDRIVE_RAG_SEARCH_ENABLED` | — | Se `false`, clientes usam fallback local |
| `ONEDRIVE_LIBRARY_ROOT_PATH` | hint do drive | Pasta raiz da biblioteca no OneDrive |
| `MICROSOFT_GRAPH_*` | — | Obrigatório (mesmo do sync OneDrive) |

Ver também `.env.example` e `docs/APP-HOSTING-VARIAVEIS.md`.

## Coleções Firestore (escrita só Admin SDK)

- `cloud_rag_files` — metadados + `rawText`
- `cloud_rag_chunks` — trechos pesquisáveis
- `cloud_rag_jobs` — progresso sync/index
- `cloud_rag_library_state` — cursor delta

## Fluxo operacional (admin)

1. Configurar Graph + `ONEDRIVE_RAG_ENABLED=true`
2. UI: **AI Lab → Biblioteca IA (OneDrive)** ou APIs:
   - `POST /api/cloud-rag/sync` — inventário
   - `POST /api/cloud-rag/index` — extrair texto e chunks
   - `POST /api/cloud-rag/search` — pesquisa
3. Formulários (cliente/empreendedor) usam `searchReferences()` → nuvem com fallback local.

## APIs

- `GET /api/cloud-rag/status`
- `POST /api/cloud-rag/sync` — body opcional: `{ jobId, continueDelta, maxPages }`
- `POST /api/cloud-rag/index` — body opcional: `{ limit, jobId }`
- `POST /api/cloud-rag/search` — `{ query, pathPrefix, cpfCnpj, maxChunks, ... }`
- `GET /api/cloud-rag/jobs/[jobId]`

## Descontinuação do import local

- `ENABLE_AI_LOCAL_IMPORT` permanece `false` por omissão.
- `import-reference-files` marcado `@deprecated`; mensagem 503 orienta cloud-rag.
- Migrar consumidores para `src/lib/reference-search`.
