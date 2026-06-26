# Fase 6 — Monitoramento Contínuo

## Objetivo

Transformar o Fiscal Ambiental Digital em um sistema de vigilância territorial periódica.

O sistema passa a buscar novas imagens, comparar com o acervo, detectar mudanças e alertar a consultoria.

---

## 1. Rotas

```text
/ia/fiscal-ambiental-digital/monitoramento
/ia/fiscal-ambiental-digital/monitoramento/regras
/ia/fiscal-ambiental-digital/monitoramento/execucoes
/ia/fiscal-ambiental-digital/monitoramento/alertas
```

---

## 2. Frequências

```text
Mensal
Bimestral
Trimestral
Semestral
Anual
Manual sob demanda
```

---

## 3. Modelo de regra

```text
projects/{projectId}/monitoring_rules/{ruleId}
```

```ts
export type MonitoringRuleDoc = {
  id: string;
  clientId: string;
  projectId: string;
  archiveId: string;
  name: string;
  status: 'active' | 'paused' | 'archived';
  frequency: 'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'annual' | 'manual';
  checks: Array<'new_image' | 'vegetation_loss' | 'water_change' | 'soil_exposure' | 'app_rl' | 'prodes_mapbiomas'>;
  lastRunAt?: string;
  nextRunAt?: string;
  notifyUsers: string[];
  createdAt: string;
  createdBy: string;
};
```

---

## 4. Modelo de execução

```text
projects/{projectId}/monitoring_runs/{runId}
```

```ts
export type MonitoringRunDoc = {
  id: string;
  clientId: string;
  projectId: string;
  archiveId: string;
  ruleId: string;
  status: 'queued' | 'searching' | 'processing' | 'ready' | 'failed';
  startedAt: string;
  finishedAt?: string;
  newMosaicId?: string;
  comparedWithMosaicId?: string;
  analysisId?: string;
  findingIds?: string[];
  summary?: {
    hasRelevantChange: boolean;
    severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
    message: string;
  };
};
```

---

## 5. API

```text
POST /api/fiscal-ambiental/monitoring/rules
GET /api/fiscal-ambiental/monitoring/rules
PATCH /api/fiscal-ambiental/monitoring/rules/[ruleId]
POST /api/fiscal-ambiental/monitoring/run
GET /api/fiscal-ambiental/monitoring/runs
GET /api/fiscal-ambiental/monitoring/runs/[runId]
```

---

## 6. Fluxo

```text
Scheduler
↓
Buscar nova imagem INPE
↓
Se imagem nova existir, montar mosaico
↓
Comparar com última imagem boa
↓
Rodar inteligência ambiental
↓
Rodar fiscalização preventiva
↓
Gerar achados
↓
Enviar alerta
↓
Salvar execução
```

---

## 7. Alertas

Canais futuros:

```text
Notificação interna
E-mail
WhatsApp integrado futuramente
Dashboard
Tarefa na agenda
```

---

## 8. UI

Componentes:

```text
MonitoringDashboard.tsx
MonitoringRuleForm.tsx
MonitoringRuleList.tsx
MonitoringRunList.tsx
MonitoringRunDetail.tsx
MonitoringAlertCard.tsx
MonitoringCalendar.tsx
```

---

## 9. Critérios de aceite

- Usuário cria regra de monitoramento.
- Sistema executa manualmente uma regra.
- Sistema busca nova imagem.
- Sistema compara com imagem anterior.
- Sistema gera resumo.
- Sistema salva execução.
- Sistema lista alertas.

---

## 10. Prompt para Cursor

```text
Implemente a Fase 6 do Fiscal Ambiental Digital: Monitoramento Contínuo.
Crie regras de monitoramento, execuções, APIs e UI.
A primeira versão pode executar manualmente, deixando scheduler automático para etapa posterior.
Reutilize acervo, montagem INPE, inteligência e fiscalização preventiva.
```
