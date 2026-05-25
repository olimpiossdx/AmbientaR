# Análise ambiental automatizada — documentação de refinamento

Pasta de **discussão e planeamento** (não substitui código). Serve para retomar o refinamento do módulo **Análise Geoespacial (IA)** (`/analise-ambiental`) e da visão de relatórios automatizados para estudos ambientais.

## Documentos

### Passo actual (análise geoespacial — 12 itens + QGIS)

| Ficheiro | Conteúdo |
|----------|----------|
| [DISCUSSAO-2026-05-25.md](./DISCUSSAO-2026-05-25.md) | **Ler agora:** 12 itens (8 SIG + 4 PIA), prioridades, arquitectura QGIS |
| [MAPAS-REFERENCIA-PIA-QGIS.md](./MAPAS-REFERENCIA-PIA-QGIS.md) | Especificação visual dos mapas/gráficos anexos (Fig. 1–5) |
| [O-QUE-PRECISA-PARA-ANALISE-FUNCIONAR.md](./O-QUE-PRECISA-PARA-ANALISE-FUNCIONAR.md) | **Ler primeiro:** perímetro (tu) vs layerName WFS (config) — o que subir e o que não |
| [REGISTRO-TESTES-PRODUCAO.md](./REGISTRO-TESTES-PRODUCAO.md) | **Teste real:** 850 ha OK; 8/8 camadas WFS 404; re-teste pós `de63002` pendente |
| [PLANO-ONDA-A-E-ETAPA-2.md](./PLANO-ONDA-A-E-ETAPA-2.md) | Plano Onda A → Etapa 2 |
| [ETAPA-1-E-ETAPA-2.md](./ETAPA-1-E-ETAPA-2.md) | SIG factual → complemento IA |
| [MVP-CAMADAS-IDE-SISEMA-MG.md](./MVP-CAMADAS-IDE-SISEMA-MG.md) | Catálogo 8 camadas IDE-Sisema (nomes a confirmar) |
| [COLIGACAO-DADOS-PUBLICOS.md](./COLIGACAO-DADOS-PUBLICOS.md) | Coligação de dados públicos |

### Passo 3 — Linha de montagem SaaS (estudos + licenciamento)

| Ficheiro | Conteúdo |
|----------|----------|
| [PLANO-EXECUCAO-REVISADO.md](./PLANO-EXECUCAO-REVISADO.md) | Visão fases 0–4 consolidadas |
| [PLANO-FASES-CIRURGICAS.md](./PLANO-FASES-CIRURGICAS.md) | **Execução:** uma ação → debug → próxima (~33 micro-fases) |
| [TEMPLATES-E-BRANDING-UNIFICADO.md](./TEMPLATES-E-BRANDING-UNIFICADO.md) | Templates Word em Configurações + PDF = branding Financeiro |
| [PASSO-3-LINHA-DE-MONTAGEM-SAAS.md](./PASSO-3-LINHA-DE-MONTAGEM-SAAS.md) | **Arquitetura:** Estudos técnicos, Word/PDF, PIA, inventário, licenciamento |
| [ROTEIRO-REPLICAR-SAAS.md](./ROTEIRO-REPLICAR-SAAS.md) | Blueprint para replicar em novo software / SaaS |

### Visão e histórico

| Ficheiro | Conteúdo |
|----------|----------|
| [VISAO-E-ROADMAP.md](./VISAO-E-ROADMAP.md) | Roadmap amplo |
| [DISCUSSAO-2026-05-21.md](./DISCUSSAO-2026-05-21.md) | Registo das conversas de refinamento (21/05) |
| [DISCUSSAO-2026-05-25.md](./DISCUSSAO-2026-05-25.md) | Continuação: 12 itens, mapas PIA, motor QGIS (25/05) |

## Código e docs relacionados no repo

- UI: `src/app/(app)/analise-ambiental/`
- API factual: `src/app/api/geospatial/analyze/route.ts`
- Serviço SIG (MVP): `src/lib/geospatial/geo-analysis-service.ts`
- Fluxo IA: `src/ai/flows/analise-ambiental-flow.ts`
- Inventário de fontes: `docs/INVENTARIO-SIG-MG-UNIAO-ANALISE-GEOESPACIAL.md`
- Arquitetura IA/relatórios: `docs/ARQUITETURA-IA-E-RELATORIOS.md`
- Worker SHP/KML (plano): `.cursor/plans/mapas-geoprocessing-opcao-b.md`, `infra/geo-export-worker/`

## Princípio acordado — três passos

| Passo | Nome | Estado |
|-------|------|--------|
| **1–2** | Análise geoespacial automatizada (SIG + IA) — **12 itens** | Código em `main` (`de63002`+); **refinar** WFS produção + **mapas QGIS** |
| **3** | Linha de montagem estudos → licenciamento | **Planeamento** — depende do Passo 1–2 utilizável |

1. **Etapa 1 — SIG:** % e mapas a partir de perímetro + governamental.  
2. **Etapa 2 — IA:** rascunho Word/PDF só sobre factual.  
3. **Passo 3:** cliente/fazenda + SHP temáticos → RCA/PIA/inventário → revisão → PDF → **Licenciamento**.

Revisão humana em **todas** as etapas.

Última atualização: 2026-05-25 — 12 itens, referência PIA/QGIS, commit `de63002` em `main`.
