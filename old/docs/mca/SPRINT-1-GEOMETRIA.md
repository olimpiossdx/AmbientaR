# MCA — Sprint 1 (geometria mínima E06–E11)

**Início:** 2026-05-29 · **Pré-requisito:** [SPRINT-0-VALIDACAO.md](SPRINT-0-VALIDACAO.md) (CLI E01–E15 PASS)

---

## Objetivo

Passar de **stubs/demo (3 layers)** para **layers ouro no repositório** e fluxo UI que as usa, antes de DWG Pimenta no servidor.

Ordem técnica ([`PLANO-EXECUTIVO.md`](PLANO-EXECUTIVO.md) §8): **E06 → E08 → E09 → E10 → E07 → E11**

---

## Entregas desta sessão

| Item | Estado |
|------|--------|
| Script `npm run mca:export-gold-layers` | ✅ Gera `public/mca/gold/gold_catingueiro/layers-import.json` do pipeline offline |
| UI «Fluxo completo Catingueiro» | ✅ Importa layers ouro (fallback demo) |
| `importDemoLayers` com `presetId` | ✅ |
| Fix `topology/basic-checks.ts` (typecheck) | ✅ |

---

## Comandos

```bash
# Gerar/atualizar layers ouro Catingueiro (15 layers do pipeline)
npm run mca:export-gold-layers

# Com DWG Pimenta no disco (Sprint 1 pleno)
# MCA_GOLD_DWG_DIR=E:\refs\pimenta npm run mca:regenerate-gold-perimeters

npm run mca:verify-gold-catingueiro
npm run mca:verify-all-etapas
```

---

## UI (testar)

1. **Estudos Técnicos → Mapas**
2. **Fluxo completo Catingueiro (criar + pipeline + mapa)** — deve importar `layers-import.json` do repo se existir
3. Ver mapa unificado + PDF E13
4. Comparar com checklist manual em [E15-pass.md](debug-reports/E15-pass.md)

---

## Próximo (ainda Sprint 1)

- [ ] `MCA_GOLD_DWG_DIR` + `mca:regenerate-gold-perimeters` com CAD real
- [ ] E06 upload DWG na UI + `convert-dwg` com ogr2ogr local
- [ ] Confrontantes e split matrícula a partir de CAD (E07)
- [ ] Benchmark visual manual vs PDF Pimenta

---

*Sprint 1 — geometria; não misturar PostGIS/QGIS completo (v3) neste sprint.*
