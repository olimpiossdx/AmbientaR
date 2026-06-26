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
| `/audit-log` | ~323 kB | **147 kB** |
| `/carteira` | ~306 kB | **147 kB** |
| `/consultas` | ~306 kB | **147 kB** |

**Próximo candidato F19s:** rotas georeferenciamento (~329–330 kB), `gestao-processos/tarefas` (~397 kB).

### F19s — georeferenciamento sub-rotas lazy ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `georeferenciamento/{ambiental,campo,documentos,registro,rural,urbano,validacoes}/page.tsx` | `GeorefSectionPage` em `dynamic()` |
| `georeferenciamento/processos/page.tsx` | `GeorefProjectsPanel` lazy |
| `georeferenciamento/historico-car/` | Shell + `historico-car-view.tsx` |

**Verificação:** `npm run typecheck` · `npm run build`

| Rota | Baseline (F17) | Após F19s |
|------|----------------|-----------|
| `/georeferenciamento/ambiental` | ~330 kB | **152 kB** |
| `/georeferenciamento/campo` | ~330 kB | **152 kB** |
| `/georeferenciamento/documentos` | ~329 kB | **151 kB** |
| `/georeferenciamento/registro` | ~329 kB | **151 kB** |
| `/georeferenciamento/rural` | ~329 kB | **151 kB** |
| `/georeferenciamento/urbano` | ~329 kB | **151 kB** |
| `/georeferenciamento/validacoes` | ~329 kB | **150 kB** |
| `/georeferenciamento/processos` | ~322 kB | **147 kB** |
| `/georeferenciamento/historico-car` | ~324 kB | **147 kB** |

**Próximo candidato F19t:** `georeferenciamento/processos/[id]` (~497 kB), `gestao-processos/tarefas` (~397 kB), `gestao-processos/planilha` (~540 kB).

### F19t — georef detalhe e gestão processos lazy ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `georeferenciamento/processos/[id]/` | Shell + `georef-processo-detail-view.tsx` |
| `gestao-processos/planilha/` | Shell + `gestao-processos-planilha-view.tsx` |
| `gestao-processos/tarefas/page.tsx` | `GestaoProcessosTarefasView` em `dynamic()` |

**Verificação:** `npm run typecheck` · `npm run build`

| Rota | Baseline (F17) | Após F19t |
|------|----------------|-----------|
| `/georeferenciamento/processos/[id]` | ~498 kB | **147 kB** |
| `/gestao-processos/planilha` | ~540 kB | **149 kB** |
| `/gestao-processos/tarefas` | ~397 kB | **104 kB** |

**Próximo candidato F19u:** `financial/projetos-roi/[caseId]` (~583 kB), `gestao-processos/projetos` (~390 kB).

### F19u — ROI detalhe e projetos gestão lazy ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `financial/projetos-roi/[caseId]/` | Shell + `projetos-roi-detail-view.tsx` |
| `gestao-processos/projetos/` | Shell + `gestao-processos-projetos-view.tsx` |
| `gestao-processos/projetos/[id]/` | Shell + `consultoria-project-detail-view.tsx` |

**Verificação:** `npm run typecheck` · `npm run build`

| Rota | Baseline (F17) | Após F19u |
|------|----------------|-----------|
| `/financial/projetos-roi/[caseId]` | ~583 kB | **148 kB** |
| `/gestao-processos/projetos` | ~390 kB | **149 kB** |
| `/gestao-processos/projetos/[id]` | ~419 kB | **148 kB** |

**Próximo candidato F19v:** `inspections/new` e `inspections/[id]/edit` (~472 kB), `financial/projetos-roi` listagem (~339 kB).

### F19v — vistorias e ROI listagem lazy ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `inspections/new/` + `new-inspection-view.tsx` | Shell + formulário nova vistoria |
| `inspections/[id]/edit/` + `edit-inspection-view.tsx` | Shell + edição vistoria |
| `inspections/page.tsx` + `inspections-list-view.tsx` | Shell + listagem vistorias |
| `financial/projetos-roi/page.tsx` + `projetos-roi-list-view.tsx` | Shell + listagem ROI |

**Verificação:** `npm run typecheck` · `npm run build`

| Rota | Baseline (F17) | Após F19v |
|------|----------------|-----------|
| `/inspections/new` | ~472 kB | **148 kB** |
| `/inspections/[id]/edit` | ~473 kB | **148 kB** |
| `/inspections` | ~338 kB | **148 kB** |
| `/financial/projetos-roi` | ~339 kB | **148 kB** |

**Próximo candidato F19w:** rotas ~320–330 kB restantes (`inspections/reports`, `gestao-processos/indicadores`, hubs diversos).

### F19w — relatórios vistorias e indicadores gestão lazy ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `inspections/reports/` + `inspection-reports-view.tsx` | Shell + relatórios de campo |
| `gestao-processos/indicadores/page.tsx` | `GestaoProcessosIndicadoresView` lazy |
| `gestao-processos/indicadores/analise/page.tsx` | `GestaoProcessosIndicadoresAnaliseView` lazy |

**Verificação:** `npm run typecheck` · `npm run build`

