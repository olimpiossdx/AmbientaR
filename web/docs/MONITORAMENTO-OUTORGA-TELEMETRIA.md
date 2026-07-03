# Monitoramento de Outorga: Manual e Telemétrico

**Checklist Product/Compliance (MIRA):** ver `docs/CHECKLIST-PRODUCT-COMPLIANCE-TELEMETRIA-MIRA.md`.

Este documento descreve o modelo de dados e os padrões adotados para o monitoramento de outorgas (Manual-Lançamento e Telemetrico-Leitura), alinhados às referências IGAM e ANA.

## Tipos de leitura

- **Manual** — Lançamento diário pelo usuário no subitem **Manual-Lançamento**. Registros em `manualMonitoringLogs` (data, horário início/fim, vazão L/s e m³/h, horímetro).
- **Telemétrica** — Dados enviados via satélite por equipamentos, traduzidos e armazenados pela aplicação. Exibição no **Telemetrico-Leitura** com mapa de situação (Google Maps) e relatórios.

No cadastro da outorga (submenu Outorgas), o campo **Tipo de leitura** define se a portaria aparece em Manual-Lançamento ou em Telemetrico-Leitura.

## Padrões IGAM e ANA

- **Unidades de vazão:** m³/s (metros cúbicos por segundo) e m³/h (metros cúbicos por hora), conforme ANA/IGAM.
- **Vazão captada:** vazão instantânea no ponto de bomba/captação (m³/s e m³/h).
- **Vazão a jusante:** monitoramento da vazão residual a jusante. Quando a captação é cortada totalmente, deve acionar **alerta vermelho**. Quando a régua a jusante fica abaixo do mínimo exigido, deve acionar **alerta laranja**.
- **Telemetria:** dados consolidados (ex.: a cada 15 minutos) podem ser transmitidos diariamente; na aplicação os dados são armazenados **segundo a segundo** (ligado/desligado da bomba, vazão instantânea, residual a jusante) para histórico e alertas.

Referências úteis:
- ANA — Declaração de Uso de Recursos Hídricos (DURH) e telemetria.
- ANA — Manual de medição de vazão em tubulações.
- Resoluções ANA e normativas estaduais (IGAM) para outorga e monitoramento.

## Modelo de dados

### Outorga (`WaterPermit`)

- `monitoringType`: `'manual' | 'telemetric'` — define onde a outorga é monitorada.
- `pontosDeMonitoramento`: array de `PontoDeMonitoramento`:
  - `id`, `nome`
  - `tipo`: `'bomba'` (ponto de captação/bomba) ou `'jusante'` (monitoramento a jusante).
  - `lat`, `lng`: coordenadas para exibição no mapa (Telemetrico-Leitura).

### Ponto de monitoramento (`PontoDeMonitoramento`)

| Campo   | Tipo     | Descrição                          |
|---------|----------|------------------------------------|
| id      | string   | Identificador único                |
| nome    | string   | Nome do ponto                      |
| tipo    | 'bomba' \| 'jusante' | Bomba/captação ou monitoramento a jusante |
| lat     | number?  | Latitude (mapa)                    |
| lng     | number?  | Longitude (mapa)                   |
| rtdbDeviceId | string? | ID do dispositivo / path RTDB   |
| pulsesPerLiter | number? | Calibração pulsos/L (YF-S201 etc.) |
| internalDiameterM | number? | Diâmetro interno tubo (m)   |
| miraPointCode | string? | Código do ponto no MIRA (IGAM) |

### Outorga — campos MIRA / condicionante (opcionais)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| miraStationId | string? | Estação no ambiente MIRA |
| condicionanteFlowLimitM3s | number? | Limite de vazão condicionado (m³/s) |

### Leitura telemétrica (`TelemetryReading`)

Dados recebidos dos equipamentos (segundo a segundo):

