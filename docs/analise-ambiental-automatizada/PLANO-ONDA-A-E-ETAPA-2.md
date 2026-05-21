# Plano de execução — Onda A primeiro, depois Etapa 2

Decisão de refinamento (2026-05-21): **não** avançar para as 8 camadas nem para a Etapa 2 (IA) até a **Onda A** estar fechada, validada e com PDF factual utilizável.

---

## Sequência acordada

```
┌─────────────────────────────────────────────────────────────┐
│  FASE ATUAL: Onda A (Etapa 1 — só SIG, 3 camadas MG)       │
│  hidrografia + bioma + solos → PDF factual + geo_analyses   │
└──────────────────────────────┬──────────────────────────────┘
                               │ só após validação
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  DEPOIS: Etapa 2 (Relatórios de IA)                        │
│  carregar geo_analyses → complemento → PDF + Word           │
└──────────────────────────────┬──────────────────────────────┘
                               │ opcional em paralelo depois
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  FUTURO: Ondas B e C (geologia, geomorfologia, pedologia,  │
│  inventário florestal, fauna) — mesma Etapa 1, mais camadas │
└─────────────────────────────────────────────────────────────┘
```

**Fora de escopo até Onda A fechar:** Ondas B/C, IBGE socioeconômico, municípios, integração em formulários de estudo (exceto piloto mínimo se quiseres testar um campo).

---

## Onda A — escopo fechado

### Camadas (IDE-Sisema / GeoServer MG)

| ID catálogo | Tema | Métrica no PDF |
|-------------|------|----------------|
| `mg_hidrografia` | Hidrografia | % área (massas d’água) + resumo de cursos intersectados (comprimento m se linhas) |
| `mg_bioma` | Bioma | % do empreendimento por classe de bioma |
| `mg_solos` | Solos | % do empreendimento por classe de solo |

### Entradas de perímetro (MVP Onda A)

| Entrada | Suportar na Onda A? |
|---------|---------------------|
| Polígono desenhado no mapa | Sim (prioridade) |
| Polígono / GeoJSON colado | Sim |
| CAR | Sim, se geometria ou fallback documentado |
| Coordenada única | Não para PDF “completo” — mensagem: desenhe perímetro ou use CAR |
| KML / SHP | Opcional na Onda A; se atrasar, deixar para patch rápido após A |

### Entregáveis Onda A (definição de “pronto”)

**Funcional**

- [x] Utilizador define perímetro e dispara “Gerar relatório factual” (`handleWaveAAnalysis`)
- [x] Servidor consulta as 3 camadas (WFS IDE-Sisema) com interseção Turf.js
- [x] Calcula `areaHa` do perímetro e `pctOfPerimeter` por classe em cada camada
- [x] Grava pacote em Firestore `geo_analyses` com `layers[]`, `generatedAtUtc`, `fontesConsultadas`
- [x] UI: 3 cards (`GeoWaveALayerCards`) com tabela ha / % / km
- [x] PDF factual (`appendWaveAFactualPdf`)
- [x] Export CSV/GeoJSON (legado mantido na página)

**Qualidade**

- [ ] 1 polígono teste validado manualmente vs visualizador Geosisemanet/IDE-Sisema (tolerância documentada, ex. ±2% área)
- [ ] Timeout por camada (ex. 30–60 s) com mensagem clara se serviço MG indisponível
- [ ] PDF marca explicitamente **“Relatório factual — Onda A”** (sem texto IA longo)

**Produto**

- [ ] Botão desabilitado ou aviso: “Complementação IA disponível após concluir análise” → prepara Etapa 2 sem implementá-la ainda
- [ ] `layerName` WFS das 3 camadas preenchido em tabela interna (ver secção abaixo)

---

## Onda A — trabalho de catálogo (antes/durante implementação)

Passo manual recomendado (1–2 h):

1. GeoNetwork IDE-Sisema → pesquisar “hidrografia”, “bioma”, “solo” (ou “solos”).
2. GeoServer `geoserver.meioambiente.mg.gov.br` → `GetCapabilities` WFS → anotar `workspace:layer`.
3. Preencher:

| `layerId` | `layerName` (confirmar) | `crs` | `campoLegenda` | `geometryType` |
|-----------|-------------------------|-------|----------------|----------------|
| `mg_hidrografia` | _A preencher_ | ex. EPSG:4674 | ex. `nome` | Line/Polygon |
| `mg_bioma` | _A preencher_ | | | Polygon |
| `mg_solos` | _A preencher_ | | | Polygon |

4. Testar um `GetFeature` com BBOX de um polígono conhecido em MG.

---

## Onda A — estrutura do PDF (mock)

**Página 1 — Capa**

