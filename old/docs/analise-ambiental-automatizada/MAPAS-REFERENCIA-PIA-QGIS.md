# Mapas de referência — PIA e padrão QGIS

Documento de **especificação visual** para a Análise Geoespacial (IA). Baseado nos anexos fornecidos em 2026-05-25 (gráficos climáticos + mapas de solos, hidrografia e hipsometria).

---

## 1. Gráfico — temperatura média mensal (Figura 1)

| Atributo | Especificação |
|----------|-------------|
| Tipo | Barras verticais |
| Cor série | Vermelho |
| Eixo X | Meses (Jan–Dez), abreviados |
| Eixo Y | °C, 0–30 |
| Rótulos | Valor numérico acima de cada barra (1 decimal) |
| Título | “Temp (°C)” ou equivalente |
| Legenda figura | *Figura 1: Gráfico apresentando a temperatura média mensal. Fonte: Climate-data.org, extraído em DD/MM/AAAA.* |

**Implementação sugerida:** série mensal por coordenada (centróide do perímetro) → PNG 1200×700 px → `figures[]` no `geo_analyses`.

---

## 2. Gráfico — precipitação e humidade (Figura 2)

| Atributo | Especificação |
|----------|-------------|
| Tipo | Barras (precipitação) + linha (humidade) |
| Eixo Y esquerdo | mm (0–250) |
| Eixo Y direito | Humidade 0–0,8 (ou % 0–80) |
| Cores | Barras azul escuro; linha azul claro com marcadores |
| Rótulos barras | Valor inteiro em mm no topo |
| Legenda gráfico | “Precipitação (mm)” / “Humidade (%)” |
| Legenda figura | *Figura 2: Gráfico apresentando a precipitação média mensal. Fonte: …* |

---

## 3. Mapa de solos (Figura 3 — exemplo PIA)

| Atributo | Especificação |
|----------|-------------|
| Fundo | Satélite ou neutro |
| Tema | Polígonos de classes pedológicas/solos recortados à área de estudo |
| Perímetro empreendimento | Contorno branco tracejado ou linha destacada |
| Rótulos | Códigos de unidade no mapa (ex. RLd3, LVAd1, GXbd1) |
| Legenda | Caixa inferior/direita: código + descrição completa da unidade |
| Grade | Coordenadas UTM (valores nas bordas) |
| Escala | Barra gráfica (ex. 0 – 375 – 750 m) |
| Norte | Seta simples |
| Legenda figura | *Figura 3: Mapa apresentando os solos no empreendimento e suas proximidades. Fonte: IDE-Sisema, adaptado com o uso do QGIS em DD/MM/AAAA.* |

**Dados:** camada `mg_solos` (+ opcional `mg_pedologia` em legenda agrupada).

---

## 4. Mapa hidrográfico (Figura 4 — exemplo PIA)

| Atributo | Especificação |
|----------|-------------|
| Fundo | Satélite (Esri World Imagery ou equivalente) |
| Hidrografia | Linhas azuis; cursos nomeados (ex. Ribeirão Jiboia) |
| Classes especiais | Legenda “Curso d’água enquadrado em classe especial” (linha amarela) se existir atributo |
| Perímetro | Polígono amarelo semi-transparente, borda tracejada branca |
| Elementos cartográficos | Igual mapa de solos (grade, escala, norte, legenda) |
| Legenda figura | *Figura N: Mapa hidrográfico … Fonte: IDE-Sisema, adaptado no QGIS …* |

**Dados:** `mg_hidrografia` (+ fallback massas d’água se activado no catálogo).

---

## 5. Mapa hipsométrico / topografia (Figura 5 — exemplo PIA)

| Atributo | Especificação |
|----------|-------------|
| Fundo | Satélite |
| Tema | DEM colorido (rampa azul → verde → amarelo → vermelho) |
| Recorte | Máscara ao polígono do empreendimento |
| Legenda | “Hipsometria — Altitude (m)” com rampa e valores min/max (ex. 786–926 m) |
| Perímetro | Contorno do polígono sobre o raster |
| Legenda figura | *Figura 5: Mapa hipsométrico do empreendimento. Fonte: Earth Explorer, adaptado no QGIS em DD/MM/AAAA.* |

**Dados:** raster DEM (não WFS vectorial) — worker GDAL + QGIS.

---

## 6. Checklist de layout QGIS (todos os mapas temáticos)

Para cada exportação PNG/PDF:

- [ ] Projeto em **EPSG:31983** (ou CRS do empreendimento documentado)
- [ ] Extent com margem (~10–15%) além do perímetro
- [ ] `Map grid` com anotações métricas
- [ ] `Layout` → escala gráfica em metros
- [ ] Seta norte
- [ ] Legenda vinculada às camadas activas
- [ ] `Label` nos atributos certos (nome rio, código solo)
- [ ] Caixa de texto legenda de figura (fonte 9–10 pt)
- [ ] Export PNG **≥200 dpi** (ideal 300 para PDF final)
- [ ] Nome ficheiro: `figura_{n}_{layerId}_{geoAnalysisId}.png`

---

## 7. Diferença vs. mini-mapa actual (`render-minimap.ts`)

| | Mini-mapa actual | Alvo PIA/QGIS |
|--|------------------|---------------|
| Fundo | Cinza claro | Satélite + camadas SIG |
| Camada temática | Não | Sim (recorte + simbologia) |
| Cartucho | Título só | Grade + escala + norte + legenda |
| Uso | Placeholder no PDF | Figura oficial do estudo |

**Não eliminar** o SVG de imediato — usar como fallback quando o worker falhar ou WFS indisponível.

---

## 8. Templates QGIS sugeridos (ficheiros futuros)

| templateId | Ficheiro sugerido | Camadas no projeto |
|------------|-------------------|-------------------|
| `mapa_solos` | `infra/qgis-templates/mapa_solos.qgz` | perímetro, solos IDE, pedologia opcional, satélite |
| `mapa_hidro` | `infra/qgis-templates/mapa_hidro.qgz` | perímetro, hidro linha, massa d’água opcional, satélite |
| `mapa_hipsometria` | `infra/qgis-templates/mapa_hipsometria.qgz` | perímetro, DEM raster, satélite |
| `mapa_ada` | `infra/qgis-templates/mapa_ada.qgz` | perímetro ADA, satélite |

Variáveis injectadas por script: caminho GeoJSON perímetro, GPKG/GeoJSON de interseção, texto legenda figura, data exportação.

---

## Histórico

- 2026-05-25: especificação derivada dos anexos PIA do utilizador.
