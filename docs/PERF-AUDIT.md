# Auditoria de peso / bundle — reorganização conservadora

Registo de cada etapa do plano de alívio de peso (sem mudar comportamento).

## Baseline (antes das alterações)

| Métrica | Valor |
|---------|-------|
| Páginas `page.tsx` | ~286 |
| Rotas API | ~140 |
| `GEO_ALL_LAYER_COUNT` (MG continental) | 53 |
| Bundle analyzer | não configurado |

**Problemas identificados:**
- `analise-ambiental.ts` importava `z` de `genkit` no cliente
- `analise-ambiental/page.tsx` importava `WAVE_ALL_LAYER_COUNT` de `run-wave-a-analysis.ts` (~500 linhas)
- `OfflineProvider` (Dexie) no chunk inicial do layout autenticado
- `jspdf` import estático em `export-cartographic-client.ts`
- `lodash` completo em 2 formulários
- Deps mortas: `@react-google-maps/api`, `canvg`, `@google-cloud/logging`, `es-abstract`

---

## Etapa 1 — Leaks de import

| Alteração | Ficheiros |
|-----------|-----------|
| `genkit` → `zod` | `src/lib/types/analise-ambiental.ts` |
| Constante leve `WAVE_ALL_LAYER_COUNT = 53` | `src/lib/geospatial/geo-constants.ts` (novo) |
| Cliente importa só `geo-constants` | `analise-ambiental/page.tsx`, `geo-analysis-complement-panel.tsx` |
| Servidor re-exporta de `geo-constants` | `run-wave-a-analysis.ts` |

**Verificação:** `npm run typecheck`

---

## Etapa 2 — Lazy-load (padrões existentes)

| Alteração | Ficheiros |
|-----------|-----------|
| `OfflineProvider` via `dynamic()` | `(app)/layout.tsx` |
| `jspdf` via `await import()` | `export-cartographic-client.ts` |
| `lodash/merge` pontual | `project-form.tsx`, `rca-form-initial-values.ts` |

**Verificação:** `npm run typecheck`, smoke manual layout + export cartográfico

---

## Etapa 3 — Config e deps

| Alteração | Ficheiros |
|-----------|-----------|
| `optimizePackageImports` | `next.config.mjs` |
| `@next/bundle-analyzer` + `npm run analyze` | `package.json`, `scripts/analyze-build.mjs` |
| Removidas deps mortas | `package.json` |
| `@capacitor/cli`, `patch-package` → devDependencies | `package.json` |

**Verificação:** `npm install`, `npm run build`

---

## Etapa 4 — Rotas `(.)` intercepting

**Status:** adiado — ficheiros `(.)` usam `Dialog` modal; páginas `new/` e `[id]/edit/` usam layout de página cheia. Re-export simples **quebraria** a UX. Requer extração de wrapper partilhado (fora do escopo “só reorganizar”).

---

## Etapa 6 — Raiz do repositório

| Alteração | Detalhe |
|-----------|---------|
| MDs de setup → `docs/setup/` | Consolidar guias “como rodar” |
| `.gitignore` | `logs/`, `.codex/logs/`, `apphosting-check.log` |

---

## Como medir depois

```bash
npm run analyze
```

Abre relatório HTML do webpack no browser após o build.

---

## Estado final (2026-06-23)

| Etapa | Status |
|-------|--------|
| 0 Baseline + analyzer | Concluída |
| 1 Leaks import | Concluída |
| 2 Lazy-load | Concluída |
| 3 Config + deps mortas | Concluída |
| 4 Rotas `(.)` | Adiada (modal ≠ página cheia) |
| 5 Lucide/recharts | Via `optimizePackageImports` |
| 6 Raiz repo | MDs → `docs/setup/`, `.gitignore` |

**Build:** `npm run build` falha por erros de sintaxe **pré-existentes** em ficheiros não tocados (`requests/new/page.tsx`, `licenses/page.tsx`, etc.). Ficheiros alterados neste plano passam lint sem erros.

**Próximo passo sugerido:** corrigir sintaxe nos ficheiros quebrados (fora do escopo deste plano) e depois correr `npm run analyze` para quantificar ganho de bundle.