| Campo                | Tipo    | Descrição |
|----------------------|---------|-----------|
| outorgaId, pontoId   | string  | Referência à outorga e ao ponto   |
| timestamp            | string  | ISO (segundo a segundo)           |
| pumpOn               | boolean | Bomba ligada (true) ou desligada (false) |
| flowRateM3s          | number? | Vazão instantânea (m³/s) — IGAM/ANA |
| flowRateM3h          | number? | Vazão (m³/h) — IGAM/ANA           |
| downstreamResidualM3s| number? | Vazão residual a jusante (m³/s)   |
| downstreamMinLevelM  | number? | Nível mínimo da régua a jusante (m) |
| alertRed             | boolean?| Alerta: corte total da vazão     |
| alertOrange          | boolean?| Alerta: residual abaixo do mínimo |
| pulsesPerSecond      | number? | Pulsos na janela 1 s |
| flowRateLmin         | number? | Vazão L/min (intermediário) |
| nivelM               | number? | Nível (m) |
| ph                   | number? | pH |
| dataQuality          | 'valid' \| 'suspect' \| 'invalid'? | QC pós-tratamento |

Coleção Firestore: `telemetryReadings` (ver regras em `src/firebase/rules/firestore.rules`). Cada documento deve referenciar **exatamente um** de: `outorgaId` ou `usoInsignificanteId` (usos insignificantes telemétricos). Export CSV MIRA-ready: `src/lib/mira-export.ts`.

### Ingestão via Cloud Function

- Função HTTPS `ingestTelemetry` em `functions/index.js` (Admin SDK — ignora regras).
- Configurar segredo: `firebase functions:config:set telemetry.secret="..."` e redeploy das functions.
- Cabeçalho: `Authorization: Bearer <mesmo segredo>`.
- Ver comentários no início de `functions/index.js` para o corpo JSON esperado.

### Lançamento manual (`ManualMonitoringLog`)

Já existente; campos principais: `outorgaId`, `pontoId`, `logDate`, `startTime`, `endTime`, `flowRateLps`, `flowRateM3h`, `horimeterStart`, `horimeterEnd`.

## Estrutura sugerida para planilhas (IGAM/ANA)

Para alinhar aos modelos de planilha de monitoramento de outorga (IGAM e órgãos gestores):

### Manual-Lançamento (lançamento diário)

- Data; ponto de monitoramento; horário início/fim; vazão (L/s e m³/h); horímetro início/fim; observações.
- Exportação para planilha (XLSX) e PDF com o mesmo padrão de colunas.

### Telemetrico-Leitura (dados da telemetria)

- Timestamp (data/hora); outorga; ponto (bomba ou jusante); estado da bomba (ligada/desligada); vazão captada (m³/s, m³/h); vazão residual a jusante (m³/s); alertas (vermelho/laranja).
- Relatórios:
  - **Relatório de vazão captada:** período, pontos de bomba, vazão (m³/s e m³/h) por intervalo.
  - **Relatório de vazão a jusante:** período, pontos a jusante, residual (m³/s) e eventos de alerta.
  - **Relatório consolidado do período:** intervalo (data inicial a data final), exportação PDF e XLSX com os dados acima.

A aplicação já prevê os botões e o período (data inicial / data final) na tela Telemetrico-Leitura; a geração dos PDFs/XLSX e a persistência em `telemetryReadings` serão implementadas na fase de integração com os equipamentos e satélite.

## Mapa de situação (Telemetrico-Leitura)

- Lista rolável: apenas outorgas com `monitoringType === 'telemetric'`.
- Ao selecionar uma portaria, o mapa (Google Maps API) exibe os pontos que possuem `lat`/`lng`:
  - Ícone diferenciado para **bomba** (estado ligada/desligada quando houver dados telemétricos).
  - Ícone para **monitoramento a jusante**.
- No popup do marcador: nome do ponto, tipo, vazão instantânea (m³/s e m³/h), estado da bomba e menção aos alertas (residual/IGAM-ANA).

A chave da API Google Maps deve ser configurada em `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` no `.env`.
