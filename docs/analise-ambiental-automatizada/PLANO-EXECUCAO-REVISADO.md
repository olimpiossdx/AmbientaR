# Plano de execução revisado — repassar antes de codificar

Documento **único** para alinhar equipa antes de implementar. Integra: teste produção (404 WFS), Etapas 1–2, Passo 3, templates Word, branding Financeiro, QGIS/Python.

**Estado:** planeamento — **não executar** até validação humana deste plano.

**Execução cirúrgica (debug após cada ação):** ver [PLANO-FASES-CIRURGICAS.md](./PLANO-FASES-CIRURGICAS.md) (~33 micro-fases, M0→M4).

---

## Visão em uma página

```
[Fase 0] Templates Word + branding OK em Configurações
    ↓
[Fase 1] SIG utilizável (WFS ou cache SHP) + geo_analyses + PDF branded
    ↓
[Fase 2] Complemento IA + Word/PDF branded
    ↓
[Fase 3] Estudos: cliente/fazenda + SHP + preenchimento + DOCX + revisão + PDF branded
    ↓
[Fase 4] Licenciamento: anexos + inventário → PIA
```

---

## Fase 0 — Base documental (tu fazes upload; dev valida)

| # | Entrega | Responsável | Critério de pronto |
|---|---------|-------------|-------------------|
| 0.1 | Imagens branding (header, footer, watermark) em Configurações | Consultoria | PDF teste Financeiro OK |
| 0.2 | `template.docx` por tipo piloto: **RCA**, **PIA**, inventário florestal | Consultoria | Ficheiros em `public/templates/{slug}/` |
| 0.3 | Placeholders no Word alinhados a `docs/PLACEHOLDERS-DOCX.md` + `GEO_*` | Consultoria + doc | Lista conferida |
| 0.4 | Pasta termos de referência indexada (RAG) ligada ao tipo RCA | Consultoria | Ver `FLUXO-TEMPLATES-TERMOS-RAG.md` |

**Não avançar Fase 1** sem pelo menos **RCA** + branding visual aprovados num PDF de teste.

---

## Fase 1 — Análise geoespacial utilizável (Passo actual)

| # | Entrega técnica | Depende de | Critério de pronto |
|---|-----------------|------------|-------------------|
| 1.1 | Catálogo WFS com `layerName` **confirmados** (GeoNetwork) | 0.x | ≥3 camadas OK em polígono teste |
| 1.2 | Fallback: cache SHP oficial MG (se WFS instável) | 1.1 | Camada indisponível → mensagem + fonte alternativa |
| 1.3 | `geo_analyses` gravado com `empreendimentoId` | Auth + rules | Etapa 2 lista análise após gerar |
| 1.4 | PDF factual **branded** (já parcialmente feito) | 0.1 | Igual padrão Financeiro |
| 1.5 | Figuras estilo PIA (mapas QGIS + gráficos clima) | Worker QGIS + API clima | Ver [MAPAS-REFERENCIA-PIA-QGIS.md](./MAPAS-REFERENCIA-PIA-QGIS.md); 12 itens em [DISCUSSAO-2026-05-25.md](./DISCUSSAO-2026-05-25.md) |

**Registo teste actual:** 850 ha OK; 8/8 WFS 404 — ver `REGISTRO-TESTES-PRODUCAO.md`.

---

## Fase 2 — Complemento IA (Etapa 2)

| # | Entrega | Critério de pronto |
|---|---------|-------------------|
| 2.1 | Painel Etapa 2 na análise geoespacial (todos perfis estudo) | Carrega `geo_analyses` salvo |
| 2.2 | Word complemento (.docx) com secções fixas | Técnico edita sem perder branding textual |
| 2.3 | PDF complemento **branded** | Cabeçalho/marca d’água/rodapé |
| 2.4 | IA só lê JSON factual — sem WFS | Prompt auditável |

---

## Fase 3 — Linha de montagem estudos (Passo 3)

