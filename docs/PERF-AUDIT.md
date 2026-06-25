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
| **F04 Credenciais** | ✅ `config/firebase-service-account.json` |
| **F05 Legado SERVIDOR** | ✅ 8 ficheiros removidos |
| **F06 Launchers** | ✅ `scripts/launchers/` + wrapper `start-dev.bat` |
| **F07 Recharts CRM** | ✅ lazy em `crm/*` |
| **F08 Recharts financeiro** | ✅ lazy em `financial/*`, `cash-flow`, dashboards |
| **F09 Recharts monitoramento** | ✅ lazy em `monitoring/manual` |
| **F10 Turf no cliente** | ✅ imports leves + `import()` dinâmico |
| **F11 Upload pipeline** | ✅ `browser-image-compression` + `pizzip` lazy |
| **F12 Shell layout** | ✅ providers lazy + `navigation-labels` |
| **F13 Piloto licenses FormShell** | ✅ `license-form-shell.tsx` |
| **F14 Portal docs lote 1** | ✅ `invoices` + `outorgas` FormShell |
| **F15 Cadastro técnico** | ✅ `technical-responsible` + `responsible-company` |
| **F16 Estudos lote 1** | ✅ `rca` + `pca` via `study-form-shell.tsx` (parcial) |
| **F16 Estudos lote 2** | ✅ `ptrf`, `prada`, `pia`, `eia-rima` (`intervencao-ambiental` = redirect PIA) |
| **F16 Estudos lote 3** | ✅ `barragem`, `cavidades`, `las-ras`, `procuracao`, `outorgas` edit (`reanalise` = só dynamic) |
| **F17 Medição final** | ✅ build + `apphosting:check` OK (2026-06-23) |
| **F18 Automação leve** | ✅ `npm run perf:check` + doc `AGENTS.md` |

---

## Bloco 1 — Concluído (2026-06-23)

### F04 — Credenciais ✅

- JSON copiado com `node scripts/copy-firebase-service-account.mjs` → `config/firebase-service-account.json`
- Removidos: `chave firebase/*.json`, `config/firebase-service-account.json.json`
- `chaves gerais.txt` → `config/chaves-gerais.txt` (gitignored)
- Pasta `chave firebase/` removida
- [`config/README.md`](../config/README.md) atualizado

### F05 — Legado `*-SERVIDOR*` ✅

Removidos: `licenses/page-SERVIDOR.tsx`, `license-form-SERVIDOR.tsx`, `compliance/*-SERVIDOR.tsx`, `environmental-dashboard-SERVIDOR.tsx`, `firestore-SERVIDOR.rules` (×2), `package-lock-SERVIDOR.json`

### F06 — Launchers ✅

- Atalhos em [`scripts/launchers/`](../scripts/launchers/) + README
- Raiz: só `start-dev.bat` (wrapper)
- Removidos da raiz: `.ps1` e `.bat` duplicados, `iniciar-agora-F-Projects-nodejs.bat` (caminho F: legado)
- [`README.md`](../README.md) aponta para `docs/setup/COMO-RODAR.md`

**Verificação:** `npm run typecheck` OK · `npm run verify:env` OK (Admin via `config/firebase-service-account.json` sem env var)

### F07 — Recharts CRM lazy ✅ (2026-06-23)

| Ficheiro | Mudança |
|----------|---------|
| `crm/page.tsx` | `CrmDashboard` via `dynamic()` |
| `crm/reports/page.tsx` | gráficos → `crm-reports-charts.tsx` lazy |
| `crm/team/page.tsx` | gráfico → `crm-team-revenue-chart.tsx` lazy |
| `crm/crm-reports-charts.tsx` | novo — recharts isolado |
| `crm/crm-team-revenue-chart.tsx` | novo — recharts isolado |

**Verificação:** `npm run typecheck` OK

### F08 — Recharts financeiro lazy ✅ (2026-06-23)

| Ficheiro | Mudança |
|----------|---------|
| `dashboards/admin-dashboard.tsx` | `FinancialDashboard` + `CrmDashboard` via `dynamic()` |
| `(app)/page.tsx` | `FinancialDashboard` lazy (`ssr: false`) |
| `cash-flow/cash-flow-view.tsx` | `CashFlowChart` lazy |
| `financial/fluxo-projetado/page.tsx` | gráfico → `fluxo-projetado-chart.tsx` lazy |
| `financial/abc-curve/page.tsx` | gráficos → `abc-curve-charts.tsx` lazy |
| `financial/abc-fornecedores/page.tsx` | `AbcAnalysisView` lazy |
| `financial/abc-servicos/page.tsx` | `AbcAnalysisView` lazy |
| `financial/fluxo-projetado/fluxo-projetado-chart.tsx` | novo — recharts isolado |
| `financial/abc-curve/abc-curve-charts.tsx` | novo — recharts isolado |
| `components/financial/abc-analysis-view.tsx` | export `AbcAnalysisViewProps` |