| Rota | Baseline (F17) | Após F19w |
|------|----------------|-----------|
| `/inspections/reports` | ~328 kB | **148 kB** |
| `/gestao-processos/indicadores` | ~377 kB | **104 kB** |
| `/gestao-processos/indicadores/analise` | ~366 kB | **104 kB** |

**Próximo candidato F19x:** auditar rotas >250 kB restantes no build.

### F19x — painel financeiro e listagens operacionais lazy ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `financial/painel/` + `financial-painel-view.tsx` | Shell + painel financeiro |
| `intervencoes/` + `intervencoes-list-view.tsx` | Shell + listagem DAIA |
| `projects/` + `projects-list-view.tsx` | Shell + empreendimentos |
| `requests/` + `requests-list-view.tsx` | Shell + licenciamento |

**Verificação:** `npm run typecheck` · `npm run build`

| Rota | Baseline (F17) | Após F19x |
|------|----------------|-----------|
| `/financial/painel` | ~327 kB | **148 kB** |
| `/intervencoes` | ~389 kB | **148 kB** |
| `/projects` | ~323 kB | **148 kB** |
| `/requests` | ~328 kB | **148 kB** |

**Próximo candidato F19y:** rotas >400 kB (`studies/analise-socioambiental`, `outorgas`, `monitoring/manual`).

### F19y — rotas >400 kB lazy views ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `studies/analise-socioambiental/` + `analise-socioambiental-view.tsx` | Shell + hub ASA |
| `outorgas/` + `outorgas-list-view.tsx` | Shell + listagem outorgas |
| `monitoring/manual/` + `manual-monitoring-view.tsx` | Shell + lançamento manual |
| `multas-defesas/nova/` + `nova-multa-defesa-view.tsx` | Shell + novo trâmite multas |

**Verificação:** `npm run typecheck` · `npm run build`

| Rota | Baseline (F17) | Após F19y |
|------|----------------|-----------|
| `/studies/analise-socioambiental` | ~512 kB | **148 kB** |
| `/outorgas` | ~443 kB | **148 kB** |
| `/monitoring/manual` | ~433 kB | **148 kB** |
| `/multas-defesas/nova` | ~424 kB | **149 kB** |

**Próximo candidato F19z:** formulários interceptados ~380 kB (`licenses`, `invoices`, `outorgas/new`).

### F19z — formulários new/edit interceptados lazy ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `licenses/new/` + `new-license-view.tsx` | Shell + LicenseForm |
| `invoices/new/` + `new-invoice-view.tsx` | Shell + InvoiceForm |
| `outorgas/new/` + `new-outorga-view.tsx` | Shell + OutorgaForm |
| `multas-defesas/[id]/` + `multa-defesa-tramite-view.tsx` | Shell + trâmite multas |

**Verificação:** `npm run typecheck` · `npm run build`

| Rota | Baseline (F17) | Após F19z |
|------|----------------|-----------|
| `/licenses/new` | ~383 kB | **148 kB** |
| `/invoices/new` | ~381 kB | **148 kB** |
| `/outorgas/new` | ~435 kB | **148 kB** |
| `/multas-defesas/[id]` | ~437 kB | **148 kB** |

**Próximo candidato F20:** fechar auditoria pós-F19 — rotas intercept `(.)` e listagens ~300 kB CRM/AI Lab.

### F20 — intercept modals, CRM e AI Lab lazy ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `licenses/(.)new`, `(.)[id]/edit` | Shell + modal views |
| `invoices/(.)new`, `(.)[id]/edit` | Shell + modal views |
| `outorgas/(.)new`, `(.)[id]/edit` | Shell + modal views |
| `crm/{clients,proposals,team}/` | Shell + list views |
| `ai-lab/{rag,cloud-library,mcp}/` | Shell + panel views |

**Verificação:** `npm run typecheck` · `npm run build`

| Rota | Baseline (F17) | Após F20 |
|------|----------------|----------|
| `/licenses/(.)new` | ~384 kB | **150 kB** |
| `/invoices/(.)new` | ~381 kB | **150 kB** |
| `/outorgas/(.)new` | ~435 kB | **150 kB** |
| `/licenses/(.)[id]/edit` | ~384 kB | **150 kB** |
| `/invoices/(.)[id]/edit` | ~382 kB | **150 kB** |
| `/outorgas/(.)[id]/edit` | ~435 kB | **150 kB** |
| `/crm/clients` | ~300 kB | **148 kB** |
| `/crm/proposals` | ~300 kB | **148 kB** |
| `/crm/team` | ~300 kB | **148 kB** |
| `/ai-lab/rag` | ~300 kB | **148 kB** |
| `/ai-lab/cloud-library` | ~300 kB | **148 kB** |
| `/ai-lab/mcp` | ~298 kB | **148 kB** |

**Próximo candidato F20b:** `crm/alerts`, `crm/settings`, `studies/outorgas/new`, intercept studies `(.)`.

### F20b — CRM restante, outorgas estudos e intercept PCA/RCA lazy ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `crm/alerts/`, `crm/settings/` | Shell + views |
| `studies/outorgas/new/` | Shell + modo de uso picker |
| `studies/pca/(.)new`, `(.)[id]/edit` | Shell + modal views |
| `studies/rca/(.)new`, `(.)[id]/edit` | Shell + modal views |

