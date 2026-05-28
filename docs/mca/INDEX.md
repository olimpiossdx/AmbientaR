# MCA — Índice de documentação

**Ponto de entrada:** [`PLANO-EXECUTIVO.md`](PLANO-EXECUTIVO.md) (plano único com auditoria + debugger por fase).

---

## Documentos no repositório

| Documento | Função |
|-----------|--------|
| [**PLANO-EXECUTIVO.md**](PLANO-EXECUTIVO.md) | Plano mestre operacional: contexto, auditoria, 15 fases com debugger |
| [PLANO-MAESTRO.md](PLANO-MAESTRO.md) | Visão Cartographic OS v1–v5, pilares, roadmap |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Arquitetura técnica (camadas, cache, tiles, export, aceite) |
| [IMPLEMENTATION-SPEC.md](IMPLEMENTATION-SPEC.md) | Contrato de código v1/v2 |
| [ETAPAS.md](ETAPAS.md) | Tabela resumo das 15 etapas |
| [TESTING.md](TESTING.md) | Roteiro UI + CLI + erros frequentes |
| [REFERENCIA-PIMENTA.md](REFERENCIA-PIMENTA.md) | Padrão visual Pimenta / Célio Fontana |
| [CAD-LAYER-CATALOG.md](CAD-LAYER-CATALOG.md) | Mapeamento layer CAD → agent_id |
| [gold/README.md](gold/README.md) | Mapas ouro (benchmark) |
| [gold/gold_*/manifest.json](gold/) | Manifests Palmeiras, Mangabeiras, Catingueiro |

### Relatórios de debugger (`debug-reports/`)

| Ficheiro | Etapa | Estado documentado |
|----------|-------|-------------------|
| E01-pass.md | E01 | PASS (spec) |
| E02-pass.md | E02 | PASS (health) |
| E03-pass.md | E03 | PASS (DAG) |
| E04-pass.md | E04 | PASS (UI CRUD) |
| E05-pass.md … E14-pass.md | E05–E14 | Templates — preencher após QA |
| [IMPORT-LAYERS.md](IMPORT-LAYERS.md) | Guia import CAD |
| [examples/layers-import-exemplo.json](examples/layers-import-exemplo.json) | Exemplo import |
| E15-pass.md | E15 | PASS estrutural (pipeline); **benchmark Catingueiro pendente** |

---

## Planos Cursor (`.cursor/plans/`)

| Ficheiro | Conteúdo |
|----------|----------|
| [mca_motor_cartográfico_a1071e68.plan.md](../../.cursor/plans/mca_motor_cartográfico_a1071e68.plan.md) | Índice + todos Cursor |
| [mca_refinamento_cartográfico_8aa68742.plan.md](../../.cursor/plans/mca_refinamento_cartográfico_8aa68742.plan.md) | Refinamento enterprise (~960 linhas) |

---

## Código principal

| Área | Caminho |
|------|---------|
| UI | `src/app/(app)/studies/mapas/mca-workbench.tsx` |
| Export legado | `src/app/(app)/studies/mapas/mapas-legacy-export.tsx` |
| Orquestração | `src/lib/mca/orchestrator.ts` |
| Agentes | `src/lib/mca/agents/handlers.ts` |
| Registry | `infra/mca-engine/mca_agent_registry.yaml` |
| APIs | `src/app/api/mca/**` |
| Worker Python | `infra/mca-engine/` |
| Script debugger | `scripts/mca/verify-etapa.mjs` |
| Regras Firestore | `src/firebase/rules/firestore.rules` (`mca_projects`) |

---

## Comandos úteis

```bash
npm run dev
npm run mca:verify-etapa -- 01
npm run mca:verify-etapa -- 03
npm run mca:write-gold-perimeters
curl -s http://localhost:9002/api/mca/health
npm run deploy:rules
npm run typecheck
```
