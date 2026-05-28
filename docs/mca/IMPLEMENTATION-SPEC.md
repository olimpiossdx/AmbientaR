# MCA — Especificação de implementação



**Plano executivo:** [`PLANO-EXECUTIVO.md`](PLANO-EXECUTIVO.md) · **Plano mestre:** [`PLANO-MAESTRO.md`](PLANO-MAESTRO.md)  

**Índice Cursor:** [`.cursor/plans/mca_motor_cartográfico_a1071e68.plan.md`](../../.cursor/plans/mca_motor_cartográfico_a1071e68.plan.md)  

**Refinamento enterprise:** [`.cursor/plans/mca_refinamento_cartográfico_8aa68742.plan.md`](../../.cursor/plans/mca_refinamento_cartográfico_8aa68742.plan.md)  

**Arquitetura:** [`ARCHITECTURE.md`](ARCHITECTURE.md)  

**Como testar:** [`TESTING.md`](TESTING.md)



---



## Contrato arquitetural (v1 disciplina → v2 alvo)



### Três camadas (v2+)



| Camada | Contém | Não contém |

|--------|--------|------------|

| **Semantic** | `class`, `legalBasis`, `origin`, `derivedFrom`, `reviewStatus` | geometria, cor, espessura |

| **Spatial** | `geometryRef`, `checksum`, `topologyStatus`, `bbox`, `areaHa` | símbolo, escala de impressão |

| **Cartographic** | `styleProfile`, `labels`, `zIndex`, `scaleDenominator` | regras legais |



Tipos alvo (extrato):



```typescript

type McaSemanticLayer = {

  semanticId: string;

  spatialRef: string;

  class: string;

  taxonomy: "ambiental" | "fund" | "uso" | "hydro" | "infra";

  legalBasis?: string;

  origin: string;

  reviewStatus: "draft" | "reviewed" | "promoted";

};



type McaSpatialLayer = {

  spatialId: string;       // = layerKey: HYD_RIBEIRAO, APP_POLYGON

  geometryRef: string;     // v1: inline Firestore | v3: postgis://…

  checksum: string;

  topologyStatus: "valid" | "repaired" | "invalid";

  sourceAgentId: string;

};



type McaCartographicView = {

  viewId: string;

  spatialRef: string;

  scaleDenominator: number;

  templateId: string;

  styleProfile: string;

  zIndex: number;

};

```



### Estados de layer (v2 — preparar em v1)



| Estado | Significado |

|--------|-------------|

| `pending` | Aguarda dependência |

| `running` | Agente em execução |

| `blocked` | Conflito não resolvido |

| `invalidated` | Upstream mudou |

| `stale` | Output desatualizado |

| `reviewed` | Humano validou |

| `promoted` | Aprovado para export legal |



**v1:** guardar `sourceAgentId`, `updatedAt`, `checksum` opcional no doc da layer.



### v1 — regras mínimas (código actual)



1. Um agente → um `produces` / `layerKey` estável no GPKG lógico.

2. GeoJSON em Firestore: **só geometria + atributos semânticos mínimos** (sem `fill`/`stroke`/`color` em properties).

3. `layoutMeta` no projeto = subconjunto do **Layout JSON** (ver `ARCHITECTURE.md`).

4. `checksum` opcional por layer (preparar cache v3).

5. Export legado `/api/study-maps/*` intocado.

6. `meta.processingMode`: `"monolith"` (default) | `"tiled"` (flag apenas, sem engine).



### Score (v2 alvo)



```typescript

type McaScoreBundle = {

  geometric: number;      // 25%

  topological: number;  // 20%

  environmental: number;  // 20%

  visual: number;         // 20%

  semantic: number;       // 15%

  final: number;

  breakdown: Record<string, number>;

};

```



**v1:** agregado simples; `environmental` e `semantic` podem ser `0` stub.



### Behavior Registry v2 (esqueleto YAML)



```yaml

MCA_APP_Buffer:

  tier: spatial

  semantic_role: derive_app_from_hydro

  depends_on: [MCA_Hydro_Drainage]

  invalidates: [APP_POLYGON, RL_GLEBA_POLYGON]

  produces: APP_BUFFER

  cacheable: true

```



**v1:** comentários `# behavior_v2:` nos agentes críticos; parser `yaml` em v2.



---



## Estrutura implementada (v1)



```

src/lib/mca/

  types.ts, registry.ts, dag.ts, orchestrator.ts

  etapas.ts, debug.ts, tables.ts, layout-pdf.ts

  agents/handlers.ts, agents/run-agent.ts



src/app/api/mca/

  health/, projects/, projects/[id]/run, projects/[id]/pdf

  debug/etapa/[n], debug/agent



src/app/(app)/studies/mapas/

  mca-workbench.tsx, mapas-legacy-export.tsx



infra/mca-engine/

  main.py, dag.py, mca_agent_registry.yaml

```



---



## PDF híbrido



| Camada | Tecnologia | Etapa |

|--------|------------|-------|

| Preview | jsPDF + autoTable | E13 v1 |

| Final | PyQGIS `QgsLayoutExporter` | v3 |

| CAD | ODA + DXF/DWG | v3–v5 |



Contrato partilhado: **Layout JSON** (`layout/layout-spec.ts` em v2).



---



## Persistência



| v1 | v3+ |

|----|-----|

| Firestore `mca_projects` + `layers/{layerKey}` | PostGIS `mca.spatial_layers` |

| `mca_agent_runs` | + tile cache GCS |

| Metadados em Firestore | `layerRef: postgis://…` + semantic subcoleção |



---



## Orquestração



| v1 (actual) | v2 (alvo) |

|-------------|-----------|

| `resolveAgentOrder` + `runMcaAgent` linear | Stateful + `invalidation.ts` |

| `depends_on` único | Multi-graph no Behavior Registry |

| Estados pass/fail/skip | pending…promoted |



---



## 15 etapas



Ver [`ETAPAS.md`](ETAPAS.md). Scripts: `npm run mca:verify-etapa -- {01|03}`.



---



## Próxima execução de código



Ordem acordada:



1. Testes manuais v1 ([`TESTING.md`](TESTING.md)).

2. Agentes v1 reais (DWG path, buffers APP) — cirúrgico, sem PostGIS.

3. **v2:** `types` triplos → Behavior Registry parser → Layout JSON builder → orchestrator stateful.



Não iniciar PostGIS/QGIS antes de v1 estável em QA.