**Verificação:** `npm run typecheck` · `npm run build`

| Rota | Baseline (F17) | Após F20b |
|------|----------------|-----------|
| `/crm/alerts` | ~299 kB | **148 kB** |
| `/crm/settings` | ~299 kB | **148 kB** |
| `/studies/outorgas/new` | ~315 kB | **149 kB** |
| `/studies/pca/(.)new` | ~558 kB | **150 kB** |
| `/studies/pca/(.)[id]/edit` | ~559 kB | **150 kB** |
| `/studies/rca/(.)new` | ~482 kB | **150 kB** |
| `/studies/rca/(.)[id]/edit` | ~482 kB | **150 kB** |

**Próximo candidato F20c:** intercept studies restantes (`pia`, `prada`, `ptrf`, `eia-rima`).

### F20c — intercept PIA, PRADA, PTRF e EIA-RIMA lazy ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `studies/pia/(.)new`, `(.)[id]/edit` | Shell + modal views |
| `studies/prada/(.)new`, `(.)[id]/edit` | Shell + modal views |
| `studies/ptrf/(.)new`, `(.)[id]/edit` | Shell + modal views |
| `studies/eia-rima/(.)new`, `(.)[id]/edit` | Shell + modal views |

**Verificação:** `npm run typecheck` · `npm run build`

| Rota | Baseline (F17) | Após F20c |
|------|----------------|-----------|
| `/studies/pia/(.)new` | ~381 kB | **150 kB** |
| `/studies/pia/(.)[id]/edit` | ~381 kB | **150 kB** |
| `/studies/prada/(.)new` | ~372 kB | **150 kB** |
| `/studies/prada/(.)[id]/edit` | ~372 kB | **150 kB** |
| `/studies/ptrf/(.)new` | ~339 kB | **150 kB** |
| `/studies/ptrf/(.)[id]/edit` | ~339 kB | **150 kB** |
| `/studies/eia-rima/(.)new` | ~339 kB | **150 kB** |
| `/studies/eia-rima/(.)[id]/edit` | ~339 kB | **150 kB** |

**Próximo candidato F20d:** `responsible-company/(.)`, `technical-responsible/(.)`, listagens ~320 kB restantes.

### F20d — empresa responsável, RT e listagens licenças/faturas/laudos lazy ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `responsible-company/(.)new`, `(.)[id]/edit` | Shell + modal views |
| `technical-responsible/(.)new`, `(.)[id]/edit` | Shell + modal views |
| `licenses/`, `invoices/`, `laudos/` | Shell + list views |

**Verificação:** `npm run typecheck` · `npm run build`

| Rota | Baseline (F17) | Após F20d |
|------|----------------|-----------|
| `/responsible-company/(.)new` | ~352 kB | **150 kB** |
| `/technical-responsible/(.)new` | ~333 kB | **151 kB** |
| `/licenses` | ~392 kB | **149 kB** |
| `/invoices` | ~396 kB | **149 kB** |
| `/laudos` | ~316 kB | **149 kB** |

**Próximo candidato F20e:** auditoria final — rotas >200 kB remanescentes no build.

### F20e — listagens restantes, telemetria, reporting, edit CRM/licenças/faturas lazy ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `responsible-company/`, `technical-responsible/`, `multas-defesas/` | Shell + list views |
| `monitoring/telemetric/` | Shell + `telemetric-monitoring-view` |
| `reporting/` | Shell + `reporting-view` |
| `licenses/[id]/edit`, `invoices/[id]/edit` | Shell + edit views |
| `crm/new`, `crm/[id]/edit` | Shell + CRM form views |

**Verificação:** `npm run typecheck` · `npm run build` (`build-f20e.log`)

| Rota | Baseline (F17) | Após F20e |
|------|----------------|-----------|
| `/responsible-company` | ~329 kB | **149 kB** |
| `/technical-responsible` | ~311 kB | **149 kB** |
| `/multas-defesas` | ~312 kB | **150 kB** |
| `/monitoring/telemetric` | ~421 kB | **149 kB** |
| `/reporting` | ~366 kB | **149 kB** |
| `/licenses/[id]/edit` | ~384 kB | **149 kB** |
| `/invoices/[id]/edit` | ~382 kB | **149 kB** |
| `/crm/new` | ~374 kB | **149 kB** |
| `/crm/[id]/edit` | ~375 kB | **149 kB** |

**Próximo candidato F20f:** rotas >200 kB remanescentes — `settings`, `users`, `outorgas/[id]/edit`, estudos (pca/rca new full page), `laudos/[id]`, financeiro pesado, etc.

### F20f — settings, users, outorgas edit, laudos e forms empresa/RT lazy ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `settings/`, `users/` | Shell + views |
| `outorgas/[id]/edit` | Shell + `edit-outorga-view` |
| `laudos/[id]`, `laudos/new` | Shell + detail/new views |
| `responsible-company/new`, `[id]/edit` | Shell + company form views |
| `technical-responsible/new`, `[id]/edit` | Shell + responsible form views |

**Verificação:** `npm run typecheck` · `npm run build` (`build-f20f.log`)

