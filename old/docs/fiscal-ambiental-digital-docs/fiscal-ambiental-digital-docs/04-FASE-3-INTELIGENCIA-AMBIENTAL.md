# Fase 3 — Inteligência Ambiental

## Objetivo

Criar uma camada de análise automática sobre o acervo satelital.

Nesta fase, a IA e os algoritmos geoespaciais passam a interpretar as imagens já arquivadas.

---

## 1. Rotas

```text
/ia/fiscal-ambiental-digital/inteligencia
/ia/fiscal-ambiental-digital/inteligencia/deteccao-mudancas
/ia/fiscal-ambiental-digital/inteligencia/vegetacao
/ia/fiscal-ambiental-digital/inteligencia/agua
/ia/fiscal-ambiental-digital/inteligencia/solo
```

---

## 2. Tipos de análise

```text
Detecção de supressão vegetal
Detecção de regeneração
Solo exposto
Novas estradas
Novos barramentos/açudes
Alteração de corpos hídricos
Expansão agrícola
Mineração/terraplanagem
Queimada/mancha escura
```

---

## 3. Modelo Firestore

```text
projects/{projectId}/change_analyses/{analysisId}
```

```ts
export type ChangeAnalysisDoc = {
  id: string;
  clientId: string;
  projectId: string;
  archiveId: string;
  beforeMosaicId: string;
  afterMosaicId: string;
  status: 'queued' | 'processing' | 'ready' | 'failed';
  analysisTypes: Array<
    | 'vegetation_loss'
    | 'vegetation_gain'
    | 'soil_exposure'
    | 'water_change'
    | 'road_opening'
    | 'earthwork'
    | 'burn_scar'
  >;
  summary?: {
    vegetationLossHa?: number;
    vegetationGainHa?: number;
    soilExposureHa?: number;
    waterGainHa?: number;
    waterLossHa?: number;
    totalChangedHa?: number;
    confidence: number;
  };
  outputs?: {
    changeRasterPath?: string;
    polygonsGeojsonPath?: string;
    previewPath?: string;
    manifestPath?: string;
  };
  createdAt: string;
  createdBy: string;
};
```

---

## 4. API

```text
POST /api/fiscal-ambiental/intelligence/detect-changes
GET /api/fiscal-ambiental/intelligence/analysis/[analysisId]
POST /api/fiscal-ambiental/intelligence/classify-vegetation
POST /api/fiscal-ambiental/intelligence/detect-water
POST /api/fiscal-ambiental/intelligence/detect-soil
```

Request:

```ts
type DetectChangesRequest = {
  clientId: string;
  projectId: string;
  archiveId: string;
  beforeMosaicId: string;
  afterMosaicId: string;
  analysisTypes: ChangeAnalysisDoc['analysisTypes'];
  sensitivity: 'low' | 'medium' | 'high';
  minPolygonAreaHa: number;
};
```

---

## 5. Worker de inteligência

```text
infra/fiscal-intelligence-worker/
  Dockerfile
  app.py
  src/
    raster_loader.py
    align.py
    indices.py
    ndvi.py
    ndwi.py
    soil.py
    delta.py
    threshold.py
    polygonize.py
    confidence.py
    manifest.py
```

---

## 6. Pipeline técnico

```text
Carregar GeoTIFF antes
Carregar GeoTIFF depois
Alinhar grids
Normalizar resolução
Calcular índices possíveis
Gerar diferença
Aplicar limiar
Remover ruído
Polygonizar
Calcular área em hectares
Gerar preview
Salvar resultados
Gerar resumo textual
```

---

## 7. Saídas

```text
change_mask.tif
change_polygons.geojson
change_preview.webp
analysis_manifest.json
summary.json
```

---

## 8. UI

Componentes:

```text
ChangeDetectionPage.tsx
ChangeAnalysisWizard.tsx
AnalysisTypeSelector.tsx
AnalysisSensitivitySelector.tsx
ChangeResultMap.tsx
ChangeSummaryCards.tsx
ChangePolygonTable.tsx
ChangeConfidenceBadge.tsx
SaveAnalysisAsEvidenceButton.tsx
```

---

## 9. Mensagens leigas

Evitar:

```text
NDVI delta threshold polygonize raster
```

Usar:

```text
Possível perda de vegetação
Possível regeneração
Área com solo exposto
Mudança em corpo d'água
```

---

## 10. Critérios de aceite

- Usuário seleciona duas imagens.
- Sistema gera análise de mudança.
- Resultado mostra área em hectares.
- Resultado mostra polígonos no mapa.
- Resultado pode ser salvo como evidência.
- Resultado tem aviso de que é análise auxiliar, não decisão oficial.

---

## 11. Prompt para Cursor

```text
Implemente a Fase 3 do Fiscal Ambiental Digital: Inteligência Ambiental.
Crie APIs, modelos, worker e UI para detecção de mudanças entre dois mosaicos do acervo.
Gerar polígonos, área em hectares, preview, resumo e evidência.
Manter linguagem leiga na UI e detalhes técnicos apenas no manifest.
```
