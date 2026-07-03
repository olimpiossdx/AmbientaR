# Roteiro para replicar — SaaS de análise ambiental + estudos

Guia passo a passo para **futuro software dedicado** ou novo SaaS, baseado na experiência AmbientaR. Use com a pasta completa `analise-ambiental-automatizada/`.

---

## Fase 0 — Produto e escopo

1. Definir **estado** (ex. MG primeiro) e **tipos de estudo** (RCA, PIA, inventário, EIA/RIMA…).
2. Listar **fontes obrigatórias** (IDE-Sisema, SICAR, IBAMA, IBGE) — ver `COLIGACAO-DADOS-PUBLICOS.md`.
3. Aceitar **duas camadas**: factual (SIG) vs narrativa (IA), sempre revisão humana.
4. **Templates Word** em configuração central + **PDF branded** (cabeçalho, marca d’água, rodapé) em **todos** os exports — ver `TEMPLATES-E-BRANDING-UNIFICADO.md`.

---

## Fase 1 — Perímetro e motor SIG

1. Entrada: polígono, CAR, SHP/KML (worker GDAL).
2. Catálogo `layerId`, `typeName`, CRS, `geometryKind` — **confirmar no GeoNetwork**, não adivinhar.
3. Motor: bbox WFS → interseção → % empreendimento — Turf ou PostGIS.
4. Saída: JSON `geo_analyses` + PDF factual sem IA.
5. **Teste de aceite:** 3 camadas OK vs visualizador oficial.

**Armadilha registada:** HTTP 404 em `geoserver.meioambiente.mg.gov.br/geoserver/ows` — validar URL e workspace antes de escalar.

---

## Fase 2 — Complemento IA

1. Ler só JSON factual — não reconsultar WFS.
2. Secções fixas por tipo de produto.
3. Export PDF + DOCX; status `rascunho_ia`.
4. UI na mesma jornada do técnico (não esconder só em admin).

---

## Fase 3 — Cadastro rico + geometrias temáticas

1. Cliente, empreendimento, atividade, CNAE, CAR.
2. Upload por tema: ADA, APP, RL, cursos, barragens.
3. `empreendimentoId` em todas as análises e estudos.

---

## Fase 4 — Estudos (linha de montagem)

1. Seletor cliente + fazenda + tipo estudo.
2. Template Word com placeholders.
3. Preenchimento: cadastro + geo_analyses + IA.
4. Revisão → PDF aprovado.
5. Ver `PASSO-3-LINHA-DE-MONTAGEM-SAAS.md`.

---

## Fase 5 — Mapas produção (QGIS-like)

1. Worker Python/GDAL (+ PyQGIS se necessário).
2. Layouts: localização, uso do solo, APP, hidrografia.
3. PNG/SVG embutidos no Word.

---

## Fase 6 — Licenciamento

1. Processo por cliente com anexos versionados.
2. Encadeamento inventário → PIA → anexos.
3. Só PDF `aprovado`.

---

## Stack recomendada (open source)

| Camada | Tecnologia |
|--------|------------|
| Web | Next.js ou equivalente |
| Auth + DB | Firebase ou Postgres |
| SIG leve | Turf.js / Shapely |
| SIG pesado | GDAL, QGIS headless |
| IA | Genkit / LLM API + RAG |
| Documentos | docx templater + PDF |
| Mapas web | Leaflet |

---

## Critérios de “produto utilizável”

- [ ] Técnico consegue RCA em **&lt; X horas** com 70%+ campos preenchidos automaticamente.
- [ ] Nenhum % no documento sem origem SIG rastreável.
- [ ] Word editável sempre antes do PDF final.
- [ ] Um processo de licenciamento recebe anexos sem upload manual duplicado.

---

## Índice da pasta

Ver [README.md](./README.md).
