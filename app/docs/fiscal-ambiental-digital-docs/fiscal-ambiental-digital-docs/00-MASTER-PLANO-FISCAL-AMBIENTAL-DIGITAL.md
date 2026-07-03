# Fiscal Ambiental Digital — Plano Mestre de Arquitetura e Implementação

**Projeto:** AmbientaR / EcoGestão MG  
**Menu:** IA  
**Submenu:** Fiscal Ambiental Digital  
**Rota base:** `/ia/fiscal-ambiental-digital`  
**Estado:** Documento de estruturação para desenvolvimento no Cursor  
**Objetivo central:** criar um app interno praticamente novo, dentro do menu IA, cujo núcleo seja a montagem simples, automática e organizada de um acervo de imagens de satélite gratuitas do INPE/CBERS em alta resolução, por cliente, empreendimento, imóvel, projeto e processo.

---

## 1. Princípio arquitetural

O Fiscal Ambiental Digital não deve ser pensado primeiro como IA.

Ele deve ser pensado primeiro como:

> Um Acervo Histórico Ambiental Digital, alimentado por imagens gratuitas do INPE/CBERS, organizado por imóvel/projeto, com ferramentas progressivas de comparação, análise, fiscalização preventiva, relatórios e monitoramento.

Fluxo conceitual:

```text
Área do imóvel
↓
Busca automática INPE/CBERS
↓
Montagem do acervo satelital
↓
Arquivo permanente por cliente/projeto/imóvel
↓
Linha do tempo ambiental
↓
Comparação temporal
↓
Detecção de mudanças
↓
Fiscalização preventiva
↓
Relatórios técnicos
↓
Monitoramento contínuo
```

---

## 2. Estrutura de navegação

### 2.1 Menu IA

```text
IA
 └── Fiscal Ambiental Digital
      ├── Dashboard
      ├── Biblioteca Satelital
      ├── Montar Acervo INPE
      ├── Linha do Tempo Ambiental
      ├── Comparador Temporal
      ├── Central de Evidências
      ├── Inteligência Ambiental
      ├── Monitoramento Automático
      ├── Fiscalização Preventiva
      ├── Relatórios Inteligentes
      ├── Auditoria ESG
      └── Configurações
```

### 2.2 Rotas Next.js sugeridas

```text
src/app/(app)/ia/fiscal-ambiental-digital/page.tsx
src/app/(app)/ia/fiscal-ambiental-digital/dashboard/page.tsx
src/app/(app)/ia/fiscal-ambiental-digital/biblioteca/page.tsx
src/app/(app)/ia/fiscal-ambiental-digital/montar-acervo/page.tsx
src/app/(app)/ia/fiscal-ambiental-digital/linha-do-tempo/page.tsx
src/app/(app)/ia/fiscal-ambiental-digital/comparador/page.tsx
src/app/(app)/ia/fiscal-ambiental-digital/evidencias/page.tsx
src/app/(app)/ia/fiscal-ambiental-digital/inteligencia/page.tsx
src/app/(app)/ia/fiscal-ambiental-digital/monitoramento/page.tsx
src/app/(app)/ia/fiscal-ambiental-digital/fiscalizacao/page.tsx
src/app/(app)/ia/fiscal-ambiental-digital/relatorios/page.tsx
src/app/(app)/ia/fiscal-ambiental-digital/esg/page.tsx
src/app/(app)/ia/fiscal-ambiental-digital/configuracoes/page.tsx
```

---

## 3. Fases macro

| Fase | Nome | Objetivo |
|---|---|---|
| 0 | Fundação técnica | Preparar rotas, navegação, modelos, permissões e arquitetura |
| 1 | Biblioteca Satelital e Acervo INPE | Montar acervo gratuito INPE/CBERS por imóvel/projeto |
| 2 | Exploração temporal | Linha do tempo, comparador, galeria, downloads |
| 3 | Inteligência Ambiental | Detecção de mudanças e classificação ambiental |
| 4 | Fiscalização Preventiva | Cruzamentos com CAR, IDE-Sisema, PRODES, MapBiomas e regras ambientais |
| 5 | Relatórios Inteligentes | Geração de PDFs, memoriais, anexos e laudos de apoio |
| 6 | Monitoramento Contínuo | Rotinas automáticas de vigilância territorial |
| 7 | Auditoria ESG e Enterprise | Indicadores, compliance, risco, governança e auditoria |

---

## 4. Princípio do MVP real

O MVP não é detectar desmatamento.

O MVP é permitir que o usuário, sem conhecimento técnico, crie um acervo satelital histórico da propriedade com imagens gratuitas do INPE.

MVP mínimo:

```text
Selecionar projeto/imóvel
↓
Usar perímetro do CAR/projeto/desenho/SHP
↓
Sistema busca anos disponíveis no INPE
↓
Usuário escolhe anos ou modo automático
↓
Sistema monta imagens recortadas
↓
Sistema salva no acervo
↓
Usuário visualiza galeria/timeline
↓
Usuário baixa GeoTIFF e imagem de visualização
```

---

## 5. Estrutura de dados principal

### 5.1 Entidades

