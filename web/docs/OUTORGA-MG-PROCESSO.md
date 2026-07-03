# Outorga MG — processo, códigos e legislação

Documentação de referência para o módulo **Águas / Outorgas** do AmbientaR, alinhada ao IGAM/SOUT (Minas Gerais).

## Legislação (ALMG + SIAM)

| Norma | Referência |
|-------|------------|
| Decreto 47.705/2019 | [ALMG — texto atualizado](https://www.almg.gov.br/legislacao-mineira/texto/DEC/47705/2019/?cons=1) · [SIAM idNorma=49498](http://www.siam.mg.gov.br/sla/download.pdf?idNorma=49498) |
| Portaria IGAM 48/2019 | [SIAM idNorma=49719](http://www.siam.mg.gov.br/sla/download.pdf?idNorma=49719) |
| Portaria IGAM 23/2023 | Altera prazos e usos dispensados (via SIAM) |
| Decreto 48.160/2021 | CRH — cobrança pelo uso |
| Portaria IGAM 79/2021 | [SIAM idNorma=54581](http://www.siam.mg.gov.br/sla/download.pdf?idNorma=54581) |
| Lei 22.796/2017 | Taxas em UFEMG |
| Decreto 49.072/2025 | Irrigação / outorga coletiva (Lei 24.931/2024) |

## IGAM — operação

- **SOUT / CADU:** [Orientações SOUT](https://igam.mg.gov.br/w/orientacoes-para-obtencao-de-outorga-1)
- **Custos 2026** (vigentes a partir de 01/01/2026): [Custos de Outorga](https://igam.mg.gov.br/w/custos-de-outorga) · [Taxas de processos](https://igam.mg.gov.br/web/igam/taxas-de-processos-de-outorga) (UFEMG R$ 5,7899 — Resolução SEF nº 5.969/2025)
- **Formulários e TRs:** [igam.mg.gov.br/outorga/formularios](https://igam.mg.gov.br/outorga/formularios)
- **Tabela 01 (códigos):** implementada em `src/lib/outorga-mg-catalog.ts`

## Fluxo no AmbientaR

**Escopo de menu:** pedidos e tramitação ficam em **Estudos Técnicos → Outorgas (processos)**. O menu **Documentos Ambientais** mantém Outorgas, Monitoramento e Usos Insignificantes como antes (portarias e operação).

1. **Estudos Técnicos → Outorgas (processos) → Nova outorga** — escolha obrigatória do código (Tabela 01).
2. Processo salvo em Firestore `outorga_processos` com checklist e etapas.
3. Após **deferimento** → registro em **Documentos Ambientais → Outorgas** (`outorgas` + monitoramento).

## Base jurídica (RAG)

Execute (com credencial Firebase):

```bash
node scripts/seed-outorga-knowledge-sources.mjs
```

Isso cadastra fontes `knowledge_sources` com links SIAM/IGAM para o assistente de estudos.