| Rota | Baseline (F17) | Após F20f |
|------|----------------|-----------|
| `/settings` | ~331 kB | **149 kB** |
| `/users` | ~422 kB | **149 kB** |
| `/outorgas/[id]/edit` | ~435 kB | **149 kB** |
| `/laudos/[id]` | ~321 kB | **149 kB** |
| `/laudos/new` | ~312 kB | **149 kB** |
| `/responsible-company/new` | ~353 kB | **149 kB** |
| `/responsible-company/[id]/edit` | ~354 kB | **149 kB** |
| `/technical-responsible/new` | ~334 kB | **149 kB** |
| `/technical-responsible/[id]/edit` | ~334 kB | **149 kB** |

**Próximo candidato F20g:** sub-rotas `settings/*` (~300–347 kB), `oficios`, `mtr-declaracao`, `usos-insignificantes`, estudos full-page (`studies/pca/new`, `studies/rca/new`), financeiro (`financial/dre-contabil`, `bens-patrimonio`), CRUD genéricos ~298 kB (`clients`, `contracts`, etc.).

### F20g — settings sub-rotas, ofícios, MTR, usos insignificantes e financeiro patrimonial lazy ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `settings/company`, `templates`, `onedrive-integration`, `deleted-backups`, `ai-local-source` | Shell + views |
| `oficios/`, `oficios/new`, `oficios/[id]/edit` | Shell + views |
| `mtr-declaracao/`, `usos-insignificantes/` | Shell + views |
| `financial/bens-patrimonio/`, `new`, `[id]/edit`, `financial/dre-contabil` | Shell + views |

**Verificação:** `npm run typecheck` · `npm run build` (`build-f20g.log`; limpar `.next` com `node scripts/clean-next-dev.mjs` se dev turbo corromper cache)

| Rota | Baseline (F17) | Após F20g |
|------|----------------|-----------|
| `/settings/company` | ~347 kB | **149 kB** |
| `/settings/templates` | ~330 kB | **149 kB** |
| `/settings/onedrive-integration` | ~310 kB | **149 kB** |
| `/settings/deleted-backups` | ~303 kB | **149 kB** |
| `/settings/ai-local-source` | ~299 kB | **149 kB** |
| `/oficios` | ~340 kB | **149 kB** |
| `/oficios/new` | ~366 kB | **149 kB** |
| `/oficios/[id]/edit` | ~366 kB | **149 kB** |
| `/mtr-declaracao` | ~362 kB | **149 kB** |
| `/usos-insignificantes` | ~446 kB | **150 kB** |
| `/financial/bens-patrimonio` | ~328 kB | **149 kB** |
| `/financial/bens-patrimonio/new` | ~381 kB | **149 kB** |
| `/financial/bens-patrimonio/[id]/edit` | ~381 kB | **149 kB** |
| `/financial/dre-contabil` | ~343 kB | **149 kB** |

**Próximo candidato F20h:** estudos full-page (`studies/pca/new`, `studies/rca/new`, `studies/inventario/[id]`), CRUD ~298 kB (`clients`, `contracts`, `empreendedores`, `projects`), `requests/*`, `knowledge-sources`, financeiro restante (`conciliacao`, `orcamento`, etc.).

### F20h — CRUD cadastros, requests, knowledge-sources, financeiro e PCA/RCA new lazy ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `clients/new`, `[id]/edit` | Shell + views |
| `contracts/[id]/edit` | Shell + view |
| `empreendedores/new`, `[id]/edit` | Shell + views |
| `projects/new`, `[id]/edit` | Shell + views |
| `knowledge-sources/`, `new`, `[id]` | Shell + views |
| `requests/new`, `[id]/edit`, `[id]/aia` | Shell + views |
| `financial/conciliacao`, `orcamento`, `billing-debug`, `fluxo-projetado`, `export-contabil`, `platform-subscription-contracts` | Shell + views |
| `studies/pca/new`, `studies/rca/new` | Shell + views |

**Verificação:** `npm run typecheck` · `npm run build` (`build-f20h.log`)

| Rota | Baseline (F17) | Após F20h |
|------|----------------|-----------|
| `/clients/new` | ~299 kB | **150 kB** |
| `/clients/[id]/edit` | ~298 kB | **150 kB** |
| `/contracts/[id]/edit` | ~298 kB | **150 kB** |
| `/empreendedores/new` | ~300 kB | **150 kB** |
| `/empreendedores/[id]/edit` | ~300 kB | **150 kB** |
| `/projects/new` | ~300 kB | **150 kB** |
| `/projects/[id]/edit` | ~300 kB | **150 kB** |
| `/knowledge-sources` | ~309 kB | **150 kB** |
| `/knowledge-sources/new` | ~332 kB | **150 kB** |
| `/knowledge-sources/[id]` | ~308 kB | **150 kB** |
| `/requests/new` | ~363 kB | **150 kB** |
| `/requests/[id]/edit` | ~427 kB | **150 kB** |
| `/requests/[id]/aia` | ~346 kB | **150 kB** |
| `/financial/conciliacao` | ~300 kB | **150 kB** |
| `/financial/orcamento` | ~299 kB | **150 kB** |
| `/financial/billing-debug` | ~299 kB | **150 kB** |
| `/financial/fluxo-projetado` | ~300 kB | **150 kB** |
| `/financial/export-contabil` | ~308 kB | **150 kB** |
| `/financial/platform-subscription-contracts` | ~299 kB | **150 kB** |
| `/studies/pca/new` | ~578 kB | **150 kB** |
| `/studies/rca/new` | ~500 kB | **150 kB** |

