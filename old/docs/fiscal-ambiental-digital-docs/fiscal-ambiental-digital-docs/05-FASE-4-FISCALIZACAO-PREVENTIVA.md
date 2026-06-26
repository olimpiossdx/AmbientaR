# Fase 4 — Fiscalização Preventiva

## Objetivo

Cruzar o acervo satelital e as análises com bases ambientais e restrições legais/administrativas para gerar achados preventivos.

Esta fase transforma o Fiscal Ambiental Digital em um instrumento de auditoria ambiental interna.

---

## 1. Rotas

```text
/ia/fiscal-ambiental-digital/fiscalizacao
/ia/fiscal-ambiental-digital/fiscalizacao/checklist
/ia/fiscal-ambiental-digital/fiscalizacao/achados
/ia/fiscal-ambiental-digital/fiscalizacao/camadas
```

---

## 2. Bases de cruzamento

```text
CAR/SICAR
APP
Reserva Legal
IDE-Sisema MG
PRODES
MapBiomas Alerta
Áreas embargadas
Unidades de Conservação
Zona de Amortecimento
Mata Atlântica
Cavidades
Outorgas
Licenças
Condicionantes
```

---

## 3. Modelo de achado fiscal

```text
projects/{projectId}/fiscal_findings/{findingId}
```

```ts
export type FiscalFindingDoc = {
  id: string;
  clientId: string;
  projectId: string;
  archiveId?: string;
  analysisId?: string;
  evidenceId?: string;
  type:
    | 'app_intervention'
    | 'rl_intervention'
    | 'vegetation_loss'
    | 'water_intervention'
    | 'possible_unlicensed_activity'
    | 'overlap_restricted_area'
    | 'prodes_overlap'
    | 'mapbiomas_alert_overlap'
    | 'embargo_overlap';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  areaHa?: number;
  geometry?: GeoJSON.Geometry;
  sourceLayers: string[];
  recommendedAction: string;
  status: 'open' | 'in_review' | 'resolved' | 'dismissed';
  createdAt: string;
  createdBy: string;
};
```

---

## 4. API

```text
POST /api/fiscal-ambiental/fiscalizacao/run-checks
GET /api/fiscal-ambiental/fiscalizacao/findings
PATCH /api/fiscal-ambiental/fiscalizacao/findings/[findingId]
POST /api/fiscal-ambiental/fiscalizacao/findings/[findingId]/save-evidence
```

Request:

```ts
type RunFiscalChecksRequest = {
  clientId: string;
  projectId: string;
  archiveId?: string;
  analysisId?: string;
  checks: Array<
    | 'app'
    | 'reserva_legal'
    | 'prodes'
    | 'mapbiomas'
    | 'ide_sisema'
    | 'embargo'
    | 'outorga'
    | 'licencas'
  >;
};
```

---

## 5. Motor de regras

```ts
export type FiscalRule = {
  id: string;
  name: string;
  description: string;
  requiredLayers: string[];
  run: (context: FiscalRuleContext) => Promise<FiscalFindingDoc[]>;
};
```

Exemplo conceitual:

```ts
export const appInterventionRule: FiscalRule = {
  id: 'app_intervention_from_change',
  name: 'Possível intervenção em APP',
  description: 'Cruza polígonos de mudança com APP do imóvel.',
  requiredLayers: ['app', 'change_polygons'],
  async run(context) {
    // 1. Carregar APP
    // 2. Carregar polígonos de mudança
    // 3. Intersectar
    // 4. Calcular área
    // 5. Retornar achados
    return [];
  },
};
```

---

## 6. UI

Componentes:

```text
FiscalizacaoDashboard.tsx
FiscalCheckRunner.tsx
FiscalLayerSelector.tsx
FiscalFindingList.tsx
FiscalFindingMap.tsx
FiscalFindingDetail.tsx
FindingSeverityBadge.tsx
FindingActionPanel.tsx
```

---

## 7. Semáforo

```text
Verde — sem achado relevante
Amarelo — atenção
Laranja — risco médio
Vermelho — risco alto
Roxo — crítico / verificar imediatamente
```

---

## 8. Linguagem recomendada

Usar:

```text
Possível intervenção
Indício visual
Necessita validação técnica
Recomenda-se vistoria
```

Evitar:

```text
Infração confirmada
Crime ambiental
Autuação certa
```

---

## 9. Critérios de aceite

- Sistema cruza análise com APP/RL.
- Sistema gera achados com severidade.
- Usuário pode abrir achado no mapa.
- Usuário pode salvar achado como evidência.
- Usuário pode alterar status do achado.
- Tela deixa claro que é fiscalização preventiva, não autuação oficial.

---

## 10. Prompt para Cursor

```text
Implemente a Fase 4 do Fiscal Ambiental Digital: Fiscalização Preventiva.
Crie o modelo FiscalFinding, APIs para executar checks, UI de achados, mapa de severidade e estrutura de motor de regras.
Comece com regras APP, Reserva Legal, PRODES e MapBiomas usando camadas já disponíveis no projeto quando existirem.
Use linguagem preventiva e não acusatória.
```
