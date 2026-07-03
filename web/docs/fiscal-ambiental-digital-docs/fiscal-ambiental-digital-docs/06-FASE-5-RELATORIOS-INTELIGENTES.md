# Fase 5 — Relatórios Inteligentes

## Objetivo

Gerar documentos técnicos e administrativos a partir do acervo satelital, comparações, análises, achados fiscais e evidências.

---

## 1. Rotas

```text
/ia/fiscal-ambiental-digital/relatorios
/ia/fiscal-ambiental-digital/relatorios/novo
/ia/fiscal-ambiental-digital/relatorios/[reportId]
```

---

## 2. Tipos de relatório

```text
Relatório de Acervo Satelital
Relatório de Evolução Ambiental
Relatório de Comparação Temporal
Relatório de Detecção de Mudanças
Relatório de Ocupação Consolidada
Relatório de Fiscalização Preventiva
Relatório de APP e Reserva Legal
Relatório de Monitoramento Periódico
Relatório de Evidências Ambientais
Relatório ESG Ambiental
```

---

## 3. Modelo Firestore

```text
projects/{projectId}/smart_reports/{reportId}
```

```ts
export type SmartReportDoc = {
  id: string;
  clientId: string;
  projectId: string;
  archiveId?: string;
  type:
    | 'satellite_archive'
    | 'environmental_evolution'
    | 'temporal_comparison'
    | 'change_detection'
    | 'consolidated_occupation'
    | 'preventive_fiscalization'
    | 'app_rl'
    | 'monitoring'
    | 'evidence_bundle'
    | 'esg';
  title: string;
  status: 'draft' | 'generating' | 'ready' | 'failed';
  inputRefs: {
    mosaicIds?: string[];
    analysisIds?: string[];
    findingIds?: string[];
    evidenceIds?: string[];
  };
  storage?: {
    pdfPath?: string;
    docxPath?: string;
    htmlPath?: string;
    assetsPath?: string;
  };
  disclaimer: string;
  createdAt: string;
  createdBy: string;
};
```

---

## 4. API

```text
POST /api/fiscal-ambiental/reports/generate
GET /api/fiscal-ambiental/reports/[reportId]
GET /api/fiscal-ambiental/reports/[reportId]/download
POST /api/fiscal-ambiental/reports/[reportId]/regenerate
```

Request:

```ts
type GenerateSmartReportRequest = {
  clientId: string;
  projectId: string;
  type: SmartReportDoc['type'];
  title: string;
  archiveId?: string;
  mosaicIds?: string[];
  analysisIds?: string[];
  findingIds?: string[];
  evidenceIds?: string[];
  outputFormats: Array<'pdf' | 'docx' | 'html'>;
  includeTechnicalAppendix: boolean;
  includeDisclaimers: boolean;
};
```

---

## 5. Estrutura de relatório padrão

```text
Capa
Identificação do cliente/projeto/imóvel
Objetivo
Metodologia
Fontes de dados
Mapa de localização
Acervo satelital utilizado
Linha do tempo ambiental
Comparações temporais
Análises automáticas
Achados preventivos
Tabela de áreas
Central de evidências
Conclusão técnica auxiliar
Ressalvas e limitações
Anexos
Manifest técnico
```

---

## 6. Templates

```text
infra/fiscal-report-worker/templates/
  satellite-archive.html
  environmental-evolution.html
  temporal-comparison.html
  change-detection.html
  consolidated-occupation.html
  preventive-fiscalization.html
  monitoring.html
  evidence-bundle.html
  esg.html
```

---

## 7. Ressalva padrão

```text
Este relatório possui caráter técnico auxiliar e não substitui vistoria em campo, parecer profissional habilitado, manifestação de órgão ambiental competente ou classificação oficial de bases públicas como PRODES, MapBiomas, SICAR ou IDE-Sisema. As análises automáticas devem ser interpretadas como indícios técnicos sujeitos à validação humana.
```

---

## 8. UI

Componentes:

```text
ReportGallery.tsx
ReportTypeSelector.tsx
ReportBuilderWizard.tsx
ReportInputSelector.tsx
ReportPreview.tsx
ReportDownloadButtons.tsx
ReportStatusBadge.tsx
```

---

## 9. Critérios de aceite

- Usuário gera PDF a partir de acervo.
- Usuário inclui imagens e mapas.
- Usuário inclui achados e evidências.
- PDF tem ressalva.
- PDF salva no projeto.
- Relatório aparece na Central de Evidências.

---

## 10. Prompt para Cursor

```text
Implemente a Fase 5 do Fiscal Ambiental Digital: Relatórios Inteligentes.
Crie modelos, APIs, templates HTML e UI para gerar relatórios PDF a partir de acervos, comparações, análises e achados.
Inclua ressalva obrigatória e salve os relatórios no Storage e Firestore.
```