**Próximo candidato F20i:** estudos restantes (`studies/inventario/[id]` ~548 kB, `pca/[id]/edit` ~559 kB, hub pages ~340–400 kB), `consultas/*`, `services`/`suppliers`, `register`, módulo fiscal-ambiental (~260 kB).

### F20i — consultas, services, suppliers, register, inventário PCA/RCA lazy ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `consultas/new`, `[id]`, `[id]/edit` | Shell + views |
| `services/`, `new`, `[id]/edit` | Shell + views |
| `suppliers/`, `new`, `[id]/edit` | Shell + views |
| `register/` | Shell + view |
| `studies/inventario/`, `[id]` | Shell + views |
| `studies/pca/`, `[id]/edit` | Shell + views |
| `studies/rca/`, `[id]/edit` | Shell + views |

**Verificação:** `npm run typecheck` · `npm run build` (`build-f20i.log`)

| Rota | Baseline (F17) | Após F20i |
|------|----------------|-----------|
| `/consultas/new` | ~313 kB | **150 kB** |
| `/consultas/[id]` | ~308 kB | **150 kB** |
| `/consultas/[id]/edit` | ~314 kB | **150 kB** |
| `/services` | ~302 kB | **150 kB** |
| `/services/new` | ~324 kB | **150 kB** |
| `/services/[id]/edit` | ~324 kB | **150 kB** |
| `/suppliers` | ~302 kB | **150 kB** |
| `/suppliers/new` | ~332 kB | **150 kB** |
| `/suppliers/[id]/edit` | ~332 kB | **150 kB** |
| `/register` | ~326 kB | **98 kB** |
| `/studies/inventario` | ~357 kB | **150 kB** |
| `/studies/inventario/[id]` | ~549 kB | **107 kB** (shell; sub-rotas ainda pesadas) |
| `/studies/pca` | ~339 kB | **150 kB** |
| `/studies/pca/[id]/edit` | ~559 kB | **150 kB** |
| `/studies/rca` | ~339 kB | **150 kB** |
| `/studies/rca/[id]/edit` | ~482 kB | **150 kB** |

**Próximo candidato F20j:** sub-rotas inventário (`especies` ~477 kB, `parcelas` ~367 kB, `calculadora` ~316 kB, `formulas` ~298 kB), hubs estudos restantes (~340–400 kB), `configuracoes/mcp-rag` (~326 kB), fiscal-ambiental (~260 kB), fauna studies (~298 kB).

### F20j — inventário sub-rotas, mcp-rag e fauna studies lazy ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `studies/inventario/[id]/arvores`, `calculadora`, `especies`, `formulas`, `parcelas`, `resultado/[runId]` | Shell + views |
| `configuracoes/mcp-rag` | `dynamic()` do `McpRagHub` |
| `studies/fauna/inventario`, `inventario-relatorio`, `monitoramento`, `monitoramento-relatorio`, `resgate`, `resgate-relatorio` (+ `[id]`) | Shell + views |

**Verificação:** `npm run typecheck` · `npm run build` (`build-f20j.log`)

| Rota | Baseline (F17) | Após F20j |
|------|----------------|-----------|
| `/studies/inventario/[id]/arvores` | ~289 kB | **107 kB** |
| `/studies/inventario/[id]/calculadora` | ~316 kB | **107 kB** |
| `/studies/inventario/[id]/especies` | ~477 kB | **107 kB** |
| `/studies/inventario/[id]/formulas` | ~298 kB | **107 kB** |
| `/studies/inventario/[id]/parcelas` | ~367 kB | **107 kB** |
| `/studies/inventario/[id]/resultado/[runId]` | ~290 kB | **107 kB** |
| `/configuracoes/mcp-rag` | ~326 kB | **151 kB** |
| `/studies/fauna/inventario` | ~299 kB | **150 kB** |
| `/studies/fauna/inventario/[id]` | ~299 kB | **150 kB** |
| `/studies/fauna/inventario-relatorio` | ~300 kB | **150 kB** |
| `/studies/fauna/inventario-relatorio/[id]` | ~299 kB | **150 kB** |
| `/studies/fauna/monitoramento` (+ `[id]`, relatórios) | ~299–300 kB | **150 kB** |
| `/studies/fauna/resgate` (+ `[id]`, relatórios) | ~299–300 kB | **150 kB** |

**Próximo candidato F20k:** hubs estudos pesados (`studies/assistant` ~356 kB, `barragem`/`cavidades` ~344–438 kB, `educacao-ambiental` ~362–524 kB, `eia-rima` ~340–387 kB), fiscal-ambiental (`dashboard` ~268 kB, `workspace/[id]` ~261 kB), `gestao-processos/fluxo` (~260 kB), rotas ~299 kB restantes (`carteira/[clientId]`, `cash-flow/[id]/edit`, `commercial-proposals/[id]/edit`, etc.).

