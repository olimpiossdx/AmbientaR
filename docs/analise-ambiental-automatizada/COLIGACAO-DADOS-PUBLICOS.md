# Coligação de dados públicos — como a plataforma busca, analisa e gera relatório

Explicação para refinamento (2026-05-21). Objetivo: perceber **o que podes fazer agora** até ter um relatório que consulte bases estaduais, federais, municipais, zoneamento ecológico-econômico, IBGE e outras — e se essa coligação é “fácil”.

## Resposta curta

- **Coligar no sentido de “juntar num relatório único”** — sim, é o desenho certo do AmbientaR (API → JSON factual → UI/PDF → depois IA).
- **Coligar no sentido de “ligar tudo automaticamente a todos os órgãos do Brasil”** — não é fácil: cada fonte tem protocolo, CRS, atributos e regras diferentes; municípios são o mais fragmentado.
- **O caminho realista:** catálogo de camadas por **protocolo** (WFS, REST, catálogo), motor de interseção **único**, e ir **adicionando fontes** em ondas (MG + União primeiro, depois município a município ou via agregadores).

---

## Como a plataforma **já aponta** para isso (hoje)

Fluxo actual simplificado:

```
Utilizador (CAR / coord / polígono / futuro KML-SHP)
        ↓
Página /analise-ambiental  →  actions / fetch
        ↓
POST /api/geospatial/analyze
        ↓
geo-analysis-service.ts  →  fetchCarData + runGeospatialOverlay
        ↓
JSON { overlay, carData, factualData, fontesConsultadas }
        ↓
analise-ambiental-flow (Genkit)  →  resumoIA + evidências
        ↓
PDF / CSV / GeoJSON na UI
```

O **contrato** já separa:

1. **Dados factuais** (`factualData`, fontes, timestamp) — devem vir só de consultas reproduzíveis.
2. **Texto IA** (`resumoIA`) — interpretação; não substitui o cruzamento espacial.

O inventário `docs/INVENTARIO-SIG-MG-UNIAO-ANALISE-GEOESPACIAL.md` já lista fontes prioritárias (IDE-Sisema, GeoServer Sisema, SICAR, IBAMA PAMGIA, etc.).

**Gap actual:** `runGeospatialOverlay` ainda não faz interseção real camada a camada; valida sobretudo disponibilidade de endpoints e devolve estrutura de relatório. O próximo passo de implementação (quando quiseres código) é trocar fallbacks por **GetFeature + cálculo de área**.

---

## Como **deveria** buscar dados públicos (modelo alvo)

### 1. Entrada única: o perímetro

Tudo gira em torno de um polígono (GeoJSON) normalizado:

- WGS84 (EPSG:4326) para armazenar e mostrar no mapa
- Reprojetar para CRS da camada (ex. SIRGAS 2000 / UTM 23S, EPSG:31983 em MG) **antes** de intersectar

Sem perímetro estável, nenhuma coligação é confiável.

### 2. Catálogo de fontes (não “um API de todos os órgãos”)

Não existe uma API única do governo brasileiro que devolve “tudo ambiental + IBGE + zoneamento”. A plataforma mantém um **catálogo** (tabela ou Firestore `geo_layer_catalog`):

| Campo | Exemplo |
|-------|---------|
| `id` | `mg_uc_ide` |
| `titulo` | Unidades de Conservação MG |
| `orgao` | Semad/MG |
| `protocolo` | WFS 2.0 |
| `endpoint` | URL GeoServer |
| `layerName` | `namespace:layer` |
| `crs` | EPSG:4674 |
| `metodo` | intersect / buffer / point-in-polygon |
| `campoLegenda` | `nome` ou `classe` |

Consulta = para cada entrada do catálogo activo, correr o **mesmo** motor de análise.

### 3. Três famílias de protocolo (é aqui que a “facilidade” varia)

#### A) OGC WFS / WMS (mais comum em ambiental estadual/federal)

- **IDE-Sisema / GeoServer MG:** `https://geoserver.meioambiente.mg.gov.br/`
- **IBAMA PAMGIA:** serviços geoespaciais de embargos, etc.
- **SICAR GeoServer:** geometrias quando permitido

**Como buscar:** `GetFeature` com filtro espacial (BBOX ou `INTERSECTS` se o servidor suportar CQL/ECQL).

**Como analisar no servidor AmbientaR:**

1. Receber polígono do cliente
2. Reprojectar para CRS da camada
3. Pedir feições que intersectam (ou BBOX + filtrar localmente com Turf/PostGIS)
4. Para cada feição (ou classe agregada): calcular área de interseção → **% = área_interseção / área_perímetro × 100**
5. Guardar no pacote `LayerAnalysisResult`

