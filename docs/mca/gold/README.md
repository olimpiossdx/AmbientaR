# Mapas ouro MCA

Datasets de referência para benchmark, regressão, score visual e treino.

| ID | Mapa | Uso principal |
|----|------|----------------|
| `gold_palmeiras` | Faz. Palmeiras (Célio Fontana) | E05–E06, layout simples |
| `gold_mangabeiras` | Faz. Mangabeiras | E09–E10, RL fracionada |
| `gold_catingueiro` | Faz. Catingueiro | E14–E15, máxima complexidade |

## Estrutura por mapa

```
gold_{id}/
  manifest.json
  perimeter.geojson    # sintético ou CAD (mca_gold_cad)
  layers-import.json   # opcional — layers reais do DWG
  referencia.pdf
  notes.md
```

## manifest.json (exemplo)

```json
{
  "id": "gold_catingueiro",
  "propertyName": "Faz. Araras, Catingueiro...",
  "areaTotalHa": 2073.8318,
  "scale": "1:17000",
  "matriculas": ["37.674", "37.671", "37.672", "37.663", "37.665", "37.664", "37.673"],
  "expected": {
    "pivoCountMin": 6,
    "appPolygonCountMin": 15,
    "rlGlebaCountMin": 20
  },
  "visualChecklist": [
    "grade_utm",
    "north_arrow",
    "scale_bar",
    "carimbo_crea",
    "quadro_informacoes",
    "legenda_reservas_legais"
  ]
}
```

Copiar PDFs do cliente para esta pasta ou referenciar caminho de rede na documentação interna (não commitar ficheiros grandes sem acordo).

## Perímetros de teste (v1)

- **UI:** botões mapas ouro preenchem formulário + perímetro circular sintético (~área do manifest, Unaí-MG).
- **Código:** `src/lib/mca/gold-perimeters.ts`
- **API:** `GET /api/mca/gold/presets`
- **Fluxo rápido:** «Fluxo completo Catingueiro» — criar projeto + pipeline E01–E15 + vista Layers.

Substituir por `perimeter.geojson` real quando DWG/PDF estiver no repo:

```bash
# Sintético escalado ao manifest (±2% área)
npm run mca:regenerate-gold-perimeters

# Com CAD Pimenta (ogr2ogr) — perímetro + layers-import.json
MCA_GOLD_DWG_DIR=E:\refs\pimenta npm run mca:regenerate-gold-perimeters

# Validar área vs manifest
npm run mca:verify-gold-manifest
npm run mca:verify-gold-catingueiro
```
