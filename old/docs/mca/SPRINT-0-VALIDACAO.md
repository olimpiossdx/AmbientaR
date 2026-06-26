# MCA — Sprint 0 (validação E01–E15)

**Data:** 2026-05-29  
**Objetivo:** validar o Motor Cartográfico nas **15 etapas** antes de Sprint 1 (geometria DWG real).  
**Roteiro UI:** [`TESTING.md`](TESTING.md) · **Plano:** [`PLANO-EXECUTIVO.md`](PLANO-EXECUTIVO.md) §8 Sprint 0

---

## Resumo executivo

| Camada | Estado |
|--------|--------|
| **CLI E01–E15** | ✅ `npm run mca:verify-all-etapas` — PASS (2026-05-29) |
| **Health API (E02)** | ✅ `GET /api/mca/health` → 200, 72 agentes, behaviorRegistry 4 |
| **Benchmark ouro (E15)** | ✅ `mca:verify-gold-catingueiro` + visual v4 (7 auto, 2 manual) |
| **Registry v2** | ✅ `mca:verify-registry` |
| **Fundação v3** | ✅ `mca:verify-v3` (PostGIS/QGIS worker **não** configurados — esperado) |
| **UI manual (7 passos)** | ⏳ **Pendente** — executar no browser (checklist abaixo) |
| **Relatórios** | `docs/mca/debug-reports/E01-pass.md` … `E15-pass.md` actualizados pelo CLI |

> **Regra:** PASS em CLI ≠ folha idêntica ao PDF Pimenta. Sprint 0 confirma que a **estrutura das 15 etapas** funciona; Sprint 1 trata geometria CAD real.

---

## Matriz das 15 etapas (Sprint 0)

| Etapa | Nome | Debugger CLI | Relatório | Gate Sprint 0 (CLI) | UI / manual |
|-------|------|--------------|-----------|---------------------|-------------|
| **E01** | Especificação Pimenta | `mca:verify-etapa -- 01` | [E01-pass.md](debug-reports/E01-pass.md) | ✅ 4 ficheiros spec | — |
| **E02** | Infraestrutura + health | `verify-etapa 02` + health HTTP | [E02-pass.md](debug-reports/E02-pass.md) | ✅ health 200 · 72 agentes | Barra «MCA OK» na página Mapas |
| **E03** | Registry + DAG | `verify-etapa 03` | [E03-pass.md](debug-reports/E03-pass.md) | ✅ DAG 72 agentes | Debugger → Bug **E03** → PASS |
| **E04** | UI wizard + projetos | offline + CRUD | [E04-pass.md](debug-reports/E04-pass.md) | ✅ McaWorkbench + API | Criar/listar projeto |
| **E05** | Perímetro + CRS | offline pipeline | [E05-pass.md](debug-reports/E05-pass.md) | ✅ 2073,62 ha · EPSG:31983 | Desenhar/importar + **Guardar perímetro**; Bug **E05** PASS |
| **E06** | DWG / import layers | offline | [E06-pass.md](debug-reports/E06-pass.md) | ✅ import 3 layers (demo/gold) | Upload DWG ou preset Catingueiro |
| **E07** | Fundiário | offline | [E07-pass.md](debug-reports/E07-pass.md) | ✅ 7 matrículas · confrontantes | Meta matrículas no formulário |
| **E08** | Hidrografia | offline | [E08-pass.md](debug-reports/E08-pass.md) | ✅ HYD_CORREGO, HYD_VEREDA | Layers no mapa unificado (se pipeline UI) |
| **E09** | Uso e ocupação | offline | [E09-pass.md](debug-reports/E09-pass.md) | ✅ ~1013 ha uso · tabela 3 linhas | Tabela uso na UI pós-pipeline |
| **E10** | APP + RL | offline | [E10-pass.md](debug-reports/E10-pass.md) | ✅ APP + RL áreas | Tabelas APP/RL |
| **E11** | Infraestrutura mapa | offline | [E11-pass.md](debug-reports/E11-pass.md) | ✅ SEDE, SILOS, PATIO | — |
| **E12** | Layout cartográfico | offline + layout JSON | [E12-pass.md](debug-reports/E12-pass.md) | ✅ 12 fragmentos · Layout JSON v2 | Download layout JSON (opcional) |
| **E13** | PDF técnico | PDF buffer offline | [E13-pass.md](debug-reports/E13-pass.md) | ✅ ~49 KB PDF | Botão **PDF técnico (E13)** |
| **E14** | IA (rascunho) | offline stub | [E14-pass.md](debug-reports/E14-pass.md) | ✅ MapBiomas/SAM skipped | Sem crash no pipeline |
| **E15** | CAD + release | gold benchmark | [E15-pass.md](debug-reports/E15-pass.md) | ✅ score 8,4 · 15 layers | Toast nota final; legado opcional |

