# Fase 2 — Linha do Tempo Ambiental e Comparador Temporal

## Objetivo

Transformar o acervo satelital montado na Fase 1 em uma experiência visual de histórico ambiental.

A Fase 2 não cria novas análises complexas ainda. Ela permite explorar, comparar e entender a evolução visual do imóvel.

---

## 1. Rotas

```text
/ia/fiscal-ambiental-digital/linha-do-tempo
/ia/fiscal-ambiental-digital/comparador
/ia/fiscal-ambiental-digital/biblioteca/[archiveId]/timeline
/ia/fiscal-ambiental-digital/biblioteca/[archiveId]/compare
```

---

## 2. Linha do Tempo Ambiental

### 2.1 Conceito

Mostrar as imagens do acervo em ordem cronológica, com narrativa visual.

Exemplo:

```text
2008 — Imagem histórica disponível
2014 — Retomada de imagem CBERS-4
2018 — Área aparentemente estável
2023 — Melhor resolução CBERS-4A
2026 — Situação atual
```

### 2.2 Componentes

```text
EnvironmentalTimelinePage.tsx
EnvironmentalTimeline.tsx
TimelineYearGroup.tsx
TimelineMosaicCard.tsx
TimelineMapPreview.tsx
TimelineNarrativePanel.tsx
TimelineFilterBar.tsx
```

---

## 3. Eventos da linha do tempo

Firestore:

```text
projects/{projectId}/environmental_timeline/{eventId}
```

Tipo:

```ts
export type EnvironmentalTimelineEvent = {
  id: string;
  clientId: string;
  projectId: string;
  archiveId: string;
  year: number;
  date: string;
  type:
    | 'satellite_mosaic_created'
    | 'manual_note'
    | 'change_detected'
    | 'evidence_added'
    | 'report_generated'
    | 'monitoring_alert';
  title: string;
  description?: string;
  mosaicId?: string;
  evidenceId?: string;
  analysisId?: string;
  reportId?: string;
  severity?: 'info' | 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  createdBy: string;
};
```

---

## 4. Comparador Temporal

### 4.1 Objetivo

Selecionar duas imagens do acervo e comparar.

Modos:

```text
Antes/depois lado a lado
Slider central
Swipe vertical/horizontal
Piscar diferença
Timelapse
```

### 4.2 Componentes

```text
TemporalComparatorPage.tsx
CompareDateSelector.tsx
MosaicCompareSelector.tsx
BeforeAfterMap.tsx
SwipeCompareMap.tsx
SideBySideCompare.tsx
TimelapsePlayer.tsx
CompareExportPanel.tsx
```

---

## 5. API de comparação visual

```text
POST /api/fiscal-ambiental/compare/create-session
```

Body:

```ts
type CreateCompareSessionRequest = {
  clientId: string;
  projectId: string;
  archiveId: string;
  beforeMosaicId: string;
  afterMosaicId: string;
  mode: 'side_by_side' | 'swipe' | 'timelapse';
};
```

Response:

```ts
type CreateCompareSessionResponse = {
  sessionId: string;
  beforePreviewUrl: string;
  afterPreviewUrl: string;
  beforeMetadata: SatelliteMosaicDoc;
  afterMetadata: SatelliteMosaicDoc;
};
```

---

## 6. Timelapse

### 6.1 API

```text
POST /api/fiscal-ambiental/compare/timelapse
```

Body:

```ts
type CreateTimelapseRequest = {
  archiveId: string;
  mosaicIds: string[];
  output: 'webp' | 'mp4' | 'gif';
  fps?: number;
};
```

### 6.2 Saídas

```text
clients/{clientId}/projects/{projectId}/fiscal-ambiental/archives/{archiveId}/timelapse/
  timelapse.webp
  timelapse.mp4
  manifest.json
```

---

## 7. UX

Tela da linha do tempo:

```text
Topo: Projeto + Imóvel + período
Esquerda: Anos disponíveis
Centro: Mapa/preview
Direita: Detalhes da imagem
Rodapé: miniaturas
```

Tela comparador:

```text
Imagem A: ano/data
Imagem B: ano/data
Modo: slider / lado a lado / timelapse
Botões: exportar imagem, salvar evidência, gerar análise
```

---

## 8. Critérios de aceite

- Usuário vê imagens do acervo em ordem temporal.
- Usuário compara duas datas sem gerar novo processamento.
- Slider funciona no mapa.
- Timelapse inicial pode ser gerado a partir dos previews.
- Comparação pode ser salva como evidência.
- Não há IA obrigatória nesta fase.

---

## 9. Prompt para Cursor

```text
Implemente a Fase 2 do Fiscal Ambiental Digital: Linha do Tempo Ambiental e Comparador Temporal.
Use os mosaicos já criados na Fase 1.
Crie timeline cronológica, visualizador, comparador lado a lado, slider swipe e opção de salvar comparação como evidência.
Não implemente ainda detecção automática de mudanças.
```