**Verificação:** `npm run typecheck` OK · `npm run build` OK

| Rota | Página | First Load JS |
|------|--------|---------------|
| `/cash-flow` | 15,7 kB | 379 kB |
| `/financial/fluxo-projetado` | 4,34 kB | **294 kB** |
| `/financial/abc-curve` | 7,48 kB | 341 kB |
| `/financial/abc-fornecedores` | 2,42 kB | **303 kB** |
| `/financial/abc-servicos` | 1,37 kB | **302 kB** |
| **Shared** | — | **91,5 kB** |

### F09 — Recharts monitoramento lazy ✅ (2026-06-23)

| Ficheiro | Mudança |
|----------|---------|
| `monitoring/manual/page.tsx` | gráficos → `ManualMonitoringCharts` via `dynamic()` |
| `monitoring/manual/manual-monitoring-charts.tsx` | novo — BarChart + LineChart isolados |

**Verificação:** `npm run typecheck` OK · `npm run build` OK

| Rota | Página | First Load JS |
|------|--------|---------------|
| `/monitoring/manual` | 11,6 kB | 424 kB |
| **Shared** | — | **91,5 kB** |

### F10 — Turf no cliente ✅ (2026-06-23)

| Ficheiro | Mudança |
|----------|---------|
| `geo-analysis-summary.ts` | `WAVE_ALL_LAYER_COUNT` → `geo-constants` (não puxa `run-wave-a-analysis` no cliente) |
| `export-wave-a-pdf.ts`, `geo-complement-prompt.ts`, `geo-analysis-complement-flow.ts` | idem |
| `localizacao-imovel-client.ts` | novo — `localizacaoToPerimeterInput` sem Turf |
| `influence-areas-config.ts` | novo — `DEFAULT_INFLUENCE_CONFIG` sem Turf |
| `geo-influence-areas-panel.tsx` | `resolveInfluenceAreas` via `import()` dinâmico |
| `project-perimetro-referencia.ts` | `@turf/area` + `@turf/bbox` e `perimeter` via `import()` sob demanda |
| `memorial-descritivo-workbench.tsx` | `@turf/area` → `useMcaTurfArea()` |
| `influence-areas.ts` | tipos de `geo-wave-a`; config em ficheiro leve |

**Verificação:** `npm run typecheck` OK · `npm run build` OK · `@turf/turf` só em módulos servidor (`fiscal-ambiental/*`)

| Rota | Página | First Load JS | Antes (baseline) |
|------|--------|---------------|------------------|
| `/analise-ambiental` | 21,3 kB | **457 kB** | 464 kB |
| **Shared** | — | **91,6 kB** | 91,3 kB |

### F11 — Upload pipeline lazy ✅ (2026-06-23)

| Ficheiro | Mudança |
|----------|---------|
| `upload-pipeline.ts` | `browser-image-compression` e `pizzip` via `import()` dentro de `compressImageFile` / `recompressZipBlob` |
| `upload-pipeline-pdf.ts` | já era lazy (`import()` em `prepareFileForUpload`) |

**Verificação:** `npm run typecheck` OK · `npm run build` OK

Consumidores (`use-prepared-upload`, inspeções, pedidos, multas) carregam compressão só ao preparar ficheiro > limite.

| Rota (exemplo upload) | First Load JS |
|-----------------------|---------------|
| `/inspections/new` | 469 kB |
| `/requests/new` | 359 kB |
| `/licenses/new` | 378 kB |
| **Shared** | **91,7 kB** |

### F12 — Shell layout autenticado ✅ (2026-06-23)

| Ficheiro | Mudança |
|----------|---------|
| `(app)/layout.tsx` | `NotificationPushProvider`, `OfflineQueueBadge` via `dynamic()` |
| `(app)/layout.tsx` | `FinancialMenuDebugPanel` / `CadastroMenuDebugPanel` lazy só em `development` |
| `(app)/layout.tsx` | `PortalAdvertisingLayerLazy` — anúncios portal após paint |
| `navigation-labels.ts` | novo — rótulos sem Lucide (layout não puxa `navigation-config`) |
| `navigation-icons.ts` | novo — ícones isolados de `navigation-config` |
| `portal-advertising-layer-lazy.tsx` | novo — wrapper com `import()` |

**Verificação:** `npm run typecheck` OK · `npm run build` OK

| Métrica | Antes (baseline) | Após F12 |
|---------|------------------|----------|
| Shared First Load | 91,3 kB | **91,8 kB** |
| `/login` | 288 kB | **286 kB** |
| `/analise-ambiental` | 464 kB | **445 kB** |

Meta aspiracional shared &lt; 88 kB não atingida — `NavContent` + `navigation-config` continuam no chunk da sidebar. Bloco 2 (F07–F12) **concluído**.

