# Fase 1 — Biblioteca Satelital e Acervo INPE

## Objetivo central

Esta é a fase mais importante do produto.

O objetivo não é IA.
O objetivo é criar o acervo.

O usuário deve conseguir montar, de forma simples, um arquivo permanente de imagens gratuitas do INPE/CBERS em alta resolução para uma propriedade, projeto ou processo.

---

## 1. Resultado esperado para o usuário

O usuário entra em:

```text
IA → Fiscal Ambiental Digital → Montar Acervo INPE
```

Seleciona:

- cliente;
- projeto;
- imóvel;
- área por CAR, projeto, desenho ou arquivo;
- período desejado;
- modo automático ou manual.

O sistema monta:

- imagens por ano;
- melhores datas disponíveis;
- previews WebP;
- GeoTIFF/COG;
- manifest técnico;
- metadados;
- galeria organizada;
- timeline inicial.

---

## 2. Rota principal

```text
/ia/fiscal-ambiental-digital/montar-acervo
```

---

## 3. Rotas auxiliares

```text
/ia/fiscal-ambiental-digital/biblioteca
/ia/fiscal-ambiental-digital/biblioteca/[archiveId]
/ia/fiscal-ambiental-digital/biblioteca/[archiveId]/mosaics/[mosaicId]
```

---

## 4. Wizard de montagem do acervo

### Etapa 1 — Selecionar contexto

Campos:

```text
Cliente
Empreendimento
Projeto
Imóvel
Processo ambiental vinculado
```

### Etapa 2 — Definir área

Opções:

```text
Usar imóvel CAR
Usar perímetro do projeto
Desenhar no mapa
Carregar SHP/KML/KMZ/GeoJSON
Inserir coordenadas manualmente
```

### Etapa 3 — Selecionar período

Modos:

```text
Modo automático recomendado
Modo por anos específicos
Modo por data exata
Modo histórico completo
```

Default recomendado:

```text
2008 até ano atual
1 melhor imagem por ano
priorizar baixa nuvem e maior resolução
```

### Etapa 4 — Confirmar fontes

Fontes gratuitas:

```text
CBERS-2B HRC
CBERS-4 PAN5M
CBERS-4 PAN10M
CBERS-4A WPM
CBERS-4A WPM Fusionado
MUX fallback
```

### Etapa 5 — Processar

Mostrar:

```text
Buscando imagens no INPE
Selecionando melhores cenas
Montando mosaico
Recortando na propriedade
Gerando preview
Salvando GeoTIFF
Arquivando evidência
```

### Etapa 6 — Resultado

Entregas:

```text
Galeria de imagens
Mapa
Timeline
Download GeoTIFF
Manifest técnico
Adicionar à Central de Evidências
```

---

## 5. APIs da Fase 1

### 5.1 Criar acervo

```text
POST /api/fiscal-ambiental/archive
```

Body:

```ts
type CreateSatelliteArchiveRequest = {
  clientId: string;
  projectId: string;
  workspaceId?: string;
  name: string;
  aoi: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  aoiSource: 'car' | 'project' | 'drawn' | 'shp' | 'kml' | 'manual';
  periodStartYear: number;
  periodEndYear: number;
  mode: 'automatic_best_per_year' | 'specific_years' | 'specific_dates' | 'full_history';
  requestedYears?: number[];
  requestedDates?: string[];
  includeGeoTiff: boolean;
  includePreview: boolean;
  preheatRecent: boolean;
};
```

Response:

```ts
type CreateSatelliteArchiveResponse = {
  archiveId: string;
  jobId: string;
  status: 'queued';
};
```

---

### 5.2 Buscar disponibilidade INPE

```text
POST /api/fiscal-ambiental/inpe/availability
```

Body:

```ts
type InpeAvailabilityRequest = {
  aoi: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  bbox: [number, number, number, number];
  startYear: number;
  endYear: number;
  collections?: string[];
};
```

Response:

```ts
type InpeAvailabilityResponse = {
  years: Array<{
    year: number;
    status: 'available' | 'partial' | 'gap';
    bestDate?: string;
    bestResolutionM?: number;
    bestCollection?: string;
    cloudCover?: number;
    candidateCount: number;
    message: string;
  }>;
};
```

---

### 5.3 Montar acervo

```text
POST /api/fiscal-ambiental/archive/build
```

Body:

```ts
type BuildArchiveRequest = {
  archiveId: string;
  strategy: 'best_per_year' | 'all_green_days' | 'manual_selection';
  maxScenesPerYear?: number;
};
```

---

### 5.4 Status do job

```text
GET /api/fiscal-ambiental/archive/status/[jobId]
```

Response:

```ts
type ArchiveBuildStatusResponse = {
  jobId: string;
  archiveId: string;
  status: 'queued' | 'searching' | 'processing' | 'ready' | 'failed';
  progress: number;
  currentStep: string;
  processedYears: number[];
  failedYears: Array<{ year: number; reason: string }>;
  readyMosaics: Array<{ year: number; mosaicId: string; previewUrl: string }>;
};
```

