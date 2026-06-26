# Visão e roadmap — análise ambiental automatizada

Documento de refinamento alinhado à discussão de 2026-05-21. Complementa `DISCUSSAO-2026-05-21.md` com detalhe de produto e entregáveis.

## Frase de produto

**Um perímetro** → **N camadas públicas** → **card por camada (% + mapa)** → **relatório factual (Etapa 1)** → **complementação IA (Etapa 2)** → **importação** nos estudos ambientais.

Ver detalhe operacional: [ETAPA-1-E-ETAPA-2.md](./ETAPA-1-E-ETAPA-2.md).

## UI desejada (relatório)

Grid de cards, cada um com:

- Nome da camada e fonte (ex. IDE-Sisema, IBAMA, IBGE)
- Percentagem principal (ex. “12,4% do empreendimento em APP”)
- Mini-mapa: perímetro + recorte da camada
- Tabela de classes/atributos com ha e %
- Link “abrir no visualizador oficial” quando existir (Sisema, etc.)

PDF: mesma estrutura + carimbo de data UTC + lista de fontes consultadas.

## Integração com estudos (futuro)

| Módulo / tema | Dado da análise | Saída IA (rascunho) |
|---------------|-----------------|---------------------|
| Vegetação / fitofisionomia | classes, % cobertura, bioma | Caracterização florística |
| Solo | classe pedológica | Descrição + refs bibliográficas curadas |
| Hidrografia | cursos, buffers | APP, drenagem |
| UC / embargo | % ou distância | Risco locacional |
| IBGE | município, setores | Contexto socioeconômico + gráficos |

Status de licenciamento: já existe inferência conservadora em `src/lib/licensing-locational.ts` a partir de overlay geoespacial.

## Fundação já no repositório

- `StudyGeospatialSplitShell`, `analise-ambiental/page.tsx`
- `/api/geospatial/analyze`
- `docs/INVENTARIO-SIG-MG-UNIAO-ANALISE-GEOESPACIAL.md`
- Plano worker: `infra/geo-export-worker/`, `.cursor/plans/mapas-geoprocessing-opcao-b.md`
- `docs/ARQUITETURA-IA-E-RELATORIOS.md` (tools Genkit por fonte)

## Critérios de aceite por fase (para quando implementar)

**Fase 1 (mínimo vendável):**

- [ ] Geometria válida, área em ha coerente
- [ ] ≥ 3 camadas com % calculado (não estimado)
- [ ] Cada resultado cita fonte + `generatedAtUtc`
- [ ] PDF com secção factual separada da IA

**Fase 4 (integração estudo):**

- [ ] Botão “Importar análise” num formulário piloto (ex. PTRF ou RCA)
- [ ] Campo marcado `origem: geo_analyses/{id}`

## Riscos legais e técnicos

- Citações bibliográficas: base fechada ou revisão humana
- CAR/SICAR: OAuth e termos de uso em produção
- Rate limit de WFS públicos: fila, cache, retry
- CRS incorreto: distorção de % — normalizar antes de intersect

Ver também: [COLIGACAO-DADOS-PUBLICOS.md](./COLIGACAO-DADOS-PUBLICOS.md).