```text
FiscalWorkspace
SatelliteArchive
SatelliteScene
SatelliteMosaic
EnvironmentalTimelineEvent
EvidenceItem
ChangeAnalysis
MonitoringRule
MonitoringRun
FiscalFinding
SmartReport
```

### 5.2 Firestore proposto

```text
clients/{clientId}
  projects/{projectId}
    fiscal_workspace/main
    satellite_archives/{archiveId}
    satellite_archives/{archiveId}/scenes/{sceneId}
    satellite_archives/{archiveId}/mosaics/{mosaicId}
    environmental_timeline/{eventId}
    evidence_items/{evidenceId}
    change_analyses/{analysisId}
    monitoring_rules/{ruleId}
    monitoring_runs/{runId}
    fiscal_findings/{findingId}
    smart_reports/{reportId}
```

---

## 6. APIs internas

```text
/api/fiscal-ambiental/workspace
/api/fiscal-ambiental/archive
/api/fiscal-ambiental/archive/build
/api/fiscal-ambiental/archive/status/[jobId]
/api/fiscal-ambiental/archive/[archiveId]
/api/fiscal-ambiental/archive/[archiveId]/scenes
/api/fiscal-ambiental/archive/[archiveId]/mosaics
/api/fiscal-ambiental/inpe/availability
/api/fiscal-ambiental/inpe/search
/api/fiscal-ambiental/inpe/assemble
/api/fiscal-ambiental/timeline
/api/fiscal-ambiental/compare
/api/fiscal-ambiental/evidence
/api/fiscal-ambiental/intelligence/detect-changes
/api/fiscal-ambiental/fiscalizacao/run-checks
/api/fiscal-ambiental/reports/generate
/api/fiscal-ambiental/monitoring/rules
/api/fiscal-ambiental/monitoring/run
```

---

## 7. Workers

### 7.1 Worker principal de mosaico

```text
infra/fiscal-satellite-worker/
  Dockerfile
  app.py
  requirements.txt
  src/
    stac_client.py
    cbers_resolver.py
    mosaic_builder.py
    pansharpen.py
    clipper.py
    preview.py
    storage_client.py
    manifest.py
```

Funções:

- consultar INPE STAC;
- resolver melhor coleção por data;
- montar mosaico;
- fusionar bandas quando necessário;
- recortar na AOI;
- gerar preview WebP;
- gerar GeoTIFF/COG;
- salvar no Storage;
- gerar manifest técnico.

### 7.2 Worker de inteligência

```text
infra/fiscal-intelligence-worker/
  app.py
  src/
    ndvi.py
    change_detection.py
    water_detection.py
    soil_exposure.py
    vegetation_classifier.py
    polygonizer.py
    report_summary.py
```

### 7.3 Worker de relatórios

```text
infra/fiscal-report-worker/
  app.py
  templates/
    ocupacao-consolidada.html
    mudancas-ambientais.html
    fiscalizacao-preventiva.html
    monitoramento-periodico.html
```

---

## 8. Permissões

```ts
export const FISCAL_AMBIENTAL_ROLES = {
  view: ['admin', 'technical', 'gestor', 'supervisor', 'advogado', 'cliente_gestao'],
  buildArchive: ['admin', 'technical', 'gestor', 'supervisor'],
  downloadGeoTiff: ['admin', 'technical', 'gestor', 'supervisor'],
  runIntelligence: ['admin', 'technical', 'gestor'],
  runFiscalChecks: ['admin', 'technical', 'gestor', 'advogado'],
  generateReports: ['admin', 'technical', 'gestor', 'advogado'],
  configureMonitoring: ['admin', 'technical', 'gestor'],
  deleteArchive: ['admin'],
};
```

---

## 9. Convenção de nomenclatura

### 9.1 Nome público

**Fiscal Ambiental Digital**

### 9.2 Nome técnico

`fiscal-ambiental-digital`

### 9.3 Prefixos

```text
FAD = Fiscal Ambiental Digital
satelliteArchive = acervo satelital
fiscalWorkspace = ambiente de trabalho fiscal
```

---

## 10. Documentos deste pacote

```text
00-MASTER-PLANO-FISCAL-AMBIENTAL-DIGITAL.md
01-FASE-0-FUNDACAO-TECNICA.md
02-FASE-1-BIBLIOTECA-SATELITAL-E-ACERVO-INPE.md
03-FASE-2-LINHA-DO-TEMPO-E-COMPARADOR.md
04-FASE-3-INTELIGENCIA-AMBIENTAL.md
05-FASE-4-FISCALIZACAO-PREVENTIVA.md
06-FASE-5-RELATORIOS-INTELIGENTES.md
07-FASE-6-MONITORAMENTO-CONTINUO.md
08-FASE-7-AUDITORIA-ESG-ENTERPRISE.md
09-API-CONTRATOS-E-TIPOS.md
10-FIRESTORE-STORAGE-E-SEGURANCA.md
11-COMPONENTES-UI-E-FLUXOS.md
12-WORKERS-CLOUD-RUN-GDAL.md
13-PROMPTS-CURSOR-IMPLEMENTACAO.md
```