**Próximo passo sugerido:** **F16** (estudos técnicos lote 3) — [`PERF-ROADMAP-DETALHADO.md`](PERF-ROADMAP-DETALHADO.md).

### F13 — Piloto licenses `FormShell` ✅ (2026-06-23)

| Ficheiro | Mudança |
|----------|---------|
| `licenses/license-form-shell.tsx` | novo — `variant: modal \| page`, loading, not-found, navegação |
| `licenses/new/page.tsx` | shell `page` |
| `licenses/(.)new/page.tsx` | shell `modal` (~25 linhas) |
| `licenses/[id]/edit/page.tsx` | shell `page` + fetch |
| `licenses/(.)[id]/edit/page.tsx` | shell `modal` + fetch |

**Verificação:** `npm run typecheck` OK · `npm run audit:routes` OK (mesmas rotas `/licenses/new`, `/licenses/[id]/edit`)

**Smoke manual:** lista → novo/editar modal; URLs directas → página cheia.

**Próximo passo sugerido:** **F16** (estudos técnicos lote 3) — [`PERF-ROADMAP-DETALHADO.md`](PERF-ROADMAP-DETALHADO.md).

### F14 — Portal documentos lote 1 ✅ (2026-06-23)

**Invoices**

| Ficheiro | Mudança |
|----------|---------|
| `invoices/invoice-form-shell.tsx` | novo — shell modal/página + `onCancel` via `useInvoiceFormShellDismiss` |
| `invoices/new`, `(.)new`, `[id]/edit`, `(.)[id]/edit` | refatorados |

**Outorgas**

| Ficheiro | Mudança |
|----------|---------|
| `outorgas/outorga-form-shell.tsx` | novo |
| `outorgas/new`, `(.)new`, `[id]/edit`, `(.)[id]/edit` | refatorados |

**Verificação:** `npm run typecheck` OK · `npm run audit:routes` OK

**Próximo passo sugerido:** **F16** (estudos técnicos lote 3) — [`PERF-ROADMAP-DETALHADO.md`](PERF-ROADMAP-DETALHADO.md).

### F15 — Cadastro técnico ✅ (2026-06-23)

| Entidade | Shell | Rotas |
|----------|-------|-------|
| `technical-responsible` | `responsible-form-shell.tsx` | `new`, `(.)new`, `[id]/edit`, `(.)[id]/edit` |
| `responsible-company` | `company-form-shell.tsx` (`max-w-3xl`, modal `95vh`) | idem + `useCadastroGestaoWriteGuard` nas páginas |

**Verificação:** `npm run typecheck` OK

**Próximo passo sugerido:** **F16** (estudos: `ptrf`, `prada`, `pia`, …) — [`PERF-ROADMAP-DETALHADO.md`](PERF-ROADMAP-DETALHADO.md).

### F16 — Estudos técnicos lote 1 (parcial) ✅ (2026-06-23)

Shell partilhado `src/components/studies/study-form-shell.tsx` — layout largo (`max-w-7xl`, modal `sm:max-w-7xl`), `pageHeaderActions`, ramo `?form=dynamic` preservado nas páginas `new`.

| Entidade | Rotas refatoradas | Notas |
|----------|-------------------|-------|
| `rca` | `new`, `(.)new`, `[id]/edit`, `(.)[id]/edit` | `StudyDynamicCreationPage` + botão TR em `new` |
| `pca` | idem | idem |

**Verificação:** `npm run typecheck` OK · `npm run audit:routes` OK

**Próximo passo sugerido:** **F16** (restantes estudos sem shell: `barragem`, `las-ras`, `reanalise`, …) — [`PERF-ROADMAP-DETALHADO.md`](PERF-ROADMAP-DETALHADO.md).

### F16 — Estudos técnicos lote 2 ✅ (2026-06-23)

| Entidade | Rotas | Notas |
|----------|-------|-------|
| `ptrf` | `new`, `(.)new`, `[id]/edit`, `(.)[id]/edit` | modal `sm:max-w-4xl` preservado |
| `prada` | idem | layout `max-w-7xl` |
| `pia` | idem | `?type`, `linkContext` em `new`; `PiaExportButtons` em edit página |
| `eia-rima` | idem | `?form=dynamic`; página/modal `max-w-4xl` |
| `intervencao-ambiental` | — | sem alteração (redirect legado → PIA) |

Shell: `cardHeaderExtra` adicionado em `study-form-shell.tsx` (export PIA).

**Verificação:** `npm run typecheck` OK · `npm run audit:routes` OK

**Próximo passo sugerido:** **F17** (medição final) ou estudos restantes sem `(.)` intercept — [`PERF-ROADMAP-DETALHADO.md`](PERF-ROADMAP-DETALHADO.md).

### F16 — Estudos técnicos lote 3 ✅ (2026-06-23)

