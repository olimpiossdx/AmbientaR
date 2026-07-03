# Registo de testes em produção / uso real

Documento vivo para refinamento. **Não substitui código** — regista o que o utilizador viu na app para orientar correções futuras e o roteiro SaaS.

Última entrada: execução plano **P0–P7** (2026-06-11) com polígono fixture `fixtures/geo/test-polygon-mg-850ha.geojson`.

**Correcção técnica (2026-05-22):** endpoint WFS correcto é `https://geoserver.meioambiente.mg.gov.br/ows` (não `/geoserver/ows`). typeNames com prefixo `IDE:`.

**Probe automático:** `npm run geo:probe` → `docs/analise-ambiental-automatizada/geo-probe-report.json`

**Sync GeoNetwork:** `npm run geo:sync-catalog` → `geo-catalog-sync-report.json`

---

## Resultado P0 (2026-06-11)

| Serviço | HTTP | Notas |
|---------|------|-------|
| IDE-Sisema WFS | 200 | OK |
| SICAR WFS | 200 | OK |
| IBAMA SISCOM WFS | 404 | Embargos migrados para **PAMGIA ArcGIS REST** |
| ICMBio INDE WFS | 200 | OK |
| MMA INDE WFS | 200 | OK |
| TerraBrasilis PRODES | 200 | OK |
| GeoNetwork CSW | 200 | OK |

**Camadas catálogo (48 total, probe 2026-06-12):** 41 OK | 5 sem feições | 1 degradado (PRODES MA uid) | 1 erro (PRODES Cerrado timeout). Novas MG: `mg_app_hidrica_mapcar` (80 feat), `mg_licenciamento_municipal`, `mg_empreendimentos_licenciados` (36 feat).

**Contexto factual:** `zeeContext` + `hidrologiaContext` (estações ANA num raio de 50 km) no resultado da análise.

**GeoNetwork sync:** REST `_search` devolve HTTP 403; fallback CSW GetRecords + filtro local (17 sugestões em `geo-catalog-sync-report.json`).

---

## Checklist P0–P7

| Fase | Item | Entregável | Status |
|------|------|------------|--------|
| P0 | Probe + fixture | `scripts/geo-probe.ts`, `fixtures/geo/...` | ✅ |
| P0 | ADR catálogo | `ADR-GEO-CATALOG.md` | ✅ |
| P1 | ZEE + outorgas MG | `WAVE_H_LAYERS` em `wave-a-catalog.ts` | ✅ |
| P2 | ICMBio INDE | `wave-icmbio-catalog.ts` | ✅ |
| P2 | Embargos PAMGIA | `PAMGIA_EMBARGOS_LAYER_URL` | ✅ |
| P3 | SICAR health | `sicar-health.ts`, `/api/geo/health` | ✅ |
| P4 | GeoNetwork client | `geonetwork-client.ts`, `sync-geo-catalog.ts` | ✅ |
| P5 | MMA INDE + CKAN refs | `wave-mma-catalog.ts` | ✅ |
| P6 | ANA HidroWeb | `ana-hidroweb-client.ts`, `/api/geo/ana/station` | ✅ |
| P7 | MTR proxy + UI | `mtr-client.ts`, `/api/mtr/*`, `/studies/mtr` | ✅ (homolog requer `MTR_CHAVE_FEAM`) |
| P5+ | zeeContext JSON | `geo-national-context.ts` | ✅ |
| P6+ | ANA raio 50 km | `buildHidrologiaContext`, `/api/geo/ana/stations/near` | ✅ |

---

## APIs novas (servidor)

| Rota | Uso |
|------|-----|
| `GET /api/geo/health` | Health check IDE/SICAR/CSW |
| `GET /api/geo/ana/station?id=` | Estação ANA HidroWeb |
| `GET /api/mtr/status` | MTR configurado? (auth) |
| `POST /api/mtr/proxy` | Proxy MTR (auth + allowlist) |
| `GET /api/geo/ana/stations/near?bbox=` | Estações ANA num raio (default 50 km) |

---

## Registo histórico (teste 850 ha — antes da correcção WFS)

| Aspecto | Resultado |
|---------|-----------|
| Camadas WFS (8) antigas | Todas indisponíveis (404 `/geoserver/ows`) |
| Após correcção + probe 2026-06 | Maioria OK no GeoServer MG |

---

## Próximo passo manual

1. Definir `MTR_CHAVE_FEAM` em `.env.local` para testar proxy MTR em homologação.
2. Correr `npm run geo:probe` após cada alteração ao catálogo.
3. Validar análise factual na UI com polígono fixture (~850 ha).
4. **Localizador CAR/GPS (após G0-min):** ver [PLANO-LOCALIZADOR-CAR-GPS-SOCIOAMBIENTAL.md](./PLANO-LOCALIZADOR-CAR-GPS-SOCIOAMBIENTAL.md) — REF-01-A/B abaixo.