**Dificuldade:** média. Muitas camadas funcionam igual; problemas típicos: timeout, limite de feições, CRS errado, servidor lento.

#### B) APIs REST (atributos, por vezes sem geometria fina)

- **SICAR Conecta Gov** (imóvel, demonstrativo): dados por número CAR — área declarada, APP, RL, situação
- **IBGE SIDRA / serviços de localidades:** população, PIB, censos — em geral **por município/setor**, não por polígono custom

**Como buscar:** HTTP com parâmetros (CAR, código IBGE do município obtido do centróide do polígono).

**Como analisar:** menos “interseção” e mais **enriquecimento contextual**: “o empreendimento está no município X, população Y, bioma Z (camada raster ou tabela)”.

**Dificuldade:** média-alta para CAR (credenciais OAuth em produção); IBGE é mais estável mas exige **ligar polígono → município** (centróide ou intersect com malha municipal IBGE).

#### C) Dados municipais e ZEE (mais difícil de generalizar)

- Zoneamento ecológico-econômico, plano diretor, mapas urbanos: cada município publica em formato e URL diferentes (PDF, shapefile pontual, WMS sem padrão, ArcGIS REST isolado).

**Estratégias:**

1. **Por município:** entrada manual no catálogo quando a consultoria trabalha naquela cidade
2. **Agregadores estaduais** (quando MG centraliza ZEE/camadas no IDE-Sisema — priorizar o que já está no geoportal estadual)
3. **Download estático** + cache no Storage (atualização mensal) para camadas que não têm WFS fiável

**Dificuldade:** alta para cobertura nacional automática; baixa-média se o escopo for **MG + municípios que vocês atendem**.

---

## O motor de coligação (coração técnico)

Um único serviço (ex. evolução de `geo-analysis-service.ts` + worker opcional):

```
analyzePerimeter(geojson, options: { layers: string[], municipalityCode?: string })
```

Para cada camada:

1. `fetchFeatures(layer, geometry)` → FeatureCollection
2. `computeIntersectionStats(geometry, features)` → `{ classes: [{ label, areaHa, pctOfPerimeter }], totalIntersectHa }`
3. `renderThumbnail(geometry, features)` → PNG (mapa pequeno) ou URL de tile composto
4. `recordProvenance(layer, queriedAt, endpoint)` → auditoria

Resultado agregado:

```json
{
  "perimeterId": "...",
  "areaHa": 87.4,
  "generatedAtUtc": "...",
  "layers": [
    {
      "layerId": "ibama_embargo",
      "title": "Embargos federais",
      "stats": [{ "label": "Embargo ativo", "areaHa": 2.1, "pctOfPerimeter": 2.4 }],
      "mapThumbnailUrl": "...",
      "source": { "name": "IBAMA PAMGIA", "url": "...", "method": "WFS intersect" }
    }
  ]
}
```

A **IA não calcula %** — só lê este JSON para redigir `resumoIA` e, no futuro, parágrafos de estudo.

---

## É fácil essa coligação?

| Aspecto | Facilidade | Comentário |
|---------|------------|------------|
| Um relatório PDF a partir de um JSON | Alta | Já tens export na página |
| Mesmo fluxo UI → API → pacote factual | Alta | Já existe |
| 3–5 camadas WFS MG + IBAMA com % real | Média | Trabalho de engenharia focado, 2–4 semanas típico |
| CAR com geometria oficial | Média | Depende de credenciais e API |
| IBGE socioeconômico + gráficos | Média | Por município/setor, não por polígono arbitrário |
| Todos os órgãos estaduais + federais + municipais | Baixa (escala nacional) | Catálogo e manutenção contínua |
| ZEE e zoneamento todo município BR | Baixa | Exige estratégia municipal ou estadual |

**Conclusão:** a coligação é **fácil de arquitetar** (um motor, um catálogo, um relatório). É **difícil de completar em cobertura** sem priorizar fontes e regiões.

---

## O que podes fazer **agora** (etapas até relatório “completo” factual)

Sem falar de código — acções de produto, credenciais e validação que desbloqueiam o relatório.

### Etapa A — Congelar o catálogo MVP (1–2 dias de trabalho humano)

Lista fechada de camadas para a **primeira versão do relatório**, por exemplo:

**Federais**

- Embargos (IBAMA PAMGIA)
- Bioma (MapBiomas ou camada federal disponível via WMS)
- Hidrografia (SNIRH / camada federal ou estadual que intersecte)

**Estaduais (MG)**

- UC e APAs (IDE-Sisema)
- APP / cursos d’água (GeoServer MG)
- CAR/SICAR (atributos + geometria quando possível)

