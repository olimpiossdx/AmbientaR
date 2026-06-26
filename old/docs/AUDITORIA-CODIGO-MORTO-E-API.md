# Auditoria: código legado `*-SERVIDOR*`, rotas API e verificação em dev

Documento gerado no âmbito do plano de debug e limpeza (baseline, typecheck, lint, caminhos portáveis). **Não** remove ficheiros aqui listados sem PR dedicado e prova adicional (histórico Git, stakeholders).

## 1. Ficheiros `*-SERVIDOR*` e regras paralelas

| Ficheiro | Notas |
|----------|--------|
| `src/app/(app)/licenses/page-SERVIDOR.tsx` | Excluídos do `tsc` via `tsconfig.json` (`exclude`: `**/*-SERVIDOR.tsx`). Sem imports no restante do `src` (confirmado com pesquisa por `SERVIDOR` / nomes de ficheiro). Tratar como **legado espelhado**, não como entrada da app. |
| `src/app/(app)/licenses/license-form-SERVIDOR.tsx` | Idem. |
| `src/app/(app)/compliance/page-SERVIDOR.tsx` | Idem. |
| `src/app/(app)/compliance/compliance-form-SERVIDOR.tsx` | Idem. |
| `src/app/(app)/dashboards/environmental-dashboard-SERVIDOR.tsx` | Idem. |
| `src/firebase/rules/firestore-SERVIDOR.rules` | Cópia paralela; **deploy** oficial: `src/firebase/rules/firestore.rules` (`firebase.json`). |
| `src/firestore-SERVIDOR.rules` | Idem; não substituir o ficheiro de deploy sem revisão explícita. |

**Decisão:** manter no repositório até haver consolidação explícita; não apagar só por “não aparecer no grafo TypeScript” — o `exclude` é intencional.

## 2. Análise estática (exports não usados)

- **`ts-prune`** (`npx ts-prune -p tsconfig.json`): lista longa de exports potencialmente não referenciados; muitos são falsos positivos (uso dinâmico, entradas Next, tipos consumidos só em módulos). Usar como **pista**, não como lista de apagamento automático.
- **`knip`:** tentativa anterior interrompida no ambiente; pode voltar a correr com config Next dedicada quando fizer sentido.

## 3. Rotas `src/app/api/**/route.ts` — uso no `src` (exceto a própria rota)

Legenda: **usada** = `fetch`/comentário de integração encontrado em `src` fora de `src/app/api`; **sem referência** = nenhuma string de URL correspondente encontrada (pode haver chamadas externas, Postman, ou código antigo).

| Rota | Uso no `src` |
|------|----------------|
| `POST /api/ai-lab/import-reference-files` | **usada** — `ai-lab/rag/page`, `clients/client-form`, `empreendedores/empreendedor-form`, `settings/ai-local-source` |
| `POST /api/ai-lab/autofill-empreendedor` | **usada** — `client-form`, `empreendedor-form` |
| `POST /api/ai-lab/generate-report` | **usada** — `ai-lab/automations/page` |
| `POST /api/ai/preencher-relatorio` | **usada** — `studies/rca/page` |
| `POST /api/ai/enriquecer-processo` | **sem referência** no `src` (apenas a rota) |
| `POST /api/ai/deepseek/chat` | **sem referência** no `src`; o assistente usa `deepseekChatCompletion` em Server Action (`studies/assistant/actions.ts`) |
| `POST /api/canais/notificar-laudo-pronto` | **usada** — `laudos/[id]/page` |
| `POST /api/laudos/gerar-docx` | **usada** — `laudos/[id]/page` |
| `GET /api/termos-referencia/list` | **usada** — `termos-referencia-card.tsx` |
| `POST /api/geospatial/analyze` | **usada** — `licensing-locational-block.tsx` |
| `GET/POST /api/uploads/*` (várias) | **sem referência** direta a `/api/uploads/...` no `src`; uploads na app usam principalmente **`@/lib/storage-upload`** (Firebase Storage). Tratar rotas em `api/uploads/` como **legado disco / integração externa** até inventário completo fora do repo. |
| `POST /api/uploads/car-pdf`, `POST /api/uploads/car-geometry` | **sem referência** no `src` além dos próprios `route.ts` |
| `GET/POST /api/branding` | **sem referência**; branding na UI usa Firestore (`useLocalBranding`, etc.) |
| `GET/POST /api/templates/[type]` | **sem referência** no `src` |
| `GET /api/studies/[slug]/form-schema` | **sem referência** no `src` |
| `GET/POST /api/inventory-project-photos` | **sem referência**; imagens de inventário usam Storage e paths `inventory-project-photos/...` em `public/` |

**Decisão:** não remover rotas “sem referência” sem confirmar scripts, mobile, ou integrações fora deste workspace; manter documentação acima como base para PRs futuros.

## 4. Caminhos de ficheiros locais (IA / termos de referência)

- Constante partilhada: `src/lib/ai-local-source-defaults.ts` — `NEXT_PUBLIC_AI_REFERENCE_FILES_PATH` (opcional).
- Servidor (import em disco): `src/lib/ai-reference-import-base-path.ts` — ordem: `AI_REFERENCE_FILES_PATH` → mesma pública → pasta na raiz do projeto `termos de referencia/`.

## 5. Passagem em dev (runtime)

Checklist mínima após alterações sensíveis (auth, uploads, regras):

1. **Consola do browser:** erros não tratados, promises rejeitadas, avisos de hidratação.
2. **Rede:** 404 em chunks JS; falhas 4xx/5xx em rotas internas listadas na secção 3.
3. **Firebase:** login; leitura/escrita num módulo crítico (ex. cliente, estudo); se `permission-denied` repetido, cruzar com regras publicadas (`npm run deploy:rules`).

## 6. Baseline de ferramentas

Saídas iniciais (quando aplicável): `docs/BASELINE-dead-code-audit.txt`.