### F20k — hubs estudos, fiscal-ambiental, fluxo e rotas ~300 kB lazy ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `studies/assistant` | Shell + view |
| `studies/barragem/`, `new`, `[id]/edit` | Shell + views |
| `studies/cavidades/`, `new`, `[id]/edit` | Shell + views |
| `studies/educacao-ambiental/`, `novo`, `[id]/edit`, `dispensas/[id]`, `solicitar-dispensa` | Shell + views |
| `studies/eia-rima/`, `new`, `[id]/edit` | Shell + views |
| `gestao-processos/fluxo` | Shell + view |
| `ia/fiscal-ambiental-digital/dashboard`, `configuracoes`, `workspace/[workspaceId]` | `dynamic()` dos client components |
| `carteira/[clientId]`, `cash-flow/[id]/edit`, `commercial-proposals/[id]/edit` | Shell + views |
| `documentos-ambientais/pasta-cliente`, `external` | Shell + views |

**Verificação:** `npm run typecheck` · `npm run build` (`build-f20k.log`; `node scripts/clean-next-dev.mjs` antes do build se dev turbo corromper cache)

| Rota | Baseline (F17) | Após F20k |
|------|----------------|-----------|
| `/studies/assistant` | ~357 kB | **151 kB** |
| `/studies/barragem` | ~356 kB | **151 kB** |
| `/studies/barragem/new` | ~413 kB | **151 kB** |
| `/studies/barragem/[id]/edit` | ~439 kB | **151 kB** |
| `/studies/cavidades` | ~345 kB | **151 kB** |
| `/studies/cavidades/new` | ~409 kB | **151 kB** |
| `/studies/cavidades/[id]/edit` | ~430 kB | **151 kB** |
| `/studies/educacao-ambiental` | ~362 kB | **151 kB** |
| `/studies/educacao-ambiental/novo` | ~451 kB | **151 kB** |
| `/studies/educacao-ambiental/[id]/edit` | ~462 kB | **151 kB** |
| `/studies/educacao-ambiental/dispensas/[id]` | ~524 kB | **151 kB** |
| `/studies/educacao-ambiental/solicitar-dispensa` | ~517 kB | **151 kB** |
| `/studies/eia-rima` | ~340 kB | **151 kB** |
| `/studies/eia-rima/new` | ~388 kB | **151 kB** |
| `/studies/eia-rima/[id]/edit` | ~340 kB | **151 kB** |
| `/gestao-processos/fluxo` | ~260 kB | **108 kB** |
| `/ia/fiscal-ambiental-digital/dashboard` | ~269 kB | **151 kB** |
| `/ia/fiscal-ambiental-digital/configuracoes` | ~260 kB | **151 kB** |
| `/ia/fiscal-ambiental-digital/workspace/[workspaceId]` | ~262 kB | **108 kB** |
| `/carteira/[clientId]` | ~309 kB | **151 kB** |
| `/cash-flow/[id]/edit` | ~300 kB | **151 kB** |
| `/commercial-proposals/[id]/edit` | ~299 kB | **151 kB** |
| `/documentos-ambientais/pasta-cliente` | ~300 kB | **151 kB** |
| `/external` | ~299 kB | **151 kB** |

**Próximo candidato F20l:** estudos restantes (`compensacao-ambiental/[tipo]` ~328 kB, `seguranca-barragens`, `piscinao-off-stream`, `procuracao`, `outorgas/processo`, `las-ras`, `relatorios-diversos`), fiscal-ambiental sub-rotas (~177–193 kB), `forgot-password`/`login` (~293 kB), hubs georeferenciamento se necessário.

### F20l — estudos restantes, fiscal sub-rotas e auth lazy ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `studies/compensacao-ambiental/[tipo]` | Shell + view |
| `studies/seguranca-barragens/`, `new`, `[id]/edit` | Shell + views |
| `studies/piscinao-off-stream/`, `new`, `[id]/edit` | Shell + views |
| `studies/procuracao/`, `new`, `[id]/edit` | Shell + views |
| `studies/outorgas/processo/[id]` | Shell + view |
| `studies/las-ras/`, `new`, `[id]/edit` | Shell + views |
| `studies/relatorios-diversos/carvao-vegetal`, `ptrf-prad`, `transporte-residuos` | Shell + views |
| `ia/fiscal-ambiental-digital/*` (11 sub-rotas) | `dynamic()` dos client components |
| `login`, `forgot-password` | Shell + views |

**Verificação:** `npm run typecheck` · `npm run build` (`build-f20l.log`)

