# Discussão — 2026-05-25 (12 itens, mapas PIA e QGIS)

Registo de refinamento **antes de nova implementação**. Referência visual: mapas e gráficos do **PIA** (anexos do utilizador) e estado do código após commit `de63002`.

---

## Objetivo desta sessão

1. **Fechar os 12 itens** da análise geoespacial automatizada (tentativa actual).
2. Avaliar como a aba **Menu IA → Análise Geoespacial** deve produzir saídas no **nível profissional** dos exemplos PIA (layout QGIS, legendas, figuras numeradas, fonte e data).
3. Definir **QGIS como motor cartográfico** (não como substituto do motor de interseção WFS/Turf no Next).

---

## Os 12 itens — definição fechada

Combinamos o **catálogo SIG MG (8 temas)** com os **4 produtos cartográficos** que o formulário PIA já pede manualmente (`pia-form-inventario.tsx`).

| # | Item | Tipo | Fonte de dados | Saída esperada (como PIA) | Estado no AmbientaR (pós `de63002`) |
|---|------|------|---------------|---------------------------|-------------------------------------|
| 1 | Hidrografia | SIG (linha/pol.) | IDE-Sisema WFS | **Mapa 3** — rede hídrica, rótulos de cursos, perímetro, legenda, escala, norte | Card + %; mini-mapa **esquemático** (SVG); não mapa QGIS |
| 2 | Bioma | SIG (pol.) | IDE-Sisema WFS | Contexto fitogeográfico; % por classe | Card + %; mini-mapa esquemático |
| 3 | Solos | SIG (pol.) | IDE-Sisema WFS | **Mapa 2** — classes de solo com legenda tipológica (GXbd1, LVAd1, RLd3…) | Card + %; falta simbologia oficial |
| 4 | Geologia | SIG (pol.) | IDE-Sisema WFS | Secção meio físico; % unidades | Card; onda B |
| 5 | Geomorfologia | SIG (pol.) | IDE-Sisema WFS | Secção meio físico | Card; onda B |
| 6 | Pedologia | SIG (pol.) | IDE-Sisema WFS | Complementa solos (secção unificada no texto IA) | Card; onda B |
| 7 | Vegetação / inventário florestal | SIG (pol.) | IDE-Sisema WFS | Cobertura/floresta; % classes | Card; onda C |
| 8 | Fauna | SIG (ponto) | IDE-Sisema WFS | Ocorrências / proximidade (não só % área) | Card; métricas por ponto |
| 9 | Clima — temperatura média mensal | **Gráfico** | API externa (ex. climate-data.org, Open-Meteo, INMET) | **Figura 1** — barras vermelhas, eixo mensal, valores no topo | Só campo texto no PIA; **não gerado** na análise geo |
| 10 | Clima — precipitação + humidade | **Gráfico** | Mesma API | **Figura 2** — barras + linha, eixo duplo, legenda | Idem |
| 11 | Topografia / hipsometria | **Mapa raster** | DEM (SRTM, ALOS, Earth Explorer) + recorte ao perímetro | **Mapa 4 / Fig. 5** — rampa de altitude, fundo satélite, legenda hipsometria | Campo texto PIA; **não no menu geo** |
| 12 | ADA / perímetro de referência | **Mapa base** | Perímetro utilizador (desenho, SHP, CAR) | **Mapa 1** — polígono ADA com grade UTM, escala, norte | Desenho no Leaflet; export sem layout QGIS |

**Contagem:** 8 camadas consultáveis + 2 gráficos climáticos + 2 mapas temáticos “premium” (solos/hidro já nas 8; clima e hipsometria são os 4 extras PIA).

---

## O que os anexos PIA exigem (padrão de qualidade)

### Gráficos climáticos (Figuras 1–2)

- Título, eixos legíveis, **valores numéricos nas barras**.
- Legenda (precipitação vs humidade).
- **Legenda de figura** formal: *“Figura N: … Fonte: Climate-data.org, extraído em DD/MM/AAAA.”*
- Não são mapas — gerar com biblioteca de gráficos (Chart.js, Recharts no PDF, ou PNG via worker Python/matplotlib).

### Mapas temáticos (Figuras 3–5)

| Elemento | Presente nos exemplos | No código actual |
|----------|----------------------|------------------|
| Imagem de fundo (satélite) | Sim | Não (só polígono SVG) |
| Grade de coordenadas (UTM) | Sim | Não |
| Barra de escala gráfica | Sim | Não |
| Seta norte | Sim | Não |
| Legenda com simbologia e nomes de classes | Sim | Não |
| Rótulos de feições (rios, unidades de solo) | Sim | Não |
| Perímetro do empreendimento destacado | Sim (tracejado/amarelo) | Sim (contorno simples) |
| Legenda de figura + fonte + data + “adaptado no QGIS” | Sim | Parcial (texto genérico no PDF) |

