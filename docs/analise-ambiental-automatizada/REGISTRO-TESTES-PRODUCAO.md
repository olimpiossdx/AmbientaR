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

**Camadas catálogo (45 total, 2026-06-11):** 37 OK, 7 sem feições no recorte, 1 erro (PRODES Mata Atlântica XML). Embargos IBAMA via PAMGIA ArcGIS (3 camadas ArcGIS OK no probe).

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
| P7 | MTR proxy | `mtr-client.ts`, `/api/mtr/*` | ✅ (requer `MTR_CHAVE_FEAM`) |

---

## APIs novas (servidor)

| Rota | Uso |
|------|-----|
| `GET /api/geo/health` | Health check IDE/SICAR/CSW |
| `GET /api/geo/ana/station?id=` | Estação ANA HidroWeb |
| `GET /api/mtr/status` | MTR configurado? (auth) |
| `POST /api/mtr/proxy` | Proxy MTR (auth + allowlist) |

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