- Título: Relatório de análise geoespacial factual (Onda A)
- Empreendimento / projeto (se vinculado)
- Área do perímetro: X ha
- Data/hora UTC, utilizador
- Fontes: IDE-Sisema / GeoServer MG (URLs)

**Páginas 2–4 — Uma por camada**

Estrutura repetida:

```
┌────────────────────────────────────────┐
│ HIDROGRAFIA                            │
│ [ mini-mapa: perímetro + camada ]       │
├────────────────────────────────────────┤
│ Classe / feição    │ ha  │ % emp.     │
│ ...                │     │            │
├────────────────────────────────────────┤
│ Fonte: ... | Método: interseção WFS    │
└────────────────────────────────────────┘
```

**Página 5 — Resumo tabular (opcional)**

- Tabela única: camada | principal achado | % máximo

**Sem:** parágrafos longos de IA na Onda A.

---

## Etapa 2 — só depois da Onda A

### Pré-requisito

- Pelo menos **uma** `geo_analyses` real na base com `layers` de hidrografia, bioma e solos preenchidos.
- PDF Onda A gerado e considerado aceite pelo utilizador interno.

### Escopo Etapa 2 (primeira versão)

| Item | Detalhe |
|------|---------|
| Onde | `/ai-lab/automations` (Relatórios de IA) |
| Entrada | Selecionar `geo_analysis_id` ou “última análise do projeto” |
| Dados para IA | JSON `layers[]` + `perimeter.areaHa` — **sem** nova consulta WFS |
| Secções geradas | (1) Resumo executivo (2) Hidrografia e APP (3) Bioma e vegetação (4) Solos e pedologia introdutória — **só com base em A**; pedologia completa vem na Onda B |
| Saída | PDF complementar + DOCX |
| Persistência | `geo_analysis_complements` com `status: rascunho_ia` |
| UX | Aviso: “Baseado na análise factual de {data} — revisão obrigatória” |

### Entregáveis Etapa 2 (definição de “pronto”)

- [x] Listar análises Onda A (`GeoAnalysisComplementPanel` em `/ai-lab/automations`)
- [x] Fluxo IA `geo-analysis-complement-flow.ts` (só stats do JSON)
- [x] Export PDF e Word (complemento)
- [x] Guardar em `geo_analysis_complements`
- [x] Botão “Complementar com IA (Etapa 2)” em `/analise-ambiental`

### Fora da Etapa 2 v1

- Import automático em RCA/PTRF (piloto pode ser v2)
- Gráficos IBGE
- Camadas Ondas B/C no texto (mencionar “não consultado nesta análise” se faltar camada)

---

## Ligação Onda A → Etapa 2 (contrato mínimo)

A Etapa 2 **exige** este formato em `geo_analyses.layers[]`:

```json
{
  "layerId": "mg_bioma",
  "title": "Bioma",
  "stats": [
    { "label": "Cerrado", "areaHa": 45.2, "pctOfPerimeter": 100 }
  ],
  "source": { "name": "IDE-Sisema", "layerName": "...", "queriedAtUtc": "..." }
}
```

Se `stats` estiver vazio, a IA deve dizer “camada indisponível na consulta” — não preencher com conhecimento genérico.

---

## Riscos e mitigação (Onda A)

| Risco | Mitigação |
|-------|-----------|
| WFS lento ou limitado | BBOX + limite de features; cache 24h por `perimeterHash` |
| CRS errado | Reprojectar perímetro para CRS da camada antes de intersect |
| Hidrografia só linhas | Métrica mista: km de curso + polígonos de massa d’água |
| CAR sem polígono | Exigir desenho após consulta atributos CAR |

---

## Ordem de trabalho sugerida (quando passar a código)

1. Catálogo 3 camadas (`layerName` confirmado)  
2. Motor interseção + `stats` para polígonos  
3. Persistência `geo_analyses`  
4. UI 3 cards + PDF  
5. Validação manual 1 polígono  
6. **Parar** — só então Etapa 2 (listagem + fluxo IA + Word)

---

## Documentos relacionados

- [MVP-CAMADAS-IDE-SISEMA-MG.md](./MVP-CAMADAS-IDE-SISEMA-MG.md) — detalhe das 8 camadas; Ondas B/C adiadas  
- [ETAPA-1-E-ETAPA-2.md](./ETAPA-1-E-ETAPA-2.md) — visão geral das duas etapas  
- [COLIGACAO-DADOS-PUBLICOS.md](./COLIGACAO-DADOS-PUBLICOS.md) — protocolos WFS  

---

## Histórico

- 2026-05-21: decisão explícita — Onda A (3 camadas) → validar → Etapa 2 (IA); B/C posteriores.
