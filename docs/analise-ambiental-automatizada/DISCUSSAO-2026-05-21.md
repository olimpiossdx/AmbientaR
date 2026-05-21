# Discussão — 2026-05-21 (refinamento, sem alteração de código)

Registo da conversa sobre evolução da **Análise Geoespacial (IA)** e automação de estudos ambientais.

## Objetivo expresso pelo utilizador

Melhorar a aplicação de análise geoespacial no menu IA para:

- Lançar **KML**, **SHP**, **desenho à mão livre**, **coordenada**, **número de CAR**
- Sobre o perímetro carregado, analisar **várias camadas** (referência: ferramenta Geosisemanet / IDE-Sisema MG)
- Gerar **relatório geral** com **quadro pequeno por informação**: desenho + **percentagem** do que foi encontrado em cada camada dentro do empreendimento
- Usar essa análise na **elaboração de estudos ambientais** (vegetação, bioma, solo com descrição e referências bibliográficas, hidrografia, etc.)
- Integração futura com módulos de estudo + **agente de IA** que redige texto secundário; humano só revisa
- Camadas **IBGE** para relatórios geográficos e socioeconómicos com gráficos

## Estado atual no AmbientaR (referência)

- Página `/analise-ambiental`: mapa (desenho polígono), CAR, coordenadas, polígono; export PDF/CSV/GeoJSON
- `POST /api/geospatial/analyze` — overlay + CAR
- `geo-analysis-service.ts` — MVP com fallbacks; sobreposição real ainda limitada
- `analise-ambiental-flow.ts` — Genkit com tools `getDadosCAR` e `analisarSobreposicao`
- Inventário técnico: `docs/INVENTARIO-SIG-MG-UNIAO-ANALISE-GEOESPACIAL.md`

## Visão em duas camadas

| Camada | Função | Confiança |
|--------|--------|-----------|
| Factual (SIG) | Interseção, ha, % no perímetro, mini-mapa por camada | Consulta técnica, órgão, auditoria |
| Narrativa (IA) | Parágrafos para RCA/PTRF/etc. | Rascunho — revisão obrigatória |

## Fases acordadas (roadmap conceptual)

### Fase 0 — Perímetro persistente

Objeto estável (ex. `geo_analyses`): geometria normalizada, origem (car/kml/shp/desenho/coord), vínculo a projeto, área (ha), timestamp.

### Fase 1 — Motor de sobreposição real

Por camada: área intersectada, % da área do **empreendimento**, feições, mini-mapa. Catálogo inicial: UC MG, embargos IBAMA, hidrografia, bioma, solo, vegetação/uso do solo.

### Fase 2 — Relatório geoespacial geral (PDF/HTML)

Capa + sumário + card por camada + anexo GeoJSON/CSV. Separar páginas “Dados factuais” vs “Texto interpretativo (rascunho IA)”.

### Fase 3 — Catálogo de camadas configurável

Admin liga WMS/WFS, atributo de legenda, ordem no relatório, ativo por tipo de estudo.

### Fase 4 — Ponte para módulos de estudo

“Importar da análise geoespacial” nos formulários (vegetação, solo, hidrografia, UC/embargo, IBGE). Agente recebe JSON factual + template.

### Fase 5 — Agente de estudo completo

RAG + seções + gráficos IBGE + referências de base curada (evitar citações inventadas).

## Decisões de produto em aberto

1. Um perímetro por projeto ou vários (empreendimento vs área de influência)?
2. % sempre sobre área do **perímetro do empreendimento** (recomendado)?
3. CAR sem geometria pública — validar atributos + desenho manual?
4. Quais 5 camadas são obrigatórias no MVP?
5. Análise exige rede; cache só do último relatório?
6. Cliente vê rascunho IA ou só consultor interno?

## Ordem prática recomendada

1. Perímetro + import KML/SHP (worker GDAL)  
2. 3–5 camadas com % real + cards na UI  
3. PDF/HTML padronizado  
4. Vínculo projeto/estudo  
5. Agente + IBGE + bibliografia  

## Diagrama de arquitetura (mental)

```
Entrada (CAR, desenho, KML, SHP, coord)
    → Perímetro normalizado
    → Motor de interseção (servidor/worker)
    → geo_analyses (Firestore)
    → Cards + relatório PDF
    → [futuro] Templates de estudo → Agente redator → Módulos RCA/PTRF/...
```

## Notas

- Não replicar login do SISEMANET; consumir serviços públicos OGC/API (ver inventário SIG).
- O salto crítico é **matemática espacial correta** antes de expandir texto da IA.

---

## Continuação — 2026-05-21 (duas etapas + camadas MG)

### Decisão de arquitetura “possível agora”

O utilizador aceitou dividir em **duas etapas** (não ideal, mas viável):

1. **Etapa 1 (simples):** Análise Geoespacial → consulta SIG (IDE-Sisema MG) → PDF factual com mapas básicos e % por camada → salvar `geo_analyses`.
2. **Etapa 2 (completa):** Carregar esse pacote em **Relatórios de IA** (`/ai-lab/automations`) → IA complementa/redige sobre os dados já buscados → export PDF e Word → parte do conteúdo fica salva para **importar nos estudos técnicos** (RCA, PTRF, etc.).

### Camadas MVP IDE-Sisema (MG) — lista acordada

Hidrografia; solos; bioma; inventário florestal; geologia; geomorfologia; pedologia; fauna.

Detalhe técnico, ondas de implementação e métricas: [MVP-CAMADAS-IDE-SISEMA-MG.md](./MVP-CAMADAS-IDE-SISEMA-MG.md).  
Fluxo Etapa 1 ↔ 2 ↔ estudos: [ETAPA-1-E-ETAPA-2.md](./ETAPA-1-E-ETAPA-2.md).

### Recomendações registadas

- Implementar camadas em **ondas** (A: hidrografia, bioma, solos; B: geologia, geomorfologia, pedologia; C: inventário florestal, fauna).
- Fauna: métricas por ocorrência/proximidade, não só % de área.
- Pedologia + solos: duas camadas no SIG, uma secção unificada na IA.
- Etapa 2 não deve reconsultar WFS para recalcular % — só narrar o JSON factual.
- Botão na Etapa 1: “Enviar para complementação IA” com `geoAnalysisId`.

### Continuação — prioridade Onda A → Etapa 2

Decisão: avançar **só Onda A** (hidrografia, bioma, solos) na Etapa 1; **depois** Etapa 2 em Relatórios de IA. Ondas B/C (geologia, geomorfologia, pedologia, inventário florestal, fauna) e integração profunda em estudos ficam para depois.

Plano: [PLANO-ONDA-A-E-ETAPA-2.md](./PLANO-ONDA-A-E-ETAPA-2.md).
