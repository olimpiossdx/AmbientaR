# RCA — Inventário Listagens A–G

Matriz de referência para harmonização dos formulários RCA (padrão PCA).
Atualizado na Fase 0 do piloto Listagem A.

## Legenda de status

| Status | Significado |
|--------|-------------|
| **ok** | Formulário React implementado e ligado ao roteador |
| **harmonizado** | Estrutura registry + schema + prefill + listagemCode |
| **stub** | Arquivo existe mas está vazio (`intentionally blank`) |
| **legado** | Formulário React na raiz, roteador legado B–G |
| **faltando** | Sem componente ou não roteado |

## Listagem A — Atividades minerárias

| Subatividade | TR em `LISTAGEM A/RCA/` | Componente | Status |
|--------------|-------------------------|------------|--------|
| Lavra Subterrânea | `rca-lavra-subterranea.doc` | `listagem-a/rca-form-lavra-subterranea.tsx` | harmonizado |
| Lavra de rochas ornamentais | `termo-de-referencia-lavra-de-rochas-ornamentais-21.doc` | `listagem-a/rca-form-rochas-ornamentais.tsx` | harmonizado |
| Extração Areia Cascalho Argila | — | `listagem-a/rca-form-extracao-areia-cascalho.tsx` | harmonizado |
| Barragem de rejeitos e resíduos | — | `listagem-a/rca-form-barragem-rejeitos.tsx` | harmonizado |

## Listagem B — Indústria metalúrgica

| Subatividade | TR em `LISTAGEM B/RCA/` | Componente | Status |
|--------------|-------------------------|------------|--------|
| Telhas, tijolos | `formulario_rca_atividades_industriais_versao_1_2006.doc` | `listagem-b/rca-form-telhas-tijolos.tsx` | harmonizado |
| Materiais cerâmicos | geral industrial | `listagem-b/rca-form-materiais-ceramicos.tsx` | harmonizado |
| Siderurgia | geral industrial | `listagem-b/rca-form-siderurgia.tsx` | harmonizado |
| Ligas ferrosas | `rca-producao-de-ligas-ferrosas-ferro-ligas.doc` | `listagem-b/rca-form-ligas-ferrosas.tsx` | harmonizado |
| Fundidos ferro/aço | `rca-producao-de-fundidos-de-ferro-e-aco.doc` | `listagem-b/rca-form-fundidos-ferro-aco.tsx` | harmonizado |
| Fundidos não-ferrosos | `rca-producao-de-fundidos-de-nao-ferrosos.doc` | `listagem-b/rca-form-fundidos-nao-ferrosos.tsx` | harmonizado |
| Móveis | geral industrial | `listagem-b/rca-form-moveis.tsx` | harmonizado |

## Listagem C — Indústria química

| Subatividade | TR em `LISTAGEM C/RCA/` | Componente | Status |
|--------------|-------------------------|------------|--------|
| Explosivos | `formulario_rca_atividades_industriais_versao_1_2006.doc` | `listagem-c/rca-form-explosivos.tsx` | harmonizado |
| Farmacêutico | geral industrial | `listagem-c/rca-form-farmaceutico.tsx` | harmonizado |
| Papel e papelão | `rca-papel-e-papelao.doc` | `listagem-c/rca-form-papel-papelao.tsx` | harmonizado |
| Borracha | `rca-industria-da-borracha.doc` | `listagem-c/rca-form-borracha.tsx` | harmonizado |
| Couros e peles | geral industrial | `listagem-c/rca-form-couros-peles.tsx` | harmonizado |
| Plásticos | `rca-industria-de-plasticos.doc` | `listagem-c/rca-form-plasticos.tsx` | harmonizado |
| Produtos de limpeza | `rca-produtos-de-limpeza.doc` | `listagem-c/rca-form-produtos-limpeza.tsx` | harmonizado |

## Listagem D — Indústria alimentícia

| Subatividade | TR em `LISTAGEM D/RCA/` | Componente | Status |
|--------------|-------------------------|------------|--------|
| Aguardente | `01-rca-fabricacao-aguardente-cana-acucar.doc` | `listagem-d/rca-form-aguardente.tsx` | harmonizado |
| Laticínios | `formulario_rca_atividades_industriais_versao_1_2006 (1).doc` | `listagem-d/rca-form-laticinios.tsx` | harmonizado |
| Abatedouros | geral industrial | `listagem-d/rca-form-abatedouros.tsx` | harmonizado |
| Rações | geral industrial | `listagem-d/rca-form-racao-animal.tsx` | harmonizado |
| Subprodutos animal | `rca-processamento-de-subprodutos...doc` | `listagem-d/rca-form-subprodutos-animal.tsx` | harmonizado |
| Óleos e gorduras | `rca-refinacao-e-preparacao...doc` | `listagem-d/rca-form-oleos-gorduras.tsx` | harmonizado |