| # | Entrega | Critério de pronto |
|---|---------|-------------------|
| 3.0 | Seletor **cliente + fazenda** no formulário RCA | Dados cadastro preenchidos |
| 3.1 | Upload SHP/KML: ADA, APP, RL, cursos, barragens | Geometrias no empreendimento |
| 3.2 | Botão “Importar análise geoespacial” no RCA | Preenche `GEO_*` e blocos |
| 3.3 | Geração **DOCX** a partir de `template.docx` | Download editável |
| 3.4 | Mapas estilo QGIS (Python/GDAL/worker) | PNG no DOCX/PDF |
| 3.5 | Fluxo revisão → status `aprovado` | Só então PDF final |
| 3.6 | PDF estudo **branded** (obrigatório) | Igual Financeiro |

Detalhe: `PASSO-3-LINHA-DE-MONTAGEM-SAAS.md`.

---

## Fase 4 — Licenciamento integrado

| # | Entrega | Critério de pronto |
|---|---------|-------------------|
| 4.1 | Processo intervenção por cliente com anexos | PDF RCA/PIA listados |
| 4.2 | Inventário florestal → dados no PIA | Sem redigitar parcelas |
| 4.3 | PIA aprovado → anexo no licenciamento | Um clique “usar PDF aprovado” |

---

## Padrão transversal: branding (não negociável)

**Todos** os PDFs exportados pelos submenus de **Estudos técnicos** e **Análise geoespacial**:

- `createMmBrandedPdfSession` + marca d’água + cabeçalho + rodapé em todas as páginas.
- Mesmas imagens que **Financeiro** (`public/branding/`).

Ver `TEMPLATES-E-BRANDING-UNIFICADO.md`.

**Word:** base editável; **PDF:** identidade visual oficial.

---

## Stack técnica (confirmada)

| Necessidade | Ferramenta |
|-------------|------------|
| Interseção web | Turf.js |
| WFS / cache | GeoServer MG ou SHP + GDAL |
| Mapas produção | Python, GDAL, QGIS (batch/worker) |
| Word | docxtemplater + templates `public/templates/` |
| PDF branded | jsPDF + `pdf-branding-layout.ts` |
| IA | Genkit + RAG (`knowledge_sources`) |

---

## Riscos e ordem de não-fazer

1. **Não** iniciar Passo 3 completo antes de Fase 1 utilizável (senão RCA com texto genérico).
2. **Não** criar branding separado para estudos.
3. **Não** publicar PDF para órgão sem status `aprovado` + branding.
4. **Não** assumir nomes WFS do catálogo actual sem validação (404 em produção).

---

## Documentação de apoio (índice)

| Ficheiro | Uso |
|----------|-----|
| [README.md](./README.md) | Índice geral |
| [REGISTRO-TESTES-PRODUCAO.md](./REGISTRO-TESTES-PRODUCAO.md) | Evidência do teste |
| [TEMPLATES-E-BRANDING-UNIFICADO.md](./TEMPLATES-E-BRANDING-UNIFICADO.md) | Word + PDF branded |
| [PASSO-3-LINHA-DE-MONTAGEM-SAAS.md](./PASSO-3-LINHA-DE-MONTAGEM-SAAS.md) | Arquitetura Passo 3 |
| [ROTEIRO-REPLICAR-SAAS.md](./ROTEIRO-REPLICAR-SAAS.md) | Futuro SaaS dedicado |
| [../PLACEHOLDERS-DOCX.md](../PLACEHOLDERS-DOCX.md) | Placeholders |
| [../FLUXO-TEMPLATES-TERMOS-RAG.md](../FLUXO-TEMPLATES-TERMOS-RAG.md) | TR ↔ templates |

---

## Checklist “OK para começar a codificar”

Marque quando a equipa concordar:

- [ ] Fase 0: templates RCA (mínimo) carregados
- [ ] Branding aprovado visualmente (PDF = Financeiro)
- [ ] Prioridade Fase 1 (WFS) aceite — incluindo plano B cache SHP
- [ ] Passo 3 começa por RCA apenas (não todos os estudos de uma vez)
- [ ] Regra PDF branded aceite para todos os exports

---

## Histórico

- Plano consolidado após refinamento: templates Configurações, branding = Financeiro, revisão antes de executar.