---

## 6. Modelo Firestore

```text
projects/{projectId}/satellite_archives/{archiveId}
```

```ts
export type SatelliteArchiveDoc = {
  id: string;
  clientId: string;
  projectId: string;
  workspaceId: string;
  name: string;
  status: 'draft' | 'queued' | 'building' | 'ready' | 'failed';
  aoi: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  aoiSource: 'car' | 'project' | 'drawn' | 'shp' | 'kml' | 'manual';
  periodStartYear: number;
  periodEndYear: number;
  requestedYears: number[];
  mode: 'automatic_best_per_year' | 'specific_years' | 'specific_dates' | 'full_history';
  totalMosaics: number;
  totalScenes: number;
  totalStorageBytes: number;
  attribution: 'CBERS/INPE';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};
```

Subcoleção:

```text
projects/{projectId}/satellite_archives/{archiveId}/mosaics/{mosaicId}
```

```ts
export type SatelliteMosaicDoc = {
  id: string;
  archiveId: string;
  clientId: string;
  projectId: string;
  year: number;
  requestedDate?: string;
  sceneDate: string;
  source: SatelliteSource;
  stacCollection: string;
  stacItemIds: string[];
  resolutionM: number;
  cloudCover?: number;
  quality: 'good' | 'fair' | 'poor';
  pipeline: 'hrc_gray' | 'hrc_ccd_fused' | 'pan5_pan10_fused' | 'wpm_fused' | 'wpm_raw_fused' | 'mux_fallback';
  storage: {
    previewPath: string;
    geotiffPath: string;
    thumbnailPath?: string;
    manifestPath: string;
    bytes: number;
  };
  bounds: [number, number, number, number];
  status: 'ready' | 'failed';
  createdAt: string;
};
```

---

## 7. Storage

```text
clients/{clientId}/projects/{projectId}/fiscal-ambiental/archives/{archiveId}/
  manifest.json
  mosaics/{mosaicId}/
    preview.webp
    mosaic_rgb.tif
    thumbnail.jpg
    manifest.json
    source-items.json
```

---

## 8. Worker Cloud Run

Rota:

```text
POST /v1/archive/build
```

Payload:

```json
{
  "archiveId": "abc",
  "clientId": "client1",
  "projectId": "project1",
  "aoi": { "type": "Polygon", "coordinates": [] },
  "years": [2008, 2010, 2014, 2018, 2024, 2026],
  "strategy": "best_per_year",
  "includeGeoTiff": true,
  "includePreview": true
}
```

---

## 9. Resolver automático de coleções

```ts
export function resolvePreferredCollections(year: number): string[] {
  if (year >= 2023) {
    return ['CB4A-WPM-PCA-FUSED-1', 'CB4A-WPM-L4-DN-1', 'CB4-PAN5M-L4-DN-1'];
  }

  if (year >= 2019) {
    return ['CB4A-WPM-L4-DN-1', 'CB4-PAN5M-L4-DN-1', 'CB4-PAN10M-L4-DN-1'];
  }

  if (year >= 2014) {
    return ['CB4-PAN5M-L4-DN-1', 'CB4-PAN10M-L4-DN-1', 'CB4-MUX-L4-SR-1'];
  }

  if (year >= 2008 && year <= 2010) {
    return ['CB2B-HRC-L2-DN-1', 'CB2B-CCD-L2-DN-1'];
  }

  return [];
}
```

---

## 10. Componentes UI

```text
ArchiveBuildWizard.tsx
ArchiveContextStep.tsx
ArchiveAoiStep.tsx
ArchivePeriodStep.tsx
ArchiveSourceStep.tsx
ArchiveReviewStep.tsx
ArchiveProcessingStep.tsx
ArchiveResultStep.tsx
SatelliteArchiveGallery.tsx
SatelliteMosaicCard.tsx
SatelliteMosaicViewer.tsx
SatelliteDownloadButton.tsx
InpeAvailabilityTimeline.tsx
```

---

## 11. Critérios de aceite

- Usuário cria acervo para uma AOI.
- Sistema busca disponibilidade INPE.
- Sistema seleciona pelo menos uma imagem por ano disponível.
- Sistema salva preview e GeoTIFF.
- Biblioteca exibe imagens organizadas por ano.
- Mapa abre a imagem recortada.
- GeoTIFF pode ser baixado.
- Documento técnico/manifest é salvo.
- UI não mostra jargão técnico na tela principal.
- Atribuição CBERS/INPE aparece em todas as imagens.

---

## 12. Prompt para Cursor

```text
Implemente a Fase 1 do Fiscal Ambiental Digital: Biblioteca Satelital e Acervo INPE.
Crie o wizard Montar Acervo INPE, os modelos Firestore, APIs de archive, availability e status, componentes de galeria e viewer, além da integração inicial com worker Cloud Run.
O núcleo é montar um acervo por imóvel/projeto com imagens gratuitas do INPE/CBERS, preview WebP e GeoTIFF.
Priorize UX leiga e mantenha STAC/GDAL/bandas fora da interface principal.
```