| Entidade | Rotas | Notas |
|----------|-------|-------|
| `barragem` | `new`, `[id]/edit` | `onCreated`/`onCancel`; export no `PageHeader` |
| `cavidades` | idem | idem |
| `las-ras` | `new`, `[id]/edit` | `?form=dynamic`; edit dinâmico → `StudyDynamicEditPage` |
| `procuracao` | `new`, `[id]/edit` | `max-w-4xl` |
| `outorgas` (estudos) | `[id]/edit` | `max-w-2xl`; `new` = picker modo de uso (sem shell) |
| `reanalise` | — | já só formulário dinâmico (sem alteração) |

Shell: `cardContentClassName` para `min-h-[480px]` (barragem/cavidades).

**Verificação:** `npm run typecheck` OK

**Plano F00–F18 concluído** — ver secção F18 abaixo.

### F17 — Medição final e comparativo ✅ (2026-06-23)

Comandos: `NODE_OPTIONS=--max-old-space-size=8192 npm run build` · `npm run apphosting:check` (status **0**).  
`npm run analyze` não reexecutado (build duplicado ~3 min); notas dos chunks partilhados abaixo.

**Tabela comparativa (First Load JS):**

| Métrica | Baseline | Após F12 | Após F16 (F17) | Δ vs baseline |
|---------|----------|----------|----------------|---------------|
| Shared (app router) | 91,3 kB | 91,8 kB | **91,8 kB** | +0,5 kB |
| `/login` | 288 kB | 286 kB | **286 kB** | −2 kB |
| `/` (dashboard) | — | — | **316 kB** | — |
| `/analise-ambiental` | 464 kB | 445 kB | **444 kB** | −20 kB |
| `/licenses` (lista) | — | — | **387 kB** | — |
| `/licenses/new` | — | — | **378 kB** | — |

**Rotas `(.)` intercept (24 ficheiros):** ~921 linhas totais (estimativa pré-F13 ~1200 — redução por `FormShell` / `StudyFormShell`).

**Maiores chunks partilhados (build):**

| Chunk | Tamanho |
|-------|---------|
| `chunks/fd9d1056-*.js` | 53,6 kB |
| `chunks/framework-*.js` (pages) | 56,4 kB |
| `chunks/main-*.js` (pages) | 44,9 kB |
| `chunks/86997-*.js` | 34,1 kB |

**Rotas mais pesadas (candidatas futuras, não alteradas neste plano):** `/coleta-campo/[id]` 583 kB · `/gestao-processos/fluxo` 577 kB · `/georeferenciamento/memorial-descritivo` 536 kB · `/projects/new` 534 kB.

**Conclusão F17:** ganhos de runtime concentrados no Bloco 2 (`/analise-ambiental` −4,3 %). Shared permanece ~92 kB (meta &lt; 88 kB não atingida). Bloco 3 (F13–F16) melhorou manutenção e linhas das rotas `(.)` sem impacto mensurável no shared chunk.

**Plano de performance (F00–F18):** concluído. Revalidado em 2026-06-25 — ver secção «Revalidação global».

### F18 — Automação leve ✅ (2026-06-23)

| Ação | Detalhe |
|------|---------|
| `scripts/perf-check.mjs` | `typecheck` → `audit:routes` → zero `@turf/turf` / `run-wave-a-analysis` em `"use client"` |
| `scripts/perf-phase-debug.mjs` | Conferência estrutural F04–F18 (FormShells, lazy, credenciais) |
| `scripts/perf-smoke-http.mjs` | Smoke HTTP 14 rotas (dev `:9002`; após `build` limpar `.next/server` se MODULE_NOT_FOUND) |
| `package.json` | scripts `perf:check`, `perf:phase-debug`, `perf:smoke-http`, `perf:smoke-all`, `dev:clean-cache` |
| `AGENTS.md` | links `PERF-ROADMAP-DETALHADO.md` / `PERF-AUDIT.md`; regra **uma fase = um PR** |

**Não incluído (de propósito):** gate de bundle size no CI.

**Verificação:** `npm run perf:check` OK

### Métricas baseline inicial (`npm run build`, antes do Bloco 2)

| Rota / chunk | Tamanho página | First Load JS |
|--------------|----------------|---------------|
| **Shared (todas as rotas app)** | — | **91,3 kB** |
| `/login` | 6,5 kB | 288 kB |
| `/analise-ambiental` | 18,4 kB | 464 kB |
| Framework (pages router legado) | — | 105 kB |

**Analyzer:** `npm run analyze` (heap 8 GB via `scripts/analyze-build.mjs`).

---

## Revalidação global (2026-06-25)

Conferência fase a fase sem alterar código (só documentação desatualizada no roadmap).