**IBGE (contexto, não interseção fina)**

- Município, microrregião, população, domicílios (API IBGE a partir do centróide)
- Opcional: setor censitário se tiveres malha

**Zoneamento ecológico-econômico**

- Priorizar camada **estadual** MG se estiver no geoportal; municipal só para cidades-piloto

Documentar cada uma no inventário: URL, CRS, licença, limite de uso.

### Etapa B — Credenciais e políticas (paralelo)

- Registar app no **Conecta Gov** / SICAR se precisares de CAR detalhado
- Confirmar **termos de uso** IDE-Sisema e IBAMA (uso comercial, cache, rate limit)
- Definir se o relatório guarda **cache 24h** das respostas WFS (recomendado para performance e auditoria)

### Etapa C — Validar manualmente 3 polígonos teste (qualidade antes de escalar)

- Imóvel rural com CAR conhecido
- Área urbana pequena (zoneamento)
- Polígono com embargo ou UC próxima (caso de stress)

Comparar % e listagem com o **Geosisemanet / visualizador oficial** — se bater, o motor está certo.

### Etapa D — Definir regra do relatório “completo” v1

Relatório v1 = perímetro + **todas as camadas do catálogo MVP** com:

- card (% + mini-mapa + tabela)
- secção IBGE (tabelas + 2–3 gráficos simples)
- zero texto IA longo **ou** sumário IA numa página separada marcada “rascunho”

Isto já responde ao teu pedido de “consultar na base de todos os órgãos” **no âmbito do catálogo**, não literalmente todos os portais do país.

### Etapa E — Só depois: expandir catálogo e municípios

- Adicionar município X quando fechares contrato ou operação naquela cidade
- Reutilizar o mesmo motor; só entra nova linha no catálogo

---

## Papel da IA vs do SIG no relatório final

| Parte do relatório | Quem gera |
|-------------------|-----------|
| % por camada, áreas, listas de feições | Motor SIG (obrigatório) |
| Mini-mapas | Servidor (render) ou cliente (Leaflet snapshot) |
| Tabelas IBGE | API IBGE + código |
| Parágrafo “vegetação / solo / hidrografia” | IA lendo JSON factual |
| Referências bibliográficas | Base curada + IA, **revisão humana** |

Se a IA correr **antes** dos números certos, o relatório parece bonito e está errado — por isso a ordem importa.

---

## Infraestrutura que o repo já prevê

- **Next.js:** orquestração, auth, gravar `geo_analyses`, PDF
- **Worker GDAL** (`infra/geo-export-worker/`): KML/SHP pesados, reprojeção, simplificação — não misturar com WFS leve
- **Firestore:** pacote factual versionado por análise
- **Genkit** (`analise-ambiental-flow`): tools por fonte (`getDadosCAR`, `analisarSobreposicao`, futuras `getIbgeMunicipio`, etc.)

---

## Mapa mental: de “consulta” a “relatório”

```
                    ┌─────────────────────┐
                    │  Catálogo de        │
                    │  camadas (orgãos)   │
                    └──────────┬──────────┘
                               │
Perímetro ─────────────────────┼──────────────────────► Relatório PDF
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
    WFS/OGC              REST (CAR, IBGE)     Cache/SHP municipal
    intersect            por id / município    (quando não há WFS)
         │                     │                     │
         └─────────────────────┴─────────────────────┘
                               │
                    JSON factual único
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
              Cards na UI            (opcional) IA
```

---

## Próximo refinamento sugerido (continuar discussão)

1. Fechar lista **exacta** das 8–12 camadas do catálogo MVP (nomes no GeoServer / IDE).
2. Decidir: relatório v1 **só MG** ou já incluir 1 município piloto para ZEE.
3. Escrever mock de **uma página** do PDF (ex. embargos + hidrografia) com campos fixos.

Quando retomares, abre esta pasta e `docs/INVENTARIO-SIG-MG-UNIAO-ANALISE-GEOESPACIAL.md` lado a lado.

---

## Atualização — duas etapas e catálogo IDE-Sisema MG (2026-05-21)

A coligação de dados públicos concentra-se na **Etapa 1** (WFS IDE-Sisema / GeoServer MG). A **Etapa 2** não colige novos mapas — lê o pacote `geo_analyses` e gera texto em Relatórios de IA.

Camadas MVP MG acordadas: ver [MVP-CAMADAS-IDE-SISEMA-MG.md](./MVP-CAMADAS-IDE-SISEMA-MG.md) (8 temas, implementação em ondas A/B/C).

**Entrada recomendada para o MVP das 8 camadas:** polígono, KML/SHP ou CAR com geometria — não coordenada isolada para relatório com % oficial.
