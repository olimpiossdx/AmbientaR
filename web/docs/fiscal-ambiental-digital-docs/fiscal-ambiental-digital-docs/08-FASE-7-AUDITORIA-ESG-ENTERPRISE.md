# Fase 7 — Auditoria ESG e Enterprise

## Objetivo

Criar uma camada executiva e empresarial sobre o Fiscal Ambiental Digital, voltada para consultorias, grupos econômicos, auditorias ambientais, bancos, compradores rurais e empresas que precisam demonstrar conformidade ambiental.

---

## 1. Rotas

```text
/ia/fiscal-ambiental-digital/esg
/ia/fiscal-ambiental-digital/esg/dashboard
/ia/fiscal-ambiental-digital/esg/indicadores
/ia/fiscal-ambiental-digital/esg/relatorio
```

---

## 2. Indicadores

```text
Cobertura vegetal atual
Evolução de cobertura vegetal
Área preservada
Área antropizada
Área em recuperação
Risco APP
Risco RL
Alertas PRODES/MapBiomas
Achados fiscais abertos
Monitoramentos em dia
Score ambiental
Score de conformidade
Score de risco
```

---

## 3. Modelo ESG

```text
projects/{projectId}/esg_snapshots/{snapshotId}
```

```ts
export type EsgSnapshotDoc = {
  id: string;
  clientId: string;
  projectId: string;
  archiveId: string;
  date: string;
  scores: {
    environmental: number;
    compliance: number;
    risk: number;
    evidenceQuality: number;
  };
  indicators: {
    vegetationCoverHa?: number;
    preservedAreaHa?: number;
    changedAreaHa?: number;
    appRiskHa?: number;
    rlRiskHa?: number;
    openFindings: number;
    criticalFindings: number;
  };
  status: 'draft' | 'ready';
  createdAt: string;
};
```

---

## 4. Dashboard

Cards:

```text
Score Ambiental
Score Conformidade
Score Risco
Área preservada
Mudanças detectadas
Alertas críticos
Última imagem analisada
Último relatório gerado
```

---

## 5. API

```text
POST /api/fiscal-ambiental/esg/snapshot
GET /api/fiscal-ambiental/esg/snapshots
GET /api/fiscal-ambiental/esg/dashboard
POST /api/fiscal-ambiental/esg/report
```

---

## 6. Critérios de aceite

- Sistema gera snapshot ESG.
- Dashboard exibe indicadores.
- Indicadores usam dados reais do acervo/análises/achados.
- Relatório ESG pode ser gerado.
- Scores têm explicação e não são caixas-pretas.

---

## 7. Prompt para Cursor

```text
Implemente a Fase 7 do Fiscal Ambiental Digital: Auditoria ESG e Enterprise.
Crie snapshots ESG, dashboard executivo, indicadores e relatório ESG com base nos dados já existentes do acervo, análises, achados e monitoramento.
```
