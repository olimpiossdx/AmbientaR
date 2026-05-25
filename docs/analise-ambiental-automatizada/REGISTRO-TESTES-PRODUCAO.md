# Registo de testes em produção / uso real

Documento vivo para refinamento. **Não substitui código** — regista o que o utilizador viu na app para orientar correções futuras e o roteiro SaaS.

Última entrada: teste com polígono ~**850,52 ha** (Ondas A+B+C).

**Correcção técnica (2026-05-22):** endpoint WFS correcto é `https://geoserver.meioambiente.mg.gov.br/ows` (não `/geoserver/ows`). typeNames com prefixo `IDE:`.

**Deploy (2026-05-25):** commit `de63002` em `main` — branding PDF menu IA, minimapas SVG, Etapa 2 inline, catálogo `wave-a-catalog.ts` alinhado. **Re-teste produção obrigatório** antes de declarar 12 itens.

---

## Checklist pós-`de63002` (12 itens — pendente)

| # | Item | Teste | Resultado |
|---|------|-------|-----------|
| 1–8 | Camadas SIG | Gerar factual 8 camadas, polígono ~850 ha | ☐ |
| 9 | Gráfico temperatura | — | Não implementado |
| 10 | Gráfico precipitação/humidade | — | Não implementado |
| 11 | Mapa hipsometria | — | Não implementado |
| 12 | Mapa ADA/perímetro QGIS | — | Não implementado |
| — | `geo_analyses` + Etapa 2 | Após gerar factual | ☐ |
| — | PDF branded + figuras | Download PDF | ☐ |

---

## Resumo executivo do teste (antes da correcção)

| Aspecto | Resultado | Utilizável? |
|---------|-----------|-------------|
| Desenho / área do perímetro | **850,52 ha** calculada e exibida | Sim |
| Resumo textual agregado | Lista 8 temas como “sem interseção ou indisponível” | Parcial (honesto, mas pouco valor) |
| Camadas WFS (8) | **Todas “Indisponível”** — HTTP **404** nos endpoints | Não |
| Cards por camada | UI correta (badge, mensagem, log de erro) | Sim (para diagnóstico) |
| PDF factual | Botão presente (não validado neste registo) | A confirmar |
| Persistência `geo_analyses` | Etapa 2: *“Nenhuma análise factual salva”* | **Não** neste fluxo |
| Etapa 2 (complemento IA) | Bloqueada por falta de análise salva + sem dados SIG | Não |

**Conclusão:** o **esqueleto do produto** (fluxo, UI, área, 8 cards) está montado; o **valor técnico** (%, mapas, texto baseado em camadas) **ainda não está utilizável** até resolver WFS e persistência.

---

## Detalhe por camada (erro observado)

Todas as consultas falharam com padrão semelhante:

- Base tentada: `https://geoserver.meioambiente.mg.gov.br/geoserver/ows` (e variantes `wfs`)
- Erro: **HTTP 404** — “camada não encontrada” ou endpoint inexistente
- Prefixo de camada no catálogo: `ide:ide_XXXX_...` e fallbacks sem prefixo

| Camada | typeNames tentados (ex.) | Erro |
|--------|--------------------------|------|
| Hidrografia FBDS | `ide:ide_240901_mg_hidrografia_fbds_lin` | 404 |
| Bioma MapBiomas | `ide:ide_1403_mg_nat_ant_mapbiomas_col9` | 404 |
| Solos 1:500.000 | `ide:ide_1502_mg_mapa_solos_pol` | 404 |
| Geologia | `ide:ide_1501_mg_geologia_pol` | 404 |
| Geomorfologia | `ide:ide_1503_mg_geomorfologia_pol` | 404 |
| Pedologia | `ide:ide_1504_mg_pedologia_pol` | 404 |
| Inventário / vegetação | `ide:ide_1401_mg_vegetacao_pol` | 404 |
| Fauna | `ide:ide_1601_mg_fauna_pon` | 404 |

### Hipóteses (para investigação futura — fora deste doc de código)

1. **URL do GeoServer MG mudou** ou WFS não está em `/geoserver/ows`.
2. **Workspace** não é `ide:` — nomes no GeoNetwork diferem do catálogo implementado.
3. **Camadas só via WMS** (raster) — MapBiomas pode não ter WFS vectorial no mesmo nome.
4. **Bloqueio de rede** no App Hosting (menos provável se 404 vem do Tomcat/GeoServer).

### Ação de refinamento recomendada (catálogo)

1. Abrir GeoNetwork IDE-Sisema e Geosisemanet para o **mesmo polígono** de teste.
2. Exportar lista real: `workspace:layer` + CRS + tipo (WFS/WMS).
3. Atualizar tabela em `MVP-CAMADAS-IDE-SISEMA-MG.md` com nomes **confirmados**.
4. Alternativa: **cache local** (SHP oficial baixado) + worker QGIS/GDAL quando WFS for instável.

---

## Etapa 2 — observação do teste

Mensagem: *“Nenhuma análise factual salva. Gere primeiro o relatório factual acima.”*

Possíveis causas a validar numa próxima sessão técnica:

- `geo_analyses` não gravou (regras Firestore, utilizador não autenticado, erro silencioso no cliente).
- Gravação com `wave: "ABC"` mas listagem da Etapa 2 filtra só `wave === "A"` (verificar consistência quando for corrigir código).
- Sessão / projeto diferente entre geração e painel Etapa 2.

**Impacto:** sem pacote salvo, **Passo 3** (estudos automáticos) não tem âncora `geoAnalysisId`.

---

## O que já prova valor (manter no desenho)

- Perímetro → **área em ha** (base para RCA, PIA, licenciamento).
- Relatório com **8 secções** alinhadas ao inventário MG acordado.
- Separação **factual vs IA** (mesmo com camadas vazias, não inventa %).
- UX de **linha de montagem** visível (botão PDF, Etapa 2, cruzamento de dados).

---

## Critérios para declarar Etapa 1 “utilizável”

- [ ] ≥ 3 camadas com status **OK** e tabela com % em polígono teste conferido no Geosisemanet.
- [ ] `geo_analyses` visível na Etapa 2 após gerar relatório.
- [ ] PDF factual com pelo menos uma página por camada OK.
- [ ] Mini-mapa ou figura por camada (fase seguinte do produto).

---

## Histórico

- 2026-05-21: implementação inicial 8 camadas + deploy.
- Registo de teste utilizador: 8/8 indisponível (404 WFS), área OK, Etapa 2 sem análise salva.
