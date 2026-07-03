# Fase 0 — Fundação Técnica do Fiscal Ambiental Digital

## Objetivo

Criar a base estrutural do app interno Fiscal Ambiental Digital dentro do menu IA, sem ainda implementar processamento pesado.

A Fase 0 prepara:

- navegação;
- rotas;
- layout;
- permissões;
- tipos TypeScript;
- modelos Firestore;
- componentes base;
- contratos de API;
- estrutura de workers;
- flags de funcionalidade;
- placeholders para fases futuras.

---

## 1. Navegação

Arquivo provável:

```text
src/lib/navigation-config.ts
```

Adicionar item no menu IA:

```ts
{
  title: 'Fiscal Ambiental Digital',
  href: '/ia/fiscal-ambiental-digital',
  icon: Satellite,
  badge: 'Novo',
  children: [
    { title: 'Dashboard', href: '/ia/fiscal-ambiental-digital/dashboard' },
    { title: 'Biblioteca Satelital', href: '/ia/fiscal-ambiental-digital/biblioteca' },
    { title: 'Montar Acervo INPE', href: '/ia/fiscal-ambiental-digital/montar-acervo' },
    { title: 'Linha do Tempo Ambiental', href: '/ia/fiscal-ambiental-digital/linha-do-tempo' },
    { title: 'Comparador Temporal', href: '/ia/fiscal-ambiental-digital/comparador' },
    { title: 'Central de Evidências', href: '/ia/fiscal-ambiental-digital/evidencias' },
    { title: 'Inteligência Ambiental', href: '/ia/fiscal-ambiental-digital/inteligencia' },
    { title: 'Monitoramento Automático', href: '/ia/fiscal-ambiental-digital/monitoramento' },
    { title: 'Fiscalização Preventiva', href: '/ia/fiscal-ambiental-digital/fiscalizacao' },
    { title: 'Relatórios Inteligentes', href: '/ia/fiscal-ambiental-digital/relatorios' },
    { title: 'Auditoria ESG', href: '/ia/fiscal-ambiental-digital/esg' },
    { title: 'Configurações', href: '/ia/fiscal-ambiental-digital/configuracoes' },
  ],
}
```

---

## 2. Estrutura de pastas

```text
src/app/(app)/ia/fiscal-ambiental-digital/
  layout.tsx
  page.tsx
  dashboard/page.tsx
  biblioteca/page.tsx
  montar-acervo/page.tsx
  linha-do-tempo/page.tsx
  comparador/page.tsx
  evidencias/page.tsx
  inteligencia/page.tsx
  monitoramento/page.tsx
  fiscalizacao/page.tsx
  relatorios/page.tsx
  esg/page.tsx
  configuracoes/page.tsx

src/components/fiscal-ambiental/
  FiscalAmbientalShell.tsx
  FiscalAmbientalHeader.tsx
  FiscalAmbientalSidebar.tsx
  FiscalProjectSelector.tsx
  FiscalWorkspaceSummary.tsx
  SatelliteArchiveCard.tsx
  SatelliteTimeline.tsx
  SatelliteMapViewer.tsx
  SatelliteCalendar.tsx
  EvidenceCard.tsx
  ChangeAnalysisCard.tsx
  MonitoringStatusCard.tsx
  FiscalFindingCard.tsx

src/lib/fiscal-ambiental/
  types.ts
  constants.ts
  permissions.ts
  routes.ts
  firestore-paths.ts
  storage-paths.ts
  validators.ts
  archive-service.ts
  workspace-service.ts
  inpe-service.ts
  timeline-service.ts
  evidence-service.ts
  monitoring-service.ts
  report-service.ts
```

---

## 3. Layout base

```tsx
// src/app/(app)/ia/fiscal-ambiental-digital/layout.tsx
import { FiscalAmbientalShell } from '@/components/fiscal-ambiental/FiscalAmbientalShell';

export default function FiscalAmbientalLayout({ children }: { children: React.ReactNode }) {
  return <FiscalAmbientalShell>{children}</FiscalAmbientalShell>;
}
```

---

## 4. Página inicial

```tsx
// src/app/(app)/ia/fiscal-ambiental-digital/page.tsx
import { redirect } from 'next/navigation';

export default function FiscalAmbientalIndexPage() {
  redirect('/ia/fiscal-ambiental-digital/dashboard');
}
```

---

## 5. Tipos base

```ts
// src/lib/fiscal-ambiental/types.ts
export type FiscalWorkspaceStatus = 'empty' | 'active' | 'monitoring' | 'archived';

export type SatelliteArchiveStatus =
  | 'draft'
  | 'queued'
  | 'building'
  | 'ready'
  | 'failed'
  | 'archived';

export type SatelliteSource =
  | 'INPE_CB2B_HRC'
  | 'INPE_CB4_PAN5M'
  | 'INPE_CB4_PAN10M'
  | 'INPE_CB4A_WPM'
  | 'INPE_CB4A_WPM_FUSED'
  | 'INPE_MUX'
  | 'MANUAL_GEOTIFF'
  | 'MANUAL_IMAGE';

export type FiscalWorkspace = {
  id: string;
  clientId: string;
  projectId: string;
  enterpriseId?: string;
  propertyId?: string;
  carCode?: string;
  name: string;
  status: FiscalWorkspaceStatus;
  aoi?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  aoiSource?: 'car' | 'project' | 'drawn' | 'shp' | 'kml' | 'manual';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};

export type SatelliteArchive = {
  id: string;
  clientId: string;
  projectId: string;
  workspaceId: string;
  name: string;
  status: SatelliteArchiveStatus;
  aoi: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  periodStartYear: number;
  periodEndYear: number;
  requestedYears: number[];
  totalScenes: number;
  totalMosaics: number;
  bestRecentMosaicId?: string;
  storageBytes?: number;
  attribution: 'CBERS/INPE' | 'Mixed';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};
```

---

## 6. Feature flags

```ts
// src/lib/fiscal-ambiental/constants.ts
export const FISCAL_AMBIENTAL_FLAGS = {
  ENABLE_ARCHIVE_BUILD: true,
  ENABLE_INPE_CB PREFERRED: true,
  ENABLE_TIMELINE: true,
  ENABLE_COMPARISON: false,
  ENABLE_INTELLIGENCE: false,
  ENABLE_FISCAL_CHECKS: false,
  ENABLE_MONITORING: false,
  ENABLE_ESG: false,
} as const;
```

Corrigir no Cursor para um nome válido:

```ts
ENABLE_INPE_CBERS: true,
```

---

## 7. Critérios de aceite da Fase 0

- Menu IA exibe Fiscal Ambiental Digital.
- Todas as rotas existem.
- Dashboard carrega sem erro.
- Biblioteca Satelital carrega vazia.
- Montar Acervo exibe wizard placeholder.
- Permissões bloqueiam ações críticas.
- Tipos base compilam.
- Build passa.
- Lint passa.
- Não há processamento INPE real ainda.

---

## 8. Prompt para Cursor

```text
Implemente a Fase 0 do Fiscal Ambiental Digital no projeto AmbientaR.
Crie a estrutura de rotas em /ia/fiscal-ambiental-digital, componentes base, tipos TypeScript, constantes, paths Firestore/Storage e item no menu IA.
Não implemente ainda processamento INPE real.
Garanta build, lint e typecheck.
```
