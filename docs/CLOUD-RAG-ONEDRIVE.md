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

## Produção (Firebase App Hosting)

URL de produção: **`https://www.ambientar.ia.br`** (também `https://ambientar.ia.br`).

O [`apphosting.yaml`](../apphosting.yaml) declara `ONEDRIVE_SYNC_ENABLED`, `ONEDRIVE_RAG_ENABLED` e caminhos da biblioteca. Os três `MICROSOFT_GRAPH_*` vêm do **Secret Manager** (não commitar o client secret).

### 1. Criar secrets no Firebase (uma vez)

Na raiz do projeto, com `firebase login` e projeto `studio-316805764-e4d13`:

```powershell
npx firebase apphosting:secrets:set MICROSOFT_GRAPH_TENANT_ID
npx firebase apphosting:secrets:set MICROSOFT_GRAPH_CLIENT_ID
npx firebase apphosting:secrets:set MICROSOFT_GRAPH_CLIENT_SECRET
```

Cole os mesmos valores do `.env.local` (Tenant ID, Client ID e **Value** do secret Azure — não o ID do segredo).

Se o CLI pedir, conceda acesso ao backend App Hosting (ou manualmente):

```powershell
npx firebase apphosting:secrets:grantaccess MICROSOFT_GRAPH_TENANT_ID --backend SEU_BACKEND_ID
npx firebase apphosting:secrets:grantaccess MICROSOFT_GRAPH_CLIENT_ID --backend SEU_BACKEND_ID
npx firebase apphosting:secrets:grantaccess MICROSOFT_GRAPH_CLIENT_SECRET --backend SEU_BACKEND_ID
```

O **Backend ID** está em Firebase Console → **App Hosting** → o teu backend.

**Alternativa:** Firebase Console → App Hosting → backend → **Environment variables** → adicionar as mesmas variáveis (secret para o client secret). Exige **novo rollout** após guardar.

### 2. Azure

- App **Sincronização do AmbientaR com o OneDrive**
- Permissões **Delegado**: `User.Read`, `Files.Read`, `offline_access` (e **Aplicativo** `Files.Read.All` se usar modo `app`)
- **Autenticação** → redirect URI obrigatório em produção:

`https://www.ambientar.ia.br/api/onedrive-consumer/auth/callback`

Produção usa **modo delegado** (`ONEDRIVE_GRAPH_AUTH_MODE=delegated` em [`apphosting.yaml`](../apphosting.yaml)) para OneDrive pessoal (@outlook) — tenant sem licença SharePoint empresarial (erro `SPO license`). Após rollout, na UI: **Ligar conta Microsoft** antes de bootstrap/sync.

Modo **`app`** (client credentials) só com Microsoft 365 Business + SPO no tenant.

### 3. Deploy

```powershell
git add apphosting.yaml
git commit -m "..."
git push
```

O App Hosting faz rollout automático. Ou: Console → App Hosting → **Create rollout**.

Antes do push:

```powershell
npm run apphosting:check
```

### 4. Validar em produção

1. Login **admin** em `https://www.ambientar.ia.br`
2. **AI Lab → Biblioteca IA (OneDrive)** → **Atualizar**
3. Esperado: `ONEDRIVE_RAG_ENABLED: sim`, `Graph: ok`
4. **Sincronizar biblioteca** → **Indexar pendentes**

Os dados indexados ficam no Firestore (`cloud_rag_*`) — partilhados entre dev e produção se usarem o mesmo projeto Firebase.
