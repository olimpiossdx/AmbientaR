# Estudo de Cavidades — Licenciamento ambiental em Minas Gerais

Documento de referência para o módulo **Estudos Técnicos → Estudo de Cavidades** no AmbientaR. Atualizado com base em normas SEMAD/SISEMA, FEAM, CECAV/ICMBio e prática de pareceres SUPRAM.

## 1. Marco legal

### Federal

| Norma | Conteúdo |
|-------|----------|
| [CONAMA 347/2004](https://conama.mma.gov.br/index.php?id=23425&option=com_sisconama&task=documento.download) | Patrimônio espeleológico, CANIE, licenciamento prévio |
| Decreto 6.640/2008 | Relevância, impactos irreversíveis, compensação |
| [IN MMA 02/2017](https://www.gov.br/mma/pt-br) | Metodologia de grau de relevância (máximo, alto, médio, baixo) |
| Decreto 10.935/2022 | Proteção de cavidades; validação pelo órgão licenciador |
| [CECAV — estudos](https://www.gov.br/icmbio/pt-br/assuntos/centros-de-pesquisa/cavernas/orientacoes-e-procedimentos/estudosespeleologicos) | Prospecção, ADA, 250 m, GPS |

### Estadual (MG)

| Norma | Conteúdo |
|-------|----------|
| [DN COPAM 217/2017](https://www.siam.mg.gov.br/sla/download.pdf?idNorma=45558) | Classe + critérios locacionais → modalidade LAS/LAC/LAT |
| [Decreto 47.383/2018](https://www.siam.mg.gov.br/sla/download.pdf?idNorma=45918) | Licenciamento; pedido de **não incidência** de critérios (art. 35) |
| [Decreto 47.041/2016](https://www.almg.gov.br/legislacao-mineira/texto/DEC/47041/2016/) | Indenização/compensação espeleológica em MG |
| **IS SISEMA 08/2017** | Procedimentos para impactos em cavidades e áreas de influência |
| [IS SEMAD 06/2019 rev.01](https://meioambiente.mg.gov.br/documents/d/semad/is-06-2019-rev01-pdf?download=true) | Uso do SLA, enquadramento, dispensa EIA/RIMA |

### Critério locacional (DN 217, Tabela 4)

> Localização prevista em área de **alto ou muito alto** grau de potencialidade de ocorrência de cavidades, conforme dados oficiais do **CECAV-ICMBio** — **Peso 1**.

- Camada IDE-Sisema: [Potencialidade de ocorrência de cavidades](https://idesisema.meioambiente.mg.gov.br/geonetwork/srv/api/records/15d09272-da9f-4ea1-8995-b496da17a3aa)
- Área de influência inicial (250 m provisório): [metadado IDE](https://idesisema.meioambiente.mg.gov.br/geonetwork/srv/api/records/c0decd5f-4308-46bd-8145-98fac2e922b0) — **não substitui** prospecção (IS 08/2017)

## 2. Consulta pública (sem senha)

| Canal | URL |
|-------|-----|
| EcoSistemas SLA (visitante) | https://ecosistemas.meioambiente.mg.gov.br/sla/#/acesso-visitante |
| SIAM (até 04/11/2019) | https://www.siam.mg.gov.br/siam/processo/index.jsp |
| Transparência — cavidades | https://transparencia.meioambiente.mg.gov.br/views/introducao_cavidades_naturais_subterraneas.php |
| IDE-Sisema | https://meioambiente.mg.gov.br/infraestrutura-de-dados-espaciais |
| Portal MG — licença | https://www.mg.gov.br/servico/obter-licenca-ambiental |

Vistas completas fora do SLA: [FEAM — vistas de processo](https://feam.br/w/vistas-de-processo-de-licenciamento-ambiental) (SEI, usuário externo).

## 3. Escada de complexidade (IS 08/2017)

| Nível | Estudo / ação |
|-------|----------------|
| 0 | Triagem IDE-Sisema (CECAV, critério DN 217, modalidade) |
| 1 | ADA+250 m **urbanizada**: laudo com dados secundários, sem prospecção |
| 2 | **Não urbano**: mapa de potencial local + prospecção ADA+250 m (Quadro 1 Anexo II IS 08) |
| 2A | Prospecção negativa + validação SUPRAM → encerra obrigação espeleológica |
| 3 | Cavidades encontradas → avaliação de impactos |
| 4a | Impactos **reversíveis** → mitigação, PCA, monitoramento |
| 4b | Impactos **irreversíveis** → área de influência + relevância (IN 02/2017) + compensação |
| 5 | **Estudo referente a critério locacional (cavidades)** — documento à parte nos processos |
| 6 | Integração EIA/RIMA ou RCA (estudo em separado ou no escopo) |

## 4. Dispensa vs encerramento (não confundir)

| Conceito | Significado |
|----------|-------------|
| **Não incidência do critério locacional** | Pedido ao órgão para enquadramento sem o critério “cavidades” (ex.: ampliação sem incremento de ADA — Dec. 47.383 art. 35; IS 06/2019) |
| **Encerramento espeleológico** | Prospecção negativa validada pela SUPRAM (IS 08/2017) |
| **Estudo critério locacional** | Atende o critério quando incide potencial CECAV alto/muito alto |

## 5. Produtos mínimos (checklist)

### Laudo inicial

- Mapa potencial local + CECAV/IDE
- Malha de caminhamento (km, densidade)
- Tabela de cavidades (coordenadas SIRGAS, tipo, desenvolvimento)
- ART, equipe, fotos

### Impacto irreversível

- Planilha IN MMA 02/2017
- Mapa área de influência definitiva
- Proposta compensação / cavidades testemunho
- Dec. 47.041/2016 (MG) quando aplicável

## 6. Módulo AmbientaR

- **Coleção Firestore:** `estudosCavidades`
- **Rotas:** `/studies/cavidades`, `/new`, `/[id]/edit`
- **Integrações:** `analise-ambiental`, `studies/ide-sisemanet`, links EcoSistemas em `navigation-config`
- **Templates:** `companySettings/branding.templatesEstudosCavidades`

### Integrações implementadas

- **Análise geoespacial:** camada WFS `IDE:ide_2002_mg_potencialidade_cavidades_pol` (9ª camada SIG); alerta e botão para criar estudo com triagem importada.
- **Export PDF:** branding em Configurações; ícone na lista e na edição do estudo.

### Próximas fases

1. Export Word (template `templatesEstudosCavidades`)
3. Planilha automática IN 02/2017
4. Vínculo offline (Dexie)

## 7. Referências técnicas MG

- [RBG — cavidades em quartzito, Diamantina](https://rbgeomorfologia.org.br/rbg/article/view/510)
- [RBG — carste QF / Rola Moça](https://rbgeomorfologia.org.br/rbg/article/download/173/299/3134)
- [Instituto Prístino — Peixe Bravo / metadiamictito](https://institutopristino.org.br/artigos/metadiamictito-ferruginoso-e-seu-potencial-muito-alto-de-ocorrencia-de-cavidades-estudo-de-caso-do-vale-do-rio-peixe-bravo-minas-gerais-brasil/)
- [GEOEMP — resumo IS 08/2017](https://geoemp.com.br/noticia/110/estudos-espeleologicos-no-licenciamento-ambiental-em-minas-gerais-is-08-2017-do-sisema-mg)