| Rota | Baseline (F17) | Após F20l |
|------|----------------|-----------|
| `/studies/compensacao-ambiental/[tipo]` | ~329 kB | **152 kB** |
| `/studies/seguranca-barragens` | ~370 kB | **152 kB** |
| `/studies/seguranca-barragens/new` | ~368 kB | **152 kB** |
| `/studies/seguranca-barragens/[id]/edit` | ~393 kB | **152 kB** |
| `/studies/piscinao-off-stream` | ~363 kB | **152 kB** |
| `/studies/piscinao-off-stream/new` | ~357 kB | **152 kB** |
| `/studies/piscinao-off-stream/[id]/edit` | ~381 kB | **152 kB** |
| `/studies/procuracao` | ~351 kB | **152 kB** |
| `/studies/procuracao/new` | ~372 kB | **152 kB** |
| `/studies/procuracao/[id]/edit` | ~372 kB | **152 kB** |
| `/studies/outorgas/processo/[id]` | ~406 kB | **152 kB** |
| `/studies/las-ras` | ~352 kB | **152 kB** |
| `/studies/las-ras/new` | ~387 kB | **152 kB** |
| `/studies/las-ras/[id]/edit` | ~386 kB | **152 kB** |
| `/studies/relatorios-diversos/carvao-vegetal` | ~362 kB | **152 kB** |
| `/studies/relatorios-diversos/ptrf-prad` | ~377 kB | **152 kB** |
| `/studies/relatorios-diversos/transporte-residuos` | ~383 kB | **152 kB** |
| `/ia/fiscal-ambiental-digital/biblioteca` … `relatorios` | ~178–193 kB | **152 kB** |
| `/ia/fiscal-ambiental-digital/workspace/novo` | ~150 kB | **109 kB** |
| `/login` | ~294 kB | **108 kB** |
| `/forgot-password` | ~294 kB | **108 kB** |

**Próximo candidato F20m:** estudos ainda pesados (`studies/pia`, `prada`, `ptrf`, `reanalise`, `mapas`, `mtr`, hub `outorgas`, `outorgas/[id]/edit`), hub `compensacao-ambiental` (~167 kB), georeferenciamento (~154–164 kB).

### F20m — PIA/PRADA/PTRF, reanálise, mapas MCA, MTR, outorgas, georef lazy ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `studies/pia/`, `new`, `[id]/edit` | Shell + views |
| `studies/prada/`, `new`, `[id]/edit` | Shell + views |
| `studies/ptrf/`, `new`, `[id]/edit` | Shell + views |
| `studies/reanalise/`, `new`, `[id]/edit` | Shell + views |
| `studies/mapas` | Shell + `dynamic(McaWorkbench)` |
| `studies/mtr` | Shell + view |
| `studies/outorgas/`, `[id]/edit` | Shell + views |
| `studies/compensacao-ambiental` (hub) | Shell + view |
| `georeferenciamento/` (hub + 12 sub-rotas) | Shell + views |
| `georeferenciamento/processos/[id]` | View restaurada (conteúdo real; shell já existia) |

**Verificação:** `npm run typecheck` · `npm run build` (`build-f20m.log`)

| Rota | Baseline (F20l) | Após F20m |
|------|-----------------|-----------|
| `/studies/mapas` | ~405 kB | **152 kB** |
| `/studies/pia` | ~358 kB | **152 kB** |
| `/studies/pia/new` | ~384 kB | **152 kB** |
| `/studies/pia/[id]/edit` | ~416 kB | **152 kB** |
| `/studies/prada` | ~346 kB | **152 kB** |
| `/studies/prada/new`, `[id]/edit` | ~375 kB | **152 kB** |
| `/studies/ptrf` | ~341 kB | **152 kB** |
| `/studies/ptrf/new`, `[id]/edit` | ~342 kB | **152 kB** |
| `/studies/reanalise` | ~353 kB | **152 kB** |
| `/studies/reanalise/new` | ~372 kB | **152 kB** |
| `/studies/reanalise/[id]/edit` | ~369 kB | **152 kB** |
| `/studies/mtr` | ~300 kB | **152 kB** |
| `/studies/outorgas` | ~330 kB | **152 kB** |
| `/studies/outorgas/[id]/edit` | ~360 kB | **152 kB** |
| `/studies/compensacao-ambiental` (hub) | ~167 kB | **152 kB** |
| `/georeferenciamento` | ~164 kB | **152 kB** |
| `/georeferenciamento/*` (sub-rotas) | ~152–156 kB | **152 kB** |

**Próximo candidato F20n:** rotas ainda acima de ~152 kB — `studies/barragens` (~163 kB), `bank-access` (~163 kB), `settings/files` (~162 kB), `settings/appearance` (~159 kB), `gestao-processos/planilha` e `projetos` (~154 kB); intercept modals `(.)*` permanecem ~153 kB (fora de escopo).

### F20n — barragens hub, bank-access, settings, social-media, gestão processos ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `studies/barragens` | Shell + `barragens-hub-view` |
| `bank-access` | Shell + `bank-access-view` |
| `settings/files` | Shell + `settings-files-view` |
| `settings/appearance` | Shell + `appearance-view` |
| `social-media` | Shell + `social-media-view` (153 kB residual) |
| `gestao-processos/planilha`, `projetos` | Removido import estático de `gestao-processos-menu` no shell (puxava Lucide) |

**Verificação:** `npm run typecheck` · `npm run build` (`build-f20n.log`)

| Rota | Baseline (F20m) | Após F20n |
|------|-----------------|-----------|
| `/studies/barragens` | ~163 kB | **152 kB** |
| `/bank-access` | ~163 kB | **152 kB** |
| `/settings/files` | ~162 kB | **152 kB** |
| `/settings/appearance` | ~159 kB | **152 kB** |
| `/social-media` | ~153 kB | **152 kB** |
| `/gestao-processos/planilha` | ~154 kB | **152 kB** |
| `/gestao-processos/projetos` | ~154 kB | **152 kB** |

