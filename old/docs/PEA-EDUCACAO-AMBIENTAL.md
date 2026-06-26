# Programa de Educação Ambiental (PEA) — módulo AmbientaR

## Menu

**Estudos Técnicos → Programa de Educação Ambiental** (`/studies/educacao-ambiental`)

## Rotas

| Rota | Função |
|------|--------|
| `/studies/educacao-ambiental` | Hub: programas + dispensas |
| `/studies/educacao-ambiental/novo` | Novo PEA (wizard em abas) |
| `/studies/educacao-ambiental/[id]/edit` | Editar PEA + export Word |
| `/studies/educacao-ambiental/solicitar-dispensa` | Formulário dispensa (FEAM) |
| `/studies/educacao-ambiental/dispensas/[id]` | Editar dispensa + export Word |

## Firestore

- `pea_programs` — programas (DSP, projetos, monitoramento embutidos)
- `dispensaPea` — solicitações de dispensa

Regras: `npm run deploy:rules` após alterações em `src/firebase/rules/firestore.rules`.

## Termos de referência

Pasta `termos de referencia/PEA/` — ver `LEIA-ME.md`. Vínculo RAG: slug `pea` em `termos-referencia-config.ts`.

## Análise geoespacial e geometria (ABEA / ADA)

Na aba **ABEA / Geo** do formulário PEA (e na dispensa, antes do item 4.3):

**Geometria (KML / SHP / cadastro)**

- Importar ficheiro **KML**, **GeoJSON**, **XML** ou **ZIP/SHP** (botão no painel).
- Carregar geometria do **empreendimento**: SHP do CAR (`projects.car.shpUrl`), processo em **georef_projects** ou perímetro de análise já salva.
- Botões **Aplicar polígono à ABEA/ADA** (só cartografia) e **Aplicar textos da análise** (camadas + complemento IA).

**Análise geoespacial (texto factual)**

- Selecione uma análise em `geo_analyses` ([Análise Geoespacial (IA)](/analise-ambiental)).
- Modo **anexar** ou **substituir**; opções socioeconômico, tabela de camadas, meio físico.
- Opcional: aplicar automaticamente ao trocar a análise.

O vínculo (`geoAnalysisId`, `geoVinculo`, incl. `geometrySource`) é gravado no Firestore com o PEA.

## Termos de referência FEAM

Painel **Termos de referência FEAM / PEA**:

- Catálogo com checkboxes (TR Educação, Dispensa, etc.).
- `POST /api/pea/import-feam-tr` — tenta baixar para `termos de referencia/PEA/` (se o portal bloquear, use o link de download manual).
- URL customizada para outros documentos FEAM.
- **Indexar pasta PEA no RAG** — requer perfil com permissão na API de importação (admin).

## Aba Flexível

Seções e notas extras além do TR fixo (`camposExtras`, `trOrientacoes`) — exportadas no Word.

## Exportação Word e PDF

- **PEA:** botões PDF e Word na edição (`pea-export-buttons.tsx`) — `pea-export-pdf.ts` / `pea-export-docx.ts`.
- **Dispensa:** PDF e Word (`dispensa-export-button.tsx`) — `dispensa-export-pdf.ts` / `dispensa-export-docx.ts`.

Requer identidade visual em Configurações (cabeçalho/rodapé/marca d'água).

## Depuração (auditoria cirúrgica)

Estado: ver [`docs/auditoria-depuracao-cirurgica.md`](./auditoria-depuracao-cirurgica.md) — secção Fase 1 PEA.

Checklist E2E geo (manual em `npm run dev`):

1. Criar análise em `/analise-ambiental?empreendimentoId={projectId}`.
2. PEA → Identificação com empreendimento → aba ABEA/Geo → vincular análise.
3. Aplicar textos e/ou perímetro; salvar; reabrir e confirmar `geoAnalysisId` / `geoVinculo`.
4. Export PDF e Word com branding configurado.

## Normas

DN COPAM 214/2017, DN 238/2020, TR Anexo I (FEAM/SEMAD).
