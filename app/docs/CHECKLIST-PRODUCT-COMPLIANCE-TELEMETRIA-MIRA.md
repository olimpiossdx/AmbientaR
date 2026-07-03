# Checklist — Product / Compliance — Telemetria & MIRA (IGAM-MG)

Documento de **1 página** para guiar backlog e validação antes de produção regulatória. Substituições de colunas/formato ocorrem quando o **manual oficial MIRA** for anexado ao projeto.

## 1. Produto (operacional)

| # | Item | Status |
|---|------|--------|
| 1.1 | Cadastro da outorga com `monitoringType: telemetric` e pontos com `lat`/`lng` | ☐ |
| 1.2 | Por ponto: `rtdbDeviceId`, calibração `pulsesPerLiter`, `internalDiameterM`, `miraPointCode` (quando existir) | ☐ |
| 1.3 | Por outorga: `miraStationId` e limite condicionado documentado (`condicionanteFlowLimitM3s` ou equivalente) | ☐ |
| 1.4 | Tela telemetria: mapa + lista + período (data início/fim) aplicado ao export | ☐ |
| 1.5 | Dados em Firestore `telemetryReadings` (ou RTDB + agregação → Firestore) com `timestamp` ISO UTC | ☐ |
| 1.6 | Flags de qualidade (`dataQuality`: válido / suspeito / inválido) no pipeline de tratamento | ☐ |

## 2. Dados & transparência

| # | Item | Status |
|---|------|--------|
| 2.1 | Versão de esquema visível no export (`MIRA_EXPORT_SCHEMA_VERSION`, ex. placeholder-0.3) | ☐ |
| 2.2 | CSV com cabeçalho estável + UTF-8 (BOM para Excel BR) | ☐ |
| 2.3 | Pré-visualização / contagem de linhas antes do download | ☐ |
| 2.4 | Opcional: export JSON bruto para auditoria interna | ☐ |
| 2.5 | Registro (futuro) de “arquivo enviado ao órgão” com data e responsável | ☐ |

## 3. Compliance (MIRA / IGAM)

| # | Item | Status |
|---|------|--------|
| 3.1 | Manual MIRA e comunicações IGAM arquivados e referenciados na documentação técnica | ☐ |
| 3.2 | Colunas e periodicidade do export **validadas** contra o manual (não usar apenas placeholders) | ☐ |
| 3.3 | Condicionantes da portaria mapeadas → variáveis obrigatórias no sistema | ☐ |
| 3.4 | Procedimento de calibração de campo (K pulsos/L) documentado e com data | ☐ |
| 3.5 | Metrologia / incerteza declarável onde o órgão exigir | ☐ |

## 4. Segurança & integração

| # | Item | Status |
|---|------|--------|
| 4.1 | Regras Firestore para `telemetryReadings` publicadas (`npm run deploy:rules`) | ☐ |
| 4.2 | Dispositivos sem chave estática exposta (token ou Cloud Function dedicada) | ☐ |
| 4.3 | RTDB (se usado): regras por `deviceId` + autenticação | ☐ |

## 5. Definição de pronto (MVP vs MIRA “fechado”)

- **MVP:** export MIRA-ready em CSV com schema placeholder + dados reais ou vazios + transparência de versão.  
- **MIRA fechado:** colunas, agregação temporal e canal de envio **iguais ao documento oficial** + trilha de submissão.

---

*Ver também: `docs/MONITORAMENTO-OUTORGA-TELEMETRIA.md`.*