**Próximo candidato F20o:** rotas residuais ~153 kB — `cash-flow/new`, `multas-defesas` (+ `[id]`, `nova`), `commercial-proposals/new`, `contracts/new`; intercept modals `(.)*` ~153–154 kB (fora de escopo).

### F20o — formulários new e multas-defesas lazy ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `cash-flow/new` | Shell + `new-cash-flow-view` |
| `commercial-proposals/new` | Shell + `new-commercial-proposal-view` |
| `contracts/new` | Shell + `new-contract-view` |
| `multas-defesas/`, `[id]`, `nova` | Strings literais no skeleton (sem import de menu) |

**Verificação:** `npm run typecheck` · `npm run build` (`build-f20o.log`)

| Rota | Baseline (F20n) | Após F20o |
|------|-----------------|-----------|
| `/cash-flow/new` | ~153 kB | **152 kB** |
| `/commercial-proposals/new` | ~153 kB | **152 kB** |
| `/contracts/new` | ~153 kB | **152 kB** |
| `/multas-defesas` | ~153 kB | **152 kB** |
| `/multas-defesas/[id]` | ~153 kB | **152 kB** |
| `/multas-defesas/nova` | ~153 kB | **152 kB** |

**Estado F20 (lazy full-page):** todas as rotas full-page auditadas estão em **152 kB** First Load JS (shared ~98.6 kB + shell ~4.6 kB). Resíduo ~153–154 kB apenas em **intercept modals** `(.)*` — fora de escopo do padrão conservador (já ~153 kB antes de F20).

### F20p — intercept modals `(.)*`: fallback leve nos shells ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `src/components/intercept-modal-loading.tsx` | Fallback mínimo (Skeleton) — sem Dialog/form-shell |
| 22 shells `(.)new` / `(.)[id]/edit` | Substituído `*FormModalSuspenseFallback` por `InterceptModalLoading` no `dynamic()` loading |

**Verificação:** `npm run typecheck` · `npm run build` (`build-f20p.log`)

| Rota | Baseline (F20o) | Após F20p |
|------|-----------------|-----------|
| `/invoices/(.)new`, `(.)[id]/edit` | ~153 kB | **109 kB** |
| `/licenses/(.)new`, `(.)[id]/edit` | ~153 kB | **109 kB** |
| `/outorgas/(.)new`, `(.)[id]/edit` | ~154 kB | **109 kB** |
| `/responsible-company/(.)*`, `/technical-responsible/(.)*` | ~153–154 kB | **109 kB** |
| `/studies/{pia,prada,ptrf,pca,rca,eia-rima}/(.)*` | ~153–154 kB | **109 kB** |

**Nota:** First Load JS dos intercepts desce para ~109 kB (shared auth layout + shell ~2.3 kB); o formulário modal carrega no chunk lazy ao abrir. Fallback rico (`Dialog`) permanece nos `*-modal-view` (Suspense interno).

**Próximo candidato F20q:** `/canais` (~153 kB) — única rota full-page residual acima de 152 kB pós-F20p.

### F20q — canais lazy ✅ (2026-06-25)

| Ficheiro | Mudança |
|----------|---------|
| `canais/` | Shell + `canais-view` |

**Verificação:** `npm run typecheck` · `npm run build` (`build-f20q.log`)

| Rota | Baseline (F20p) | Após F20q |
|------|-----------------|-----------|
| `/canais` | ~153 kB | **152 kB** |

**Estado F20 (fechamento):** auditoria lazy-load concluída — rotas full-page em **152 kB**, intercept modals `(.)*` em **~109 kB** First Load JS. Bloco F20 encerrado.

### Revalidação F20q — comparativo final (2026-06-25)

Comandos: `npm run typecheck` · `npm run build` (`build-f20q.log`) · `npm run perf:check`.

| Métrica | Baseline (F17) | Revalidação 2026-06-25 (pré-F20) | Após F20q |
|---------|----------------|----------------------------------|-----------|
| Shared First Load (app) | 91,3 kB | 91,8 kB | **98,6 kB** |
| `/` (dashboard) | 316 kB | 316 kB | **101 kB** |
| `/login` | 288 kB | 288 kB | **109 kB** |
| `/analise-ambiental` | 464 kB | 446 kB | **152 kB** |
| `/licenses` (lista) | 387 kB | 389 kB | **152 kB** |
| `/licenses/new` | 378 kB | 380 kB | **152 kB** |
| `/studies/mapas` | — | ~405 kB | **152 kB** |
| `/licenses/(.)new` | ~384 kB | ~150 kB | **109 kB** |
| Rotas full-page máx. | >580 kB | >300 kB | **152 kB** |

**Conclusão:** F19–F20q reduziram rotas pesadas para shells ~4,6 kB + shared; conteúdo pesado em chunks lazy (`ssr: false`). Shared subiu ~7 kB vs F17 (layout/providers acumulados) — meta &lt;88 kB shared continua fora de alcance sem refactor estrutural do shell. Intercept modals: fallback leve (`InterceptModalLoading`) evita puxar `*-form-shell` no First Load JS.