| Fase | Conferência | Resultado |
|------|-------------|-----------|
| F04–F06 | Sem `*-SERVIDOR*`; launchers em `scripts/launchers/`; credenciais em `config/` | ✅ |
| F07–F09 | `dynamic()` em CRM, financeiro, monitoramento | ✅ |
| F10 | `@turf/turf` só servidor (`fiscal-ambiental/*`) | ✅ |
| F11 | `upload-pipeline.ts` com `import()` lazy | ✅ |
| F12 | Providers lazy em `(app)/layout.tsx` | ✅ |
| F13–F15 | `license-form-shell`, `invoice-form-shell`, `outorga-form-shell`, `responsible-form-shell`, `company-form-shell` | ✅ |
| F16 | `study-form-shell` + estudos sem `(.)` com shell página; `intervencao-ambiental` → redirect PIA | ✅ |
| F17 | `npm run build` + `npm run apphosting:check` (status **0**) | ✅ |
| F18 | `npm run perf:check` | ✅ |

**Métricas build (2026-06-25):**

| Métrica | Baseline | Revalidação 2026-06-25 |
|---------|----------|------------------------|
| Shared First Load | 91,3 kB | **91,8 kB** |
| `/login` | 288 kB | **288 kB** |
| `/analise-ambiental` | 464 kB | **446 kB** (−18 kB) |
| `/licenses` (lista) | — | **389 kB** |
| `/licenses/new` | — | **380 kB** |

**Rotas `(.)` intercept:** 24 ficheiros, **~425 linhas** totais (antes ~921 em F17).

**Manutenção:** `npm run perf:check` antes de PRs que toquem rotas, geo ou shell. Não reabrir fases sem regressão comprovada.

### G1 — Smoke global + debug estrutural ✅ (2026-06-25)

Comandos (dev em `http://localhost:9002`):

```bash
npm run perf:phase-debug   # 18/18 checks estruturais F04–F18
npm run perf:smoke-http    # 14/14 rotas HTTP (200 ou redirect)
npm run perf:check         # typecheck + rotas + turf cliente
```

| Checklist global | Resultado |
|------------------|-----------|
| Login `/login` | ✅ 200 |
| Painel `/` | ✅ 200 |
| CRM F07 (`/crm`, `/crm/reports`) | ✅ 200 |
| Financeiro F08 (`/cash-flow`, `/fluxo-projetado`) | ✅ 200 |
| Monitoramento F09 (`/monitoring/manual`) | ✅ 200 |
| Análise F10 (`/analise-ambiental`) | ✅ 200 |
| Licenses F13 (lista + `/new`) | ✅ 200 |
| Portal F14 (`/invoices`, `/outorgas`) | ✅ 200 |
| Cadastro F15 (`/technical-responsible`) | ✅ 200 |
| Estudos F16 (`/studies/rca`) | ✅ 200 |

**Debug encontrado e corrigido:** após `npm run build`, o dev em `:9002` devolveu `500 MODULE_NOT_FOUND` (`react-day-picker` em `.next/server/vendor-chunks`). **Correção:** `npm run dev:clean-cache` (ou apagar `.next/server` e `.next/cache`) e depois `npm run dev`. Não é regressão de código — cache dev inconsistente com artefactos de produção.

### G2 — FormShell modal (estrutural) ✅ (2026-06-25)

```bash
npm run perf:form-shell-debug
```

**24/24** rotas `(.)` com `FormShell` / `StudyFormShell` + `variant="modal"` ou redirect legado (`intervencao-ambiental` → PIA).

Rotas de **página cheia** (`new/page.tsx`, `[id]/edit/page.tsx` sem `(.)`) não entram neste check — smoke manual: abrir modal na lista vs URL directa.

---

## Pós-roadmap — rotas pesadas (F19+)

Fora do plano F00–F18; **uma rota por PR**, mesmo protocolo de debug.

### F19a — `/projects/new` e `/projects/[id]/edit` lazy `ProjectForm` ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `projects/new/page.tsx` | `ProjectForm` via `dynamic()` (`ssr: false`) |
| `projects/[id]/edit/page.tsx` | idem |

**Verificação:** `npm run typecheck` · `npm run build`

| Rota | Baseline (F17) | Após F19a |
|------|----------------|-----------|
| `/projects/new` | ~534 kB | **295 kB** (−239 kB) |
| `/projects/[id]/edit` | — | **295 kB** |
| `/projects` (lista) | — | **319 kB** |
| Shared | 91,8 kB | **91,9 kB** |

**Próximo candidato F19b:** `/gestao-processos/fluxo` (~577 kB) — lazy do kanban/view pesado, sem alterar fluxo.

### F19b — `/gestao-processos/fluxo` lazy `GestaoProcessosFluxoView` ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `gestao-processos/fluxo/page.tsx` | `GestaoProcessosFluxoView` via `dynamic()` (`ssr: false`) |

**Verificação:** `npm run typecheck` · `npm run build`