**Conclusão:** o gap não é só “mais uma camada WFS” — é **cartografia de produção** (layout), que o PIA já faz manualmente no QGIS.

---

## Estado da tentativa actual (honesto)

| Bloco | Feito | Falta para “12/12 utilizáveis” |
|-------|-------|--------------------------------|
| UI perímetro (CAR, coords, polígono, SHP) | Sim | KML no selector; validar SHP em produção |
| 8 cards + interseção Turf/WFS | Código + catálogo `IDE:` | **Re-teste produção** pós `de63002` (antes: 8/8 404) |
| `geo_analyses` + Etapa 2 inline | Sim | Confirmar gravação e listagem em smoke test |
| PDF factual branded | Sim (`ia-menu-branded-pdf`) | Figuras ainda esquemáticas, não estilo PIA |
| Mini-mapas | SVG perímetro (`render-minimap.ts`) | Não mostra camada SIG nem satélite |
| Complemento IA + DOCX/PDF | Sim | Só útil com JSON factual preenchido |
| Ponte RCA (`geoAnalysisId`) | Sim (laudos/new + `GeoAnalysisRcaImport`) | Preencher `GEO_*` automático ainda limitado |
| Gráficos clima + hipsometria | Não | Itens 9–11 |

---

## Prioridade para fechar os 12 (ordem sugerida)

### Fase A — Desbloquear valor SIG (itens 1–8) — **mais importante agora**

Sem isto, mapas bonitos ficam vazios.

1. **M1.11** — Smoke produção: ≥3 camadas OK no polígono ~850 ha; actualizar `REGISTRO-TESTES-PRODUCAO.md`.
2. **M1.7–M1.8** — Confirmar `geo_analyses` + Etapa 2.
3. **M1.4** — Onda A (hidro, bioma, solos) estável antes de B/C.
4. **M1.5b–e** — Uma camada B/C de cada vez (geologia → … → fauna).

### Fase B — Cartografia PIA nos itens 1, 3, 12 (mapas SIG)

5. **Worker QGIS** — ver secção abaixo; templates por tipo: `mapa_hidro`, `mapa_solos`, `mapa_perimetro`.
6. Substituir mini-mapa SVG por **PNG do worker** no PDF factual (M1.12–M1.13).

### Fase C — Itens 9–10 (clima)

7. API clima por centróide do perímetro (município ou lat/lng médio).
8. Gerar 2 PNG de gráfico + legenda de figura; anexar ao pacote `geo_analyses` e ao complemento IA.

### Fase D — Item 11 (hipsometria)

9. Pipeline DEM: download/corte → color ramp no QGIS → Figura “Mapa hipsométrico”.
10. Fonte citada como nos exemplos (Earth Explorer / SRTM + data de extração).

---

## QGIS como base — arquitetura recomendada

**Princípio:** o Next.js **não** renderiza mapas profissionais; **orquestra** e guarda resultados.

```
Perímetro + geo_analyses (JSON factual)
        │
        ▼
┌───────────────────┐     WFS/GetFeature      ┌─────────────────────┐
│ Next.js (App      │ ───────────────────────►│ GeoServer IDE-Sisema │
│ Hosting)          │     Turf: %, stats      └─────────────────────┘
│ - auth, jobs      │
│ - Firestore       │     Job + geometrias    ┌─────────────────────┐
│ - PDF montagem    │ ───────────────────────►│ Worker Cloud Run     │
└───────────────────┘     GCS in/out         │ QGIS headless        │
        ▲                                      │ - .qgz / qgis_process│
        │         PNG 300dpi + world file      │ - PyQGIS opcional    │
        └──────────────────────────────────────└─────────────────────┘
```

### O que corre onde

| Tarefa | Ferramenta | Motivo |
|--------|------------|--------|
| Interseção, %, tabelas | Turf.js + WFS no Next | Rápido, auditável, já implementado |
| Layout mapa (grade, escala, norte, legenda) | **QGIS** | Padrão PIA; irreplicável com SVG simples |
| Gráficos clima | Python/matplotlib ou JS no export PDF | Padrão Fig. 1–2 |
| DEM / hipsometria | GDAL + QGIS raster | Padrão Fig. 5 |
| SHP/KML pesado | GDAL worker (`mapas-geoprocessing-opcao-b.md`) | Não bloquear runtime Next |

### Contrato worker (proposta)

`POST /v1/render-map`

```json
{
  "jobId": "uuid",
  "templateId": "mapa_solos | mapa_hidro | mapa_hipsometria | mapa_ada",
  "perimeterGeoJson": { },
  "layers": [{ "layerId": "mg_solos", "geojsonUrl": "gs://..." }],
  "layout": { "crs": "EPSG:31983", "title": "Figura 3", "sourceCaption": "IDE-Sisema, adaptado no QGIS em ..." },
  "outputGcsPrefix": "gs://.../jobs/uuid/"
}
```

