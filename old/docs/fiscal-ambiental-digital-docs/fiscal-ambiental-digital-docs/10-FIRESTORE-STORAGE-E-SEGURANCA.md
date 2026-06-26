# Firestore, Storage e Segurança — Fiscal Ambiental Digital

## 1. Firestore

Estrutura principal:

```text
clients/{clientId}/projects/{projectId}/fiscal_workspace/main
clients/{clientId}/projects/{projectId}/satellite_archives/{archiveId}
clients/{clientId}/projects/{projectId}/satellite_archives/{archiveId}/mosaics/{mosaicId}
clients/{clientId}/projects/{projectId}/environmental_timeline/{eventId}
clients/{clientId}/projects/{projectId}/evidence_items/{evidenceId}
clients/{clientId}/projects/{projectId}/change_analyses/{analysisId}
clients/{clientId}/projects/{projectId}/fiscal_findings/{findingId}
clients/{clientId}/projects/{projectId}/monitoring_rules/{ruleId}
clients/{clientId}/projects/{projectId}/monitoring_runs/{runId}
clients/{clientId}/projects/{projectId}/smart_reports/{reportId}
clients/{clientId}/projects/{projectId}/esg_snapshots/{snapshotId}
```

---

## 2. Storage

```text
clients/{clientId}/projects/{projectId}/fiscal-ambiental/
  archives/{archiveId}/
    manifest.json
    mosaics/{mosaicId}/
      preview.webp
      mosaic_rgb.tif
      thumbnail.jpg
      manifest.json
  analyses/{analysisId}/
    change_mask.tif
    change_polygons.geojson
    preview.webp
    manifest.json
  evidences/{evidenceId}/
    evidence.json
    attachments/
  reports/{reportId}/
    report.pdf
    report.html
    assets/
  monitoring/{runId}/
    manifest.json
```

---

## 3. Regras de segurança conceituais

- Cliente Gestão pode visualizar apenas projetos autorizados.
- Técnico pode criar acervos.
- Advogado pode visualizar evidências e gerar relatórios.
- Admin pode excluir acervos.
- GeoTIFF deve ter URL assinada temporária.
- Manifests técnicos não devem aparecer para usuário leigo por padrão.

---

## 4. Índices sugeridos

```text
satellite_archives: projectId + status + createdAt
mosaics: archiveId + year + quality
change_analyses: projectId + status + createdAt
fiscal_findings: projectId + severity + status
monitoring_runs: projectId + startedAt + status
smart_reports: projectId + type + createdAt
```

---

## 5. Auditoria

Toda ação relevante deve registrar:

```ts
type AuditInfo = {
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
  deletedAt?: string;
  deletedBy?: string;
};
```
