---
name: MCA Cartographic OS
overview: "Plano mestre v6: fusão refinamento enterprise (8aa68742) + v1 implementado. Cartographic OS com Semantic→Spatial→Cartographic, stateful orchestrator, multi-grafo, PostGIS/cache/tiles, Behavior Registry, gold maps. Documentação completa em docs/mca/PLANO-MAESTRO.md."
todos:
  - id: v1-testing-guide
    content: "docs/mca/TESTING.md — guia UI+CLI completo"
    status: completed
  - id: v1-gold-manifests
    content: "docs/mca/gold/gold_*/manifest.json (Palmeiras, Mangabeiras, Catingueiro)"
    status: completed
  - id: v1-architecture-doc
    content: "docs/mca/ARCHITECTURE.md + PLANO-MAESTRO.md"
    status: completed
  - id: v1-spec-contract
    content: "IMPLEMENTATION-SPEC: contrato v2 + disciplina v1"
    status: completed
  - id: v1-finish-etapas
    content: "E02–E15: geo real, checksum, produces congelados; gate E15 Catingueiro manual"
    status: completed
  - id: v2-foundation
    content: "v2: semantic types, knowledge/, topology/, symbols/, scale/, behavior registry yaml, stateful orchestrator, layout JSON, review/"
    status: completed
  - id: v3-enterprise
    content: "v3: PostGIS, cache/, tiles/, mca-qgis-worker, export/, versioning"
    status: in_progress
  - id: v4-intelligence
    content: "v4: symbol intelligence, gold benchmark CI, learning, spatial memory"
    status: pending
  - id: v5-carto-os
    content: "v5: cognitivo, multi-tenant, CAR/passivo, scheduler distribuído"
    status: pending
isProject: false
---

# MCA — Cartographic OS (índice do plano v6)

> **Plano executivo (auditoria + 15 fases debugger):** [`docs/mca/PLANO-EXECUTIVO.md`](docs/mca/PLANO-EXECUTIVO.md)  
> **Índice de todos os docs:** [`docs/mca/INDEX.md`](docs/mca/INDEX.md)  
> **Visão Cartographic OS:** [`docs/mca/PLANO-MAESTRO.md`](docs/mca/PLANO-MAESTRO.md)  
> **Detalhe técnico:** [`docs/mca/ARCHITECTURE.md`](docs/mca/ARCHITECTURE.md)  
> **Como testar:** [`docs/mca/TESTING.md`](docs/mca/TESTING.md)  
> **Refinamento original:** [`mca_refinamento_cartográfico_8aa68742.plan.md`](mca_refinamento_cartográfico_8aa68742.plan.md)

---

## Uma frase

O MCA evolui de **pipeline GIS+IA** para **plataforma operacional cartográfica** — o diferencial é **Behavior Registry + Knowledge Graph + Gold Maps** (Pimenta) como dados executáveis, não export ZIP isolado.

---

## Subsistemas Cartographic OS

| Subsistema | Módulo alvo |
|------------|-------------|
| Kernel espacial | `topology/`, `tiles/`, PostGIS |
| Semântica | `semantic/`, `knowledge/` |
| Cartografia | `symbols/`, `scale/`, `layout/` |
| Scheduler | `orchestrator/` stateful |
| Rendering | jsPDF (v1) → QGIS (v3) |
| Aprendizado | `learn/`, `gold/` |

---

## Decisões (inalteradas)

- **v1 primeiro** — E02–E15 sem PostGIS/QGIS bloqueante  
- **PDF híbrido** — preview jsPDF + final QGIS  
- **3 camadas** — Semantic → Spatial → Cartographic (v2+)  
- **Revisão humana oficial** — `mca_reviews` (v2)  

---

## Estado do código (resumo)

Implementado: `McaWorkbench`, `/api/mca/*`, 72 agentes, orchestrator linear, PDF E13, export legado, gold manifests, `TESTING.md`.  
Pendente v1: geometrias reais, `IMPLEMENTATION-SPEC` contrato v2.  
Pendente v2–v5: ver roadmap em [`PLANO-MAESTRO.md`](docs/mca/PLANO-MAESTRO.md).

---

## 10 pilares → ver PLANO-MAESTRO

Semantic layer · 3 camadas · Behavior Registry · Topology · Scale · PostGIS · Multi-graph · Human review · Layout JSON · Gold maps.

---

## Roadmap (resumo)

| Versão | Foco | Aceite-chave |
|--------|------|--------------|
| **v1** | MVP E02–E15 | [`TESTING.md`](docs/mca/TESTING.md) checklist |
| **v2** | Fundação cartográfica | APP invalida se hidro muda |
| **v3** | PostGIS, tiles, QGIS | PDF final = QGIS |
| **v4** | IA + benchmark | `mca:benchmark -- catingueiro` |
| **v5** | Cartographic OS | Multi-tenant, cognitivo |

---

## Testes v1 (atalho)

1. `npm run dev` → login (`technical`+) → **Estudos Técnicos → Mapas**  
2. Perímetro → **Criar** projeto → **Pipeline completo** → **PDF**  
3. **Debugger** E03 + E05 (com projeto)  
4. `npm run deploy:rules` em produção  
5. Limitações v1: stubs geométricos; PDF cartucho — ver [`TESTING.md`](docs/mca/TESTING.md)

---

## Próximo passo

1. Executar roteiro em [`TESTING.md`](docs/mca/TESTING.md).  
2. Completar [`IMPLEMENTATION-SPEC.md`](docs/mca/IMPLEMENTATION-SPEC.md) (contrato v2).  
3. v1 código: geometrias reais mínimas.  
4. **v2 ordem:** types triplos → Behavior Registry → Layout JSON → orchestrator stateful.

**Não** misturar v2 enterprise com estabilização v1.
