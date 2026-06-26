# E15 — Benchmark visual v4 (Catingueiro)

- Data: 2026-05-29
- Comando: `npm run mca:verify-gold-v4` → **PASS** (automático)

## Checks automáticos

- [x] `multi_matricula`: 7 matrícula(s)
- [x] `rl_compensada`: 1 gleba(s) compensada(s) · 7 linhas RL
- [x] `confrontantes`: 256 feição(ões)
- [x] `silos_pista_pouso`: SILOS sim · PISTA não
- [x] `legenda_reservas_legais`: 7 linhas na tabela RL
- [x] `carimbo_crea`: CREA 144.093/D no PDF
- [x] `pdf_size`: 48887 bytes

## Revisão manual (PDF Pimenta)

- [ ] `grade_utm` — Grade UTM no mapa (jsPDF): Layout JSON v2 (grade no jsPDF via map-preview-pdf)
- [ ] `expected_pivo` — Pivôs (mín. 6): 1 feição(ões) USO_PIVO · import DWG real para regressão plena

## PDF

- Tamanho: 48887 bytes
- Texto extraído: 1200 caracteres
