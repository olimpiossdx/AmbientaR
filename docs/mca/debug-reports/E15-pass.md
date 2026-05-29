# E15 — CAD + release v1

- Data: 2026-05-28
- Debugger: `npm run mca:verify-gold-catingueiro` → **PASS**

## Checks

- [x] `score_final`: nota 8.4
- [x] `pipeline_ran`: 59645eac-0d04-418b-b29c-c8b7ae3801ea
- [x] `release_etapa`: etapa actual 15
- [x] `cad_layers`: 15 layers no projecto
- [x] `catingueiro_benchmark`: área 2073.62 ha (±2%) · PDF 48884 B
- [x] `perimeter_source`: mca_gold_synthetic
- [x] `visual_v4_auto`: PASS (7 checks)

## Visual v4 (automático)

- [x] `multi_matricula`: 7 matrícula(s)
- [x] `rl_compensada`: 1 gleba(s) compensada(s) · 7 linhas RL
- [x] `confrontantes`: 256 feição(ões)
- [x] `silos_pista_pouso`: SILOS sim · PISTA não
- [x] `legenda_reservas_legais`: 7 linhas na tabela RL
- [x] `carimbo_crea`: CREA 144.093/D no PDF
- [x] `pdf_size`: 48884 bytes

## Visual v4 (manual — PDF Pimenta)

- [ ] `grade_utm`: Layout JSON v2 (grade no jsPDF via map-preview-pdf)
- [ ] `expected_pivo`: 1 feição(ões) USO_PIVO · import DWG real para regressão plena

## Benchmark Catingueiro (ouro)

- perimeter_source: mca_gold_synthetic
- perimeter_file: public/mca/gold/gold_catingueiro/perimeter.geojson
- area_ha: 2073.6236 (manifest 2073.8318)
- score_final: 8.4
- pipeline_job: 59645eac-0d04-418b-b29c-c8b7ae3801ea
- layers: 15
- pdf_bytes: 48884
- demo layers: PIVO 1 < 6 (import real DWG para regressão plena)

## Perímetro real (CAD Pimenta)

Defina `MCA_GOLD_DWG_DIR` com `gold_catingueiro.dwg` e execute `npm run mca:regenerate-gold-perimeters`.

## Limitações v1

- Comparação visual pixel-a-pixel com PDF Pimenta ainda manual (`visualChecklist` no manifest).
- QGIS worker v3: bridge ReportLab activo; PyQGIS via `MCA_PYQGIS=1` (stub até imagem QGIS).
- Benchmark visual v4: `npm run mca:verify-gold-v4` ou API `POST /api/mca/gold/visual-verify`.