**Comando único (todas as etapas):**

```bash
npm run mca:verify-all-etapas
```

**Por etapa (E01–E04 só ficheiros; E05+ corre pipeline offline):**

```bash
npm run mca:verify-etapa -- 01
# … até …
npm run mca:verify-etapa -- 15
```

---

## Comandos Sprint 0 (executados 2026-05-29)

```bash
npm run mca:verify-all-etapas    # E01–E15 + debug-reports
npm run mca:verify-registry      # Behavior Registry v2
npm run mca:verify-gold-catingueiro
npm run mca:verify-gold-v4
npm run mca:verify-v3
curl http://localhost:9002/api/mca/health
```

**Health (amostra):**

```json
{
  "status": "ok",
  "service": "mca",
  "version": 3,
  "agents": 72,
  "behaviorRegistry": 4,
  "postgis": false,
  "qgisWorkerOk": false
}
```

---

## Checklist UI — 7 passos × 15 etapas

Marcar no browser após `npm run dev` e login (`technical`, `admin`, `gestor`, `supervisor`, `diretor_fauna` ou `advogado`).

### Pré-requisitos

- [ ] App em http://localhost:9002
- [ ] `npm run deploy:rules` (se `permission-denied`)
- [ ] Firebase Admin no `.env.local` (se pipeline/PDF der **500**)
- [ ] Health OK (ver acima)

### Passos

| # | Passo TESTING.md | Etapas cobertas | [ ] OK |
|---|------------------|-----------------|--------|
| 1 | Login → **Estudos Técnicos → Mapas** | E02, E04 | |
| 2 | Perímetro (desenho / KML / preset ouro) | **E05** | |
| 3 | Criar projeto + **Guardar perímetro** | E04, E05 | |
| 4 | **Pipeline completo (E01–E15)** | **E06–E15** (agentes E05–E15 no registry) | |
| 5 | **PDF técnico (E13)** | E13 | |
| 6 | Debugger **E03** + **E05** PASS | E03, E05 | |
| 7 | Export legado (opcional) | — | |

**Nota:** o botão «Pipeline completo» executa agentes das etapas **E05–E15**; **E01** é só documentação (verificada por `verify-etapa 01`).

### Aba Revisão (v2, se activa)

- [ ] Itens em `mca_reviews` visíveis
- [ ] PDF sem aprovação → 428 «Revisão pendente»
- [ ] Após aprovar → PDF descarrega

---

## Itens manuais ainda abertos (não bloqueiam Sprint 0 CLI)

| Item | Etapa | Acção |
|------|-------|--------|
| Grade UTM vs PDF Pimenta | E12/E13 | Comparar PDF lado a lado |
| Pivôs reais (6+) | E09/E15 | `MCA_GOLD_DWG_DIR` + `mca:regenerate-gold-perimeters` (Sprint 1) |
| QGIS worker | v3 | `MCA_QGIS_WORKER_URL` (Sprint 4+) |
| PostGIS | v3 | Configuração ambiente |

Ver [E15-pass.md](debug-reports/E15-pass.md) e [E15-visual-v4.md](debug-reports/E15-visual-v4.md).

---

## Template de erro (se a UI falhar)

```text
1. Passo: (ex. Pipeline passo 4 — etapas E06–E15)
2. Ambiente: dev local
3. Role:
4. deploy:rules feito? sim/não
5. Firebase Admin configurado? sim/não
6. projectId:
7. Mensagem exacta:
8. Esperado vs obtido:
```

---

## Próximo passo após Sprint 0

1. Completar checklist UI acima (marcar na cópia local ou responder com projectId).
2. **Sprint 1:** E06 → E08 → E09 → E10 → E07 → E11 com DWG Pimenta real (`PLANO-EXECUTIVO` §8).

---

*Gerado no Sprint 0 — validação estrutural das 15 etapas MCA.*
