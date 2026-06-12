# Fiscal Ambiental Digital — Evoluções v2

Complemento ao [PLANO-UNICO.md](./PLANO-UNICO.md) para funcionalidades pós-MVP (fases 0–7).

## 1. Cruzamento SIG (`FAD_ENABLE_SIG_CROSSCHECK`)

### O que faz

Com a flag activa, o FAD consulta bases públicas via motor geoespacial existente (`run-wave-a-analysis`):

- PRODES Cerrado, Mata Atlântica, Amazônia Legal (INPE TerraBrasilis)
- MapBiomas Alerta (incl. proxy MA quando PRODES WFS degradado)
- Embargos IBAMA no perímetro

Gera achados com `source: sig_crosscheck` em **Fiscalização** e alimenta o indicador **Alertas PRODES** no **ESG**.

### Activar

```env
FAD_ENABLE_SIG_CROSSCHECK=true
```

Reinicie o servidor / faça redeploy App Hosting.

### API

- `POST /api/fiscal-ambiental/fiscalizacao/sig-crosscheck` — body `{ "workspaceId": "..." }`
- Incluído automaticamente em `POST /api/fiscal-ambiental/fiscalizacao/run-checks` quando a flag está activa

### UI

- **Fiscalização** → botão **Cruzar PRODES/SIG** (só com flag activa)
- Achados SIG têm badge **SIG**

### Limitações

- Não inclui IDE-Sisema MG completo (~48 camadas) — apenas pacote federal focado em desmatamento/embargo
- Resultados são **indicativos**; confirme em terrabrasilis.dpi.inpe.br, MapBiomas e SISCOM

---

## 2. Scheduler de monitoramento automático

### O que faz

`POST /api/fiscal-ambiental/monitoring/scheduler/run` percorre todos os `fad_workspaces`, identifica regras **activas** com frequência ≠ `manual` cujo `lastRunAt` ultrapassou o intervalo, e executa o pipeline completo (INPE → mudanças → fiscalização).

### Autenticação

Header `x-fad-cron-secret` = valor de `FAD_MONITORING_CRON_SECRET` (mesmo padrão do MTR: `x-mtr-cron-secret`).

```env
FAD_MONITORING_CRON_SECRET=um-segredo-longo-aleatorio
```

### Cloud Scheduler (exemplo)

Substitua `APP_URL` e o segredo:

```bash
gcloud scheduler jobs create http fad-monitoring-daily \
  --location=southamerica-east1 \
  --schedule="0 6 * * *" \
  --uri="https://APP_URL/api/fiscal-ambiental/monitoring/scheduler/run" \
  --http-method=POST \
  --headers="x-fad-cron-secret=SEU_SEGREDO" \
  --attempt-deadline=300s
```

`maxDuration` da rota: **300 s**. Para muitos imóveis, aumente frequência do job ou divida por workspace (evolução futura).

### Frequências suportadas

| Valor | Intervalo aproximado |
|-------|----------------------|
| `monthly` | 30 dias |
| `bimonthly` | 60 dias |
| `quarterly` | 90 dias |
| `semiannual` | 180 dias |
| `annual` | 365 dias |
| `manual` | só execução pelo botão **Executar** na UI |

---

## 3. Worker satelital GDAL (Cloud Run)

### Melhoria v2

O worker `infra/fiscal-satellite-worker` inclui **gdal-bin** e tenta recortar o GeoTIFF STAC à AOI (`gdalwarp -cutline`). O manifest regista `mode: worker_gdal_clip` quando o recorte tem sucesso.

### Deploy

```powershell
.\scripts\deploy-fad-workers.ps1
```

Ou manualmente (ver [infra/fiscal-satellite-worker/README.md](../../infra/fiscal-satellite-worker/README.md)).

### App Hosting

```env
FISCAL_SATELLITE_WORKER_URL=https://ambientar-fiscal-satellite-....run.app
WORKER_SHARED_SECRET=...
```

Sem worker: modo **inline** na API Next (preview STAC, sem recorte GDAL).

---

## 4. Teste end-to-end (checklist)

1. `npm run dev` → http://localhost:9002
2. `npm run deploy:rules` (se pedidos de acesso / `fad_workspaces` falharem)
3. Login Firebase com role `technical` ou `admin`
4. **Início** → criar imóvel + AOI no mapa
5. **Montar acervo** → escolher ano/data verde → aguardar mosaico `ready`
6. Repetir para segunda data (comparador / inteligência)
7. **Inteligência** → detecção de mudanças entre duas imagens
8. **Fiscalização** → Sincronizar análises (+ SIG se flag activa)
9. **Relatórios** → PDF consolidado
10. **Monitoramento** → criar regra trimestral → Executar
11. **Auditoria ESG** → gerar snapshot
12. **Configurações** → confirmar workers e flags

### Variáveis opcionais para teste completo

```env
FAD_ENABLE_SIG_CROSSCHECK=true
FAD_MONITORING_CRON_SECRET=dev-cron-test
FISCAL_SATELLITE_WORKER_URL=...
FISCAL_INTELLIGENCE_WORKER_URL=...
WORKER_SHARED_SECRET=...
```

Teste do cron local:

```bash
# ou: npm run fad:cron-smoke
curl -X POST http://localhost:9002/api/fiscal-ambiental/monitoring/scheduler/run \
  -H "x-fad-cron-secret: dev-cron-test"
```

Criar job no GCP:

```powershell
$env:FAD_MONITORING_CRON_SECRET = "seu-segredo"
.\scripts\setup-fad-monitoring-scheduler.ps1 -AppUrl "https://sua-app.web.app"
```

Redeploy workers (GDAL v2):

```powershell
$env:WORKER_SHARED_SECRET = "..."
.\scripts\deploy-fad-workers.ps1
```

---

Última atualização: 2026-06-12