## Listagem E — Infraestrutura

| Subatividade | TR em `LISTAGEM E/RCA/` | Componente | Status |
|--------------|-------------------------|------------|--------|
| Rodovias | `rca-rodovias.doc` | `listagem-e/rca-form-rodovias` (activity) | harmonizado |
| Gasoduto | `rca-gasoduto-transporte-de-produtos-quimicos-e-oleodutos-e-minerodutos.doc` | `listagem-e/rca-form-gasoduto` | harmonizado |
| Recapacitação CGH/PCH | — | `listagem-e/rca-form-recapacitacao-cgh-pch` | harmonizado |
| Biogás aterro | `tr-rca-biogas.pdf` | `listagem-e/rca-form-biogas-aterro` | harmonizado |
| Biometanização RSU | `tr-rca-biometanizacao.pdf` | `listagem-e/rca-form-biometanizacao-rsu` | harmonizado |
| Tratamento térmico RSU | `tr-rca-tratamento-termico-1-11-2011.pdf` | `listagem-e/rca-form-tratamento-termico-rsu` | harmonizado |
| Barragem saneamento | `02-rca-barragem-saneamento.doc` | `listagem-e/rca-form-barragem-saneamento` | harmonizado |
| Abastecimento água | `rca - san001-.pdf` | `listagem-e/rca-form-abastecimento-agua` | harmonizado |
| Esgotamento sanitário | `rca - san001-.pdf` | `listagem-e/rca-form-esgotamento-sanitario` | harmonizado |
| Tratamento RSU | — | `listagem-e/rca-form-tratamento-rsu` | harmonizado |
| Solo urbano | `RCA_parcelamento_residencial.pdf` | `listagem-e/rca-form-solo-urbano` | harmonizado |
| Dragagem | — | `listagem-e/rca-form-dragagem` | harmonizado |

## Listagem F — Gerenciamento de resíduos e serviços

| Subatividade | TR em `LISTAGEM F/RCA/` | Componente | Status |
|--------------|-------------------------|------------|--------|
| Posto de Combustível | `03-rca-posto-revendedor-combustivel.doc` | `listagem-f/rca-form-posto-combustivel.tsx` | harmonizado |

## Listagem G — Agrossilvipastoris

| Subatividade | TR em `LISTAGEM G/RCA/` | Componente | Status |
|--------------|-------------------------|------------|--------|
| Culturas anuais/perenes/olericultura | — | `listagem-g/rca-form-culturas.tsx` | harmonizado (form completo) |
| Criação de bovinos | `05-rca-bovinocultura.doc` | `listagem-g/rca-form-bovinocultura` | harmonizado |
| Projetos agropecuários irrigados | — | `listagem-g/rca-form-irrigados` | harmonizado |
| Silvicultura e carvoejamento | `04-rca-silvicultura-carvoejamento.doc` | `listagem-g/rca-form-silvicultura` | harmonizado |
| Beneficiamento/armazenamento grãos | — | `listagem-g/rca-form-graos` | harmonizado |
| Suinocultura | — | `listagem-g/rca-form-suinocultura` | harmonizado |
| Avicultura | — | `listagem-g/rca-form-avicultura` | harmonizado |

## Listagem H — Outras atividades (Mata Atlântica)

| Subatividade | TR em `LISTAGEM H/RCA/` | Componente | Status |
|--------------|-------------------------|------------|--------|
| Supressão de vegetação – Mata Atlântica (H-01-01-1) | — | `listagem-h/rca-form-supressao-mata-atlantica.tsx` | harmonizado |

## Próximas fases

1. **Submenu RCA** — espelhar `pca-menu.ts` com atalhos por listagem/subatividade
2. **Aprofundar fichas** — alinhar campos aos TRs Word quando disponíveis em `termos de referencia/`
3. **Sync `ONLY=rca`** — pastas `LISTAGEM X/RCA/` (já suportado na API form-schema)