| Rota | Baseline (F17) | Após F19b |
|------|----------------|-----------|
| `/gestao-processos/fluxo` | ~577 kB | **255 kB** (−322 kB) |
| Shared | 91,9 kB | **92,2 kB** |

**Próximo candidato F19c:** `/coleta-campo/[id]` (~583 kB) ou `/georeferenciamento/memorial-descritivo` (~536 kB).

### F19c — `/coleta-campo/[id]` lazy `CampanhaDetailView` ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `coleta-campo/[id]/page.tsx` | Shell fino com `dynamic()` |
| `coleta-campo/[id]/campanha-detail-view.tsx` | View completa (Excel, consolidação, coordenadas) |

**Verificação:** `npm run typecheck` · `npm run build` · `npm run perf:phase-debug` (18/18)

| Rota | Baseline (F17) | Após F19c |
|------|----------------|-----------|
| `/coleta-campo/[id]` | ~583 kB | **146 kB** (−437 kB) |
| Shared | 91,9 kB | **92,2 kB** |

**Próximo candidato F19d:** `/georeferenciamento/memorial-descritivo` (~536 kB) — lazy de `MemorialDescritivoWorkbench`.

### F19d — memorial descritivo lazy `MemorialDescritivoWorkbench` ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `georeferenciamento/memorial-descritivo/page.tsx` | `MemorialDescritivoWorkbench` via `dynamic()` (`ssr: false`) |
| `studies/memorial-descritivo/page.tsx` | Mesmo padrão (`context="studies"`) |

**Verificação:** `npm run typecheck` · `npm run build`

| Rota | Baseline (F17) | Após F19d |
|------|----------------|-----------|
| `/georeferenciamento/memorial-descritivo` | ~541 kB | **146 kB** (−395 kB) |
| `/studies/memorial-descritivo` | ~541 kB | **146 kB** (−395 kB) |
| Shared | 92,2 kB | **92,2 kB** |

**Próximo candidato F19e:** auditar rotas restantes >300 kB no output de `npm run build` (ex. `/coleta-campo/nova` ~374 kB, parcelas ~348 kB).

### F19e — coleta campo nova/parcela lazy views ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `coleta-campo/nova/page.tsx` | Shell fino com `dynamic()` |
| `coleta-campo/nova/nova-campanha-view.tsx` | Formulário nova campanha |
| `coleta-campo/[id]/parcelas/[parcelaId]/page.tsx` | Shell fino com `dynamic()` |
| `coleta-campo/[id]/parcelas/[parcelaId]/parcela-detail-view.tsx` | Lançamento de árvores |

**Verificação:** `npm run typecheck` · `npm run build`

| Rota | Baseline (F17) | Após F19e |
|------|----------------|-----------|
| `/coleta-campo/nova` | ~374 kB | **146 kB** (−228 kB) |
| `/coleta-campo/[id]/parcelas/[parcelaId]` | ~348 kB | **146 kB** (−202 kB) |
| Shared | 92,2 kB | **92,4 kB** |

**Próximo candidato F19f:** `/coleta-campo` listagem (~341 kB) e outras rotas >300 kB no output de `npm run build`.

### F19f — `/coleta-campo` listagem lazy `ColetaCampoListView` ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `coleta-campo/page.tsx` | Shell fino com `dynamic()` |
| `coleta-campo/coleta-campo-list-view.tsx` | Listagem de campanhas |

**Verificação:** `npm run typecheck` · `npm run build`

| Rota | Baseline (F17) | Após F19f |
|------|----------------|-----------|
| `/coleta-campo` | ~341 kB | **146 kB** (−195 kB) |
| Shared | 92,4 kB | **92,4 kB** |

**Próximo candidato F19g:** rotas >400 kB (ex. `/analise-ambiental` ~446 kB, propostas comerciais ~428 kB).

### F19g — análise ambiental, propostas e compliance lazy views ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `analise-ambiental/page.tsx` + `analise-ambiental-view.tsx` | Shell + view geoespacial |
| `commercial-proposals/page.tsx` + `commercial-proposals-list-view.tsx` | Shell + listagem |
| `compliance/page.tsx` + `compliance-view.tsx` | Shell + condicionantes |

**Verificação:** `npm run typecheck` · `npm run build`

| Rota | Baseline (F17) | Após F19g |
|------|----------------|-----------|
| `/analise-ambiental` | ~446 kB | **146 kB** (−300 kB) |
| `/commercial-proposals` | ~428 kB | **146 kB** (−282 kB) |
| `/compliance` | ~400 kB | **146 kB** (−254 kB) |
| Shared | 92,4 kB | **92,4 kB** |

**Próximo candidato F19h:** sub-rotas ainda pesadas (ex. `/commercial-proposals/new` ~411 kB, `/contracts` ~402 kB).