Resposta: `{ "pngUri": "...", "width": 2400, "height": 1800, "figureNumber": 3 }`.

### Ligação à aba Análise Geoespacial

1. Utilizador gera **relatório factual (8 camadas)** — mantém fluxo actual.
2. Botão **“Gerar figuras para relatório (QGIS)”** — enfileira jobs por template (prioridade: hidro, solos, perímetro).
3. PDF factual passa a embutir PNGs com legenda *Figura N* igual ao PIA.
4. Pacote `geo_analyses` guarda `figures[]` para Etapa 2, PIA e RCA (`GEO_MAPA_*`, `GEO_GRAFICO_*`).

### APIs / bases de pesquisa (sem replicar Geosisemanet)

| Necessidade | Opção | Uso |
|-------------|-------|-----|
| Camadas MG | WFS `geoserver.meioambiente.mg.gov.br/ows` | Itens 1–8 |
| Metadados | GeoNetwork IDE-Sisema | Validar typeName |
| Clima | Open-Meteo / INMET / climate-data (licença) | Itens 9–10 |
| DEM | Copernicus GEE, SRTM 1 arc-sec, ou tiles locais | Item 11 |
| Satélite fundo | Esri World Imagery (já no Leaflet) ou Sentinel no worker | Mapas 2–5 |
| IBGE contexto | API IBGE município | Futuro socioeconômico (fora dos 12) |

---

## Alinhamento PIA ↔ Menu IA ↔ Passo 3

| PIA (formulário) | Item # | Menu Análise Geoespacial | Placeholder futuro |
|------------------|--------|--------------------------|-------------------|
| Mapa 1 ADA | 12 | Perímetro + export QGIS | `{{GEO_MAPA_ADA}}` |
| Gráfico 1 Temp./Precip. | 9–10 | Nova secção “Clima” | `{{GEO_GRAFICO_CLIMA_1}}`, `{{GEO_GRAFICO_CLIMA_2}}` |
| Mapa 2 Solos | 3 | Camada `mg_solos` + render QGIS | `{{GEO_MAPA_SOLOS}}` |
| Mapa 3 Hidrografia | 1 | Camada `mg_hidrografia` + render QGIS | `{{GEO_MAPA_HIDRO}}` |
| Mapa 4 Topografia | 11 | Pipeline hipsometria | `{{GEO_MAPA_TOPOGRAFIA}}` |

O **texto** dos campos PIA continua a poder ser preenchido pela **Etapa 2 (IA)** a partir do JSON factual; as **figuras** vêm do worker QGIS + API clima.

---

## Decisões em aberto (para próxima conversa)

1. **MVP dos 12:** fechar primeiro **8 SIG + 3 mapas QGIS (ADA, solos, hidro)** e deixar clima + hipsometria para sprint seguinte?
2. **Worker:** Cloud Run com imagem QGIS+LTR vs. fila local na consultoria (MVP interno)?
3. **CRS fixo:** EPSG:31983 (SIRGAS 2000 / UTM 23S MG) em todos os layouts — confirmar com exemplos PIA.
4. **Figura numerada global** no PDF: sequência automática (Fig. 1 clima … Fig. 5 hipsometria) ou por secção do estudo?

---

## Critérios de aceite “12/12 fechados”

- [ ] Itens **1–8**: ≥6 camadas **OK** em produção no polígono teste (mínimo 3 se só Onda A).
- [ ] Itens **9–10**: 2 gráficos PNG com legenda e fonte datada.
- [ ] Itens **11–12**: 2 mapas PNG estilo PIA (hipsometria + ADA ou perímetro).
- [ ] PDF factual branded inclui todas as figuras com legenda.
- [ ] `geo_analyses.figures[]` disponível para Etapa 2 e import RCA/PIA.
- [ ] Registo em `REGISTRO-TESTES-PRODUCAO.md` com data pós-rollout `de63002`.

---

## Documentos relacionados

- Plano worker: `.cursor/plans/mapas-geoprocessing-opcao-b.md`
- Catálogo WFS: [MVP-CAMADAS-IDE-SISEMA-MG.md](./MVP-CAMADAS-IDE-SISEMA-MG.md)
- Checklist M1: [PLANO-FASES-CIRURGICAS.md](./PLANO-FASES-CIRURGICAS.md)
- Mapas de referência (detalhe): [MAPAS-REFERENCIA-PIA-QGIS.md](./MAPAS-REFERENCIA-PIA-QGIS.md)

---

## Histórico

- 2026-05-25: definição dos 12 itens, análise anexos PIA, estratégia QGIS, prioridades A–D (sem código).