---

## Gate G0-min (antes de L1.1)

| # | Critério | Passou? | Data |
|---|----------|---------|------|
| G0.1 | REF-01-A verificado no portal CAR (área anotada) | | |
| G0.2 | Pacote socioambiental + polígono teste ≥1 camada OK | | |
| G0.3 | ≥1 camada federal OK (SICAR ou embargos) | | |
| G0.4 | `npm run geo:probe` SICAR 200 | ✅ P0 | 2026-06 |
| G0.1 | REF-01-A via `npm run geo:resolve-car-test` | ✅ | 2026-06-11 |
| G0.2 | Pacote + polígono ≥1 camada OK | _pendente UI_ | |
| G0.3 | ≥1 camada federal OK | ✅ probe SICAR 120 feat | 2026-06 |

---

## Referências CAR — localizador (Unaí / MG — IBGE 3170404)

Município IBGE **3170404** = **Unaí / MG**. Usar **após G0-min**; áreas validadas L1.1 (2026-06-11).

| ID | CAR / teste | Fase | areaHa (resolver) | Notas | Passou? |
|----|-------------|------|-------------------|-------|---------|
| REF-01-A | `MG-3170404-3DBDB334242844B392639D3237B27E10` | L1 | **1139,53** | Unaí/MG; sicar; confiança alta | ✅ T1 |
| REF-01-B | `MG-3170404-CB2D550172B2405AAA6CF6479E2215B1` | L1 | **940,14** | Unaí/MG; par ambiguidade D2 | ✅ T1b |
| REF-02 | Centróide REF-01-A | L1/L2 | — | T3 → A; `geo:resolve-car-test` ✅ | ✅ |
| REF-02-ambig | Ponto entre A e B | L2 | — | D2 | |
| REF-07 | CAR SP ou GO | L2 | _preencher_ | T18: Localizar OK; Executar MG bloqueado (D9) | ✅ auto GO-5219902… |

### L4 — Rollout localizador

| ID | Entrega | Estado |
|----|---------|--------|
| L4.1 | `/analise-ambiental` — localizador + card L3 (nacional, confirma fora MG) | ✅ L4.6 unificado 2026-06-11 |
| L4.2 | Licenciamento — CAR/localização em nova solicitação + edit | ✅ código 2026-06-11 |
| L4.3 | Georeferenciamento — CAR/campo + trâmite + detalhe processo | ✅ código 2026-06-11 |
| L4.4 | CRM — oportunidade com GPS/campo (`localizacaoImovel`) | ✅ código 2026-06-11 |
| L4.5 | Hook `useImovelLocalizador` + pacote socioambiental (localizador L2 no wizard) | ✅ código 2026-06-11 |
| L4.6 | `/analise-ambiental` — unificação UI via `ImovelLocalizadorPanel` (elimina duplicação CAR/coord/GPS) | ✅ código 2026-06-11 |
| L4.7 | Página `/georeferenciamento/historico-car` + item menu **Histórico CAR** | ✅ código 2026-06-11 |
| L5.0 | Conecta Gov — API `/api/geospatial/conecta-gov/demonstrativo` (503 sem credenciais) | ✅ scaffold 2026-06-11 |
| L5.1 | Snapshots CAR Firestore `car_snapshots/{cod}/records` | ✅ código 2026-06-11 |
| L5.2 | UI Histórico CAR + critério `car_historico_omissao` no pacote | ✅ código 2026-06-11 |
| L5.3 | Conecta Gov no card confirmação + persistência APP/RL em trâmites | ✅ código 2026-06-11 |
| L5.4 | Histórico CAR + Conecta Gov em licenciamento / análise geoespacial | ✅ código 2026-06-11 |

| ID | Entrega | Estado |
|----|---------|--------|
| L3.1 | `ImovelLocalizadorConfirmacao` | ✅ |
| L3.2 | Estados 0 / 1 / N imóveis | ✅ |
| L3.3 | Layout mobile (mapa → dados → sticky Confirmar) | ✅ |
| L3.4 | Link car.gov.br nova aba (D6) | ✅ |
| L3.5 | PDF metadados localização | ✅ |
| L3.6 | Banner D9 no card (UF ≠ MG) | ✅ |

Checklist por entrada:

```
[ ] Data __  Fase L__  REF-__
[ ] areaHa __ (esperado __)  perimetroFonte __
[ ] Print / JSON  Passou? Sim/Não
```