### F19h — propostas/contratos lazy forms e listagem ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `commercial-proposals/new/page.tsx` | `ProposalForm` via `dynamic()` |
| `commercial-proposals/[id]/edit/page.tsx` | `ProposalForm` via `dynamic()` |
| `contracts/page.tsx` + `contracts-list-view.tsx` | Shell + listagem |
| `contracts/new/page.tsx` | `ContractForm` via `dynamic()` |
| `contracts/[id]/edit/page.tsx` | `ContractForm` via `dynamic()` |

**Verificação:** `npm run typecheck` · `npm run build`

| Rota | Baseline (F17) | Após F19h |
|------|----------------|-----------|
| `/commercial-proposals/new` | ~411 kB | **147 kB** (−264 kB) |
| `/commercial-proposals/[id]/edit` | ~410 kB | **295 kB** (−115 kB) |
| `/contracts` | ~402 kB | **147 kB** (−255 kB) |
| `/contracts/new` | ~388 kB | **147 kB** (−241 kB) |
| `/contracts/[id]/edit` | ~388 kB | **295 kB** (−93 kB) |
| Shared | 92,4 kB | **92,4 kB** |

**Próximo candidato F19i:** `/contracts-suppliers` (~392 kB), `/cash-flow` (~382 kB).

### F19i — fornecedores e fluxo de caixa lazy views ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `contracts-suppliers/page.tsx` + `contracts-suppliers-list-view.tsx` | Shell + listagem |
| `cash-flow/page.tsx` + `cash-flow-dashboard-view.tsx` | Shell + dashboard (PDF) |
| `cash-flow/new/page.tsx` | `TransactionForm` via `dynamic()` |
| `cash-flow/[id]/edit/page.tsx` | `TransactionForm` via `dynamic()` |

**Verificação:** `npm run typecheck` · `npm run build`

| Rota | Baseline (F17) | Após F19i |
|------|----------------|-----------|
| `/contracts-suppliers` | ~392 kB | **147 kB** (−245 kB) |
| `/cash-flow` | ~383 kB | **147 kB** (−236 kB) |
| `/cash-flow/new` | ~375 kB | **147 kB** (−228 kB) |
| `/cash-flow/[id]/edit` | ~375 kB | **296 kB** (−79 kB) |
| Shared | 92,4 kB | **92,4 kB** |

**Próximo candidato F19j:** `/empreendedores` (~341 kB), `/clients` (~332 kB).

### F19j — empreendedores e clientes lazy views ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `empreendedores/page.tsx` + `empreendedores-list-view.tsx` | Shell + listagem |
| `empreendedores/new` e `[id]/edit` | `EmpreendedorForm` via `dynamic()` |
| `clients/page.tsx` + `clients-list-view.tsx` | Shell + listagem |
| `clients/new` e `[id]/edit` | `ClientForm` via `dynamic()` |

**Verificação:** `npm run typecheck` · `npm run build`

| Rota | Baseline (F17) | Após F19j |
|------|----------------|-----------|
| `/empreendedores` | ~340 kB | **147 kB** (−193 kB) |
| `/empreendedores/new` | ~391 kB | **297 kB** (−94 kB) |
| `/empreendedores/[id]/edit` | ~391 kB | **297 kB** (−94 kB) |
| `/clients` | ~332 kB | **147 kB** (−185 kB) |
| `/clients/new` | ~381 kB | **296 kB** (−85 kB) |
| `/clients/[id]/edit` | ~380 kB | **296 kB** (−84 kB) |
| Shared | 92,4 kB | **92,4 kB** |

**Próximo candidato F19k:** `/ctf-ibama` (~380 kB), `/fauna` (~375 kB).

### F19k — CTF IBAMA e fauna lazy views ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `ctf-ibama/page.tsx` + `ctf-ibama-list-view.tsx` | Shell + listagem CTF |
| `fauna/page.tsx` + `fauna-management-view.tsx` | Shell + gestão fauna |

**Verificação:** `npm run typecheck` · `npm run build`

| Rota | Baseline (F17) | Após F19k |
|------|----------------|-----------|
| `/ctf-ibama` | ~381 kB | **147 kB** (−234 kB) |
| `/fauna` | ~376 kB | **147 kB** (−229 kB) |
| Shared | 92,4 kB | **92,4 kB** |

**Próximo candidato F19l:** `/studies/fauna` (~356 kB), `/calendar` (~358 kB).

### F19l — hub fauna (estudos) e agenda lazy views ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `studies/fauna/page.tsx` + `studies-fauna-hub-view.tsx` | Shell + hub fauna |
| `calendar/page.tsx` + `calendar-page-view.tsx` | Shell + agenda |

**Verificação:** `npm run typecheck` · `npm run build`

| Rota | Baseline (F17) | Após F19l |
|------|----------------|-----------|
| `/studies/fauna` | ~357 kB | **147 kB** (−210 kB) |
| `/calendar` | ~358 kB | **147 kB** (−211 kB) |
| Shared | 92,4 kB | **92,4 kB** |

