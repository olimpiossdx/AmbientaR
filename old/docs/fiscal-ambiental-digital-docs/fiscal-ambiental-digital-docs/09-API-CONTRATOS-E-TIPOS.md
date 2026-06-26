# API, Contratos e Tipos — Fiscal Ambiental Digital

## 1. Prefixo de API

```text
/api/fiscal-ambiental
```

---

## 2. Workspaces

```text
GET /api/fiscal-ambiental/workspace?projectId=...
POST /api/fiscal-ambiental/workspace
PATCH /api/fiscal-ambiental/workspace/[workspaceId]
```

---

## 3. Arquivos satelitais

```text
GET /api/fiscal-ambiental/archive?projectId=...
POST /api/fiscal-ambiental/archive
GET /api/fiscal-ambiental/archive/[archiveId]
PATCH /api/fiscal-ambiental/archive/[archiveId]
DELETE /api/fiscal-ambiental/archive/[archiveId]
POST /api/fiscal-ambiental/archive/build
GET /api/fiscal-ambiental/archive/status/[jobId]
```

---

## 4. INPE

```text
POST /api/fiscal-ambiental/inpe/availability
POST /api/fiscal-ambiental/inpe/search
POST /api/fiscal-ambiental/inpe/assemble
```

---

## 5. Timeline

```text
GET /api/fiscal-ambiental/timeline?projectId=...
POST /api/fiscal-ambiental/timeline
PATCH /api/fiscal-ambiental/timeline/[eventId]
DELETE /api/fiscal-ambiental/timeline/[eventId]
```

---

## 6. Evidências

```text
GET /api/fiscal-ambiental/evidence?projectId=...
POST /api/fiscal-ambiental/evidence
GET /api/fiscal-ambiental/evidence/[evidenceId]
PATCH /api/fiscal-ambiental/evidence/[evidenceId]
DELETE /api/fiscal-ambiental/evidence/[evidenceId]
```

---

## 7. Inteligência

```text
POST /api/fiscal-ambiental/intelligence/detect-changes
GET /api/fiscal-ambiental/intelligence/analysis/[analysisId]
POST /api/fiscal-ambiental/intelligence/classify-vegetation
```

---

## 8. Fiscalização

```text
POST /api/fiscal-ambiental/fiscalizacao/run-checks
GET /api/fiscal-ambiental/fiscalizacao/findings
PATCH /api/fiscal-ambiental/fiscalizacao/findings/[findingId]
```

---

## 9. Monitoramento

```text
POST /api/fiscal-ambiental/monitoring/rules
GET /api/fiscal-ambiental/monitoring/rules
PATCH /api/fiscal-ambiental/monitoring/rules/[ruleId]
POST /api/fiscal-ambiental/monitoring/run
GET /api/fiscal-ambiental/monitoring/runs
```

---

## 10. Relatórios

```text
POST /api/fiscal-ambiental/reports/generate
GET /api/fiscal-ambiental/reports/[reportId]
GET /api/fiscal-ambiental/reports/[reportId]/download
```

---

## 11. Tipo de erro padrão

```ts
export type ApiErrorResponse = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
```

---

## 12. Tipo de resposta padrão

```ts
export type ApiSuccessResponse<T> = {
  ok: true;
  data: T;
};
```