**Próximo candidato F19m:** rotas fauna em `/studies/fauna/*` (~341 kB), `/ai-lab/automations` (~333 kB).

### F19m — sub-rotas fauna (estudos) e AI Lab lazy ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `studies/fauna/*/page.tsx` (12 rotas) | Formulários via `dynamic()` |
| `ai-lab/automations/page.tsx` + `ai-lab-automations-view.tsx` | Shell + painel automações |

**Verificação:** `npm run typecheck` · `npm run build`

| Rota | Baseline (F17) | Após F19m |
|------|----------------|-----------|
| `/studies/fauna/inventario` | ~341 kB | **296 kB** (−45 kB) |
| `/studies/fauna/monitoramento` | ~341 kB | **296 kB** (−45 kB) |
| `/studies/fauna/resgate` | ~341 kB | **296 kB** (−45 kB) |
| `/studies/fauna/*-relatorio` | ~327 kB | **296–297 kB** (−30 kB) |
| `/ai-lab/automations` | ~335 kB | **147 kB** (−188 kB) |
| Shared | 92,4 kB | **92,4 kB** |

**Próximo candidato F19n:** `/` (~319 kB), `/analise-ambiental` já feito — auditar rotas ~300 kB restantes.

### F19n — home e CRM hub lazy views ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `(app)/page.tsx` + `dashboard-router-view.tsx` | Shell + roteador de painéis por role |
| `crm/page.tsx` + `crm-hub-view.tsx` | Shell + pipeline/kanban CRM |

**Verificação:** `npm run typecheck` · `npm run build`

| Rota | Baseline (F17) | Após F19n |
|------|----------------|-----------|
| `/` | ~320 kB | **95.5 kB** |
| `/crm` | ~311 kB | **147 kB** |

**Próximo candidato F19o:** `/car` (~341 kB), `/financial/abc-curve` (~344 kB).

### F19o — CAR e curva ABC lazy views ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `car/page.tsx` + `car-list-view.tsx` | Shell + listagem/upload CAR |
| `financial/abc-curve/page.tsx` + `abc-curve-view.tsx` | Shell + análise ABC (charts já lazy) |

**Verificação:** `npm run typecheck` · `npm run build`

| Rota | Baseline (F17) | Após F19o |
|------|----------------|-----------|
| `/car` | ~342 kB | **147 kB** |
| `/financial/abc-curve` | ~344 kB | **147 kB** |

**Próximo candidato F19p:** `/crm/opportunities` (~312 kB), `/financial/abc-fornecedores` (~307 kB).

### F19p — oportunidades CRM e ABC fornecedores lazy views ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `crm/opportunities/page.tsx` + `crm-opportunities-view.tsx` | Shell + pipeline de oportunidades |
| `financial/abc-fornecedores/page.tsx` + `abc-fornecedores-view.tsx` | Shell + curva ABC fornecedores |

**Verificação:** `npm run typecheck` · `npm run build`

| Rota | Baseline (F17) | Após F19p |
|------|----------------|-----------|
| `/crm/opportunities` | ~312 kB | **147 kB** |
| `/financial/abc-fornecedores` | ~307 kB | **147 kB** |

**Próximo candidato F19q:** `/financial/abc-servicos` (~306 kB), `/crm/reports` (~322 kB).

### F19q — ABC serviços e relatórios CRM lazy views ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `financial/abc-servicos/page.tsx` + `abc-servicos-view.tsx` | Shell + curva ABC serviços |
| `crm/reports/page.tsx` + `crm-reports-view.tsx` | Shell + relatórios CRM |

**Verificação:** `npm run typecheck` · `npm run build`

| Rota | Baseline (F17) | Após F19q |
|------|----------------|-----------|
| `/financial/abc-servicos` | ~306 kB | **147 kB** |
| `/crm/reports` | ~322 kB | **147 kB** |

**Próximo candidato F19r:** rotas ~300 kB restantes (`/audit-log`, `/carteira`, `/consultas`, georeferenciamento hub).

### F19r — audit-log, carteira e consultas lazy views ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `audit-log/page.tsx` + `audit-log-view.tsx` | Shell + log de auditoria |
| `carteira/page.tsx` + `carteira-view.tsx` | Shell + carteira consultor/cliente |
| `consultas/page.tsx` + `consultas-view.tsx` | Shell + hub de consultas |

**Verificação:** `npm run typecheck` · `npm run build`

| Rota | Baseline (F17) | Após F19r |
|------|----------------|-----------|
| `/audit-log` | ~323 kB | TBD |
| `/carteira` | ~306 kB | TBD |
| `/consultas` | ~306 kB | TBD |

**Próximo candidato F19s:** rotas georeferenciamento (~329–330 kB), `gestao-processos/tarefas` (~397 kB).
