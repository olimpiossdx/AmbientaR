# AmbientaR — Arquitetura para IA de Preenchimento e Elaboração de Relatórios

Este documento sugere **estrutura, fluxos e implementação** para que a IA atue como componente central de **preenchimento e elaboração de relatórios**, com base em dados do empreendedor, detalhes locais e técnicos do empreendimento, pesquisas em ferramentas governamentais e **templates** carregados no sistema.

> Status geral do projeto atualizado em 30/03/2026: os módulos operacionais de gestão (incluindo `Autos de Infração - Defesa` e `Contratos-Fornecedores`) já estão ativos e documentados em `docs/ARQUITETURA_ATUAL.md`; este documento permanece como referência de roadmap para a camada de IA.

---

## 1. Visão geral do que pode ser feito

| Área | O que a IA faz | Onde se encaixa hoje |
|-----|----------------|----------------------|
| **Dados do empreendedor** | Normaliza, completa e valida dados inseridos (CNPJ, endereço, CNAE, responsável técnico) | Formulários de empreendedores, projetos, clientes |
| **Localização e meio** | Cruza polígono/CAR com bioma, APP, UC, hidrografia, uso do solo | Análise Geoespacial (IA), estudos RCA, EIA/RIMA, PIA |
| **Pesquisa governamental** | Consulta CAR, outorgas, licenças, intervenções, SEI (quando houver API) | Tools MCP + APIs; enriquecimento antes de gerar texto |
| **Preenchimento de formulários** | Preenche campos objetivos a partir de dados estruturados + template | Todos os estudos (RCA, PTRF, PRADA, PIA, PCA, EIA/RIMA, LAS-RAS, etc.) |
| **Elaboração de texto** | Redige seções técnicas (caracterização, impactos, medidas) seguindo template e normas | Relatórios, ToR, termos de referência |
| **Termos de referência / ToR** | Gera ToR a partir do tipo de estudo e dados do empreendimento | Novos fluxos específicos por tipo de estudo |

---

## 2. Estrutura de pastas sugerida

Organizar para separar **dados**, **templates**, **fluxos de IA** e **integrações**:

```
src/
├── ai/
│   ├── genkit.ts                 # já existe
│   ├── prompts/                  # prompts reutilizáveis por tipo de documento
│   │   ├── relatorio-ambiental.ts
│   │   ├── termo-referencia.ts
│   │   └── formulario-padrao.ts
│   ├── flows/
│   │   ├── analise-ambiental-flow.ts   # já existe
│   │   ├── assistant-flow.ts          # já existe
│   │   ├── preencher-relatorio-flow.ts # NOVO: dados + template → texto
│   │   ├── gerar-tor-flow.ts           # NOVO: tipo estudo + dados → ToR
│   │   ├── enriquecer-processo-flow.ts # NOVO: busca gov + normaliza
│   │   └── generate-*.ts               # já existem (financeiro, etc.)
│   └── tools/                     # NOVO: tools Genkit que chamam APIs/MCP
│       ├── car.ts                 # CAR / SICAR (quando houver API)
│       ├── geo.ts                 # sobreposição bioma, UC, hidrografia
│       ├── outorgas.ts            # consulta outorgas (ex.: MG)
│       └── licencas.ts            # consulta licenças
├── lib/
│   ├── types/
│   │   ├── processo.ts           # NOVO: Processo, Empreendimento, Local, etc.
│   │   ├── relatorio.ts          # NOVO: documento gerado, rascunho, fontes
│   │   └── analise-ambiental.ts  # já existe
│   ├── templates/                # NOVO: leitura/parse de templates
│   │   ├── loader.ts             # carrega template por slug (Firestore ou public)
│   │   └── placeholders.ts       # {{empreendimento.nome}}, etc.
│   └── ...
├── app/
│   └── (app)/
│       └── studies/
│           ├── assistant/        # já existe
│           ├── [tipo]/           # RCA, PIA, etc.
│           │   ├── page.tsx
│           │   ├── *-form.tsx
│           │   └── gerar-com-ia.tsx  # NOVO: botão "Gerar rascunho com IA"
│           └── ...
├── app/api/
│   ├── ai/
│   │   ├── preencher-relatorio/route.ts  # NOVO
│   │   ├── gerar-tor/route.ts           # NOVO
│   │   └── enriquecer-processo/route.ts  # NOVO
│   └── templates/[type]/route.ts # já existe
```

---

## 3. Modelo de dados (Firestore + tipos)

### 3.1 Entidades principais para a IA

- **Empreendedor** (já existe em parte): nome, CNPJ/CPF, contato, endereço.  
  → A IA pode **normalizar** (via Receita/CNPJ) e **completar** endereço.
- **Empreendimento / Projeto**: vinculado ao empreendedor; nome, atividade, CNAE, porte, potencial poluidor; **localização** (polígono, CAR, município, coordenadas).
- **Local**: município, UF, bacia, bioma, APP, reserva legal, distância a UC, corpos d’água.  
  → Pode ser **enriquecido** por fluxo de IA + tools (CAR, geo, outorgas).
- **Processo / Request**: tipo (licença, outorga, intervenção, etc.), órgão, status, **lista de documentos/estudos** (RCA, EIA/RIMA, ToR, etc.).
- **Documento/Estudo**: tipo (RCA, PTRF, ToR, …), template usado, **conteúdo** (HTML/Markdown ou campos), **rascunhoIA**, **fontes** (quais dados/APIs foram usados), status (rascunho, em revisão, final).

### 3.2 Onde guardar

- **Firestore**: manter collections atuais; adicionar (ou estender) por exemplo:
  - `processos` ou estender `requests` com campos de **diagnóstico técnico** (JSON) e **documentos** (subcoleção ou array de refs).
  - `templates`: metadados do template (slug, tipo, órgão, instruções para IA, versão); o arquivo .docx pode continuar em Storage ou `public/templates`.
- **Tipos TypeScript/Zod**: em `src/lib/types/processo.ts` e `relatorio.ts` para validar entrada/saída dos fluxos de IA e da API.

---

## 4. Sistema de templates

### 4.1 Hoje

- Templates por **slug** (rca, ptrf, prada, …) em `public/templates/<slug>/template.docx`.
- API `GET/POST /api/templates/[type]` para listar e fazer upload.

### 4.2 Melhorias sugeridas

1. **Metadados por template**  
   Para cada slug, guardar (Firestore ou JSON em `public/templates/<slug>/meta.json`):
   - `instrucoesIA`: texto fixo para a IA (ex.: “Use tom técnico, cite DN COPAM 217/2017 quando aplicável”).
   - `secoesObrigatorias`: lista de títulos de seções que o relatório deve ter.
   - `placeholders`: lista de chaves esperadas (ex.: `empreendimento.nome`, `local.municipio`).

2. **Template “base” em Markdown**  
   Além do .docx, manter uma versão em Markdown com placeholders `{{empreendimento.nome}}`, `{{local.municipio}}`, etc., para a IA preencher e depois converter para DOCX/PDF (ex.: via lib ou serviço).

3. **Versão e órgão**  
   Campos `versao` e `orgao` (ex.: SEMAD/MG) para futura seleção por órgão.

---

## 5. Fluxos de IA propostos

### 5.1 Enriquecer processo (`enriquecerProcessoFlow`)

- **Entrada**: id do processo (ou objeto com empreendimento + localização).
- **Passos**:
  1. Buscar dados do processo/empreendimento no Firestore (via backend).
  2. Chamar **tools** (CAR, sobreposição geo, outorgas, licenças) quando houver dados (ex.: número CAR, polígono).
  3. Montar um **diagnóstico técnico** (JSON) e gravar no processo.
- **Saída**: diagnóstico atualizado (e persistido).  
- **Uso**: antes de gerar qualquer relatório; pode ser acionado por botão “Atualizar dados com fontes oficiais”.

### 5.2 Preencher relatório (`preencherRelatorioFlow`)

- **Entrada**: id do processo, tipo de documento (slug do template), opcionalmente seção específica.
- **Passos**:
  1. Carregar dados do processo + diagnóstico (se existir).
  2. Carregar template (Markdown ou instruções + seções) e metadados.
  3. Chamar prompt de IA com: dados estruturados + instruções do template + ferramentas (para citar fontes).
  4. IA retorna texto por seção ou documento completo.
- **Saída**: objeto com `secoes` ou `conteudo` + `fontes` (quais campos/APIs usou).
- **Uso**: botão “Gerar rascunho com IA” em cada tipo de estudo (RCA, PIA, etc.); resultado vai para campo de rascunho e pode ser editado antes de exportar PDF/DOCX.

### 5.3 Gerar termo de referência (`gerarTorFlow`)

- **Entrada**: id do processo, tipo de estudo (EIA/RIMA, RAS, etc.).
- **Passos**:
  1. Dados do processo + diagnóstico.
  2. Template e instruções específicas para ToR.
  3. IA gera ToR com escopo, metodologia e itens de entrega.
- **Saída**: texto do ToR; salvar como documento do tipo “ToR” no processo.

### 5.4 Assistente e análise já existentes

- **Assistente** (`assistant-flow`): manter para dúvidas gerais e legislação.
- **Análise geoespacial** (`analise-ambiental-flow`): manter; pode ser um dos “tools” usados no enriquecimento quando o input for polígono/CAR.

---

## 6. Integração com ferramentas governamentais (MCP / APIs)

### 6.1 Tools Genkit no backend

- Cada “fonte” externa vira um **tool** Genkit (como já em `analise-ambiental-flow`: `getDadosCAR`, `analisarSobreposicao`).
- Implementação:
  - **CAR**: quando houver API SICAR/estadual, o tool chama a API; senão, manter mock ou integração manual (upload de recibo).
  - **Geo**: sobreposição com bioma, UC, hidrografia (já simulado; evoluir para API real ou serviço interno).
  - **Outorgas/Licenças**: conforme disponibilidade de API (ex.: MG); senão, tool pode retornar “consulte o portal” + link.

### 6.2 MCP (Cursor / servidor)

- **Firebase MCP**: para o Cursor poder ler/gravar Firestore e Storage (processos, documentos, templates).
- **Composio ou HTTP MCP**: para orquestrar chamadas a APIs governamentais a partir do Cursor, se fizer sentido no seu fluxo de desenvolvimento.
- No projeto, configurar `.cursor/mcp.json` com a URL do servidor MCP que expõe essas tools.

### 6.3 Lista de fontes desejáveis (para roadmap)

- CAR / SICAR (quando disponível).
- IDE-Sisema (MG) – se houver API ou scraping controlado.
- Consulta de licenças e outorgas (MG e outros estados).
- SEI (integração limitada; muitas vezes manual).
- IBGE (municípios, biomas) – APIs públicas.
- Mapas e hidrografia (ex.: ANA, serviços geo).

---

## 7. UX sugerida na aplicação

1. **Tela do processo / request**  
   - Botão “Atualizar dados com fontes oficiais” → chama `enriquecerProcesso` e mostra resumo do diagnóstico.

2. **Tela de cada estudo (RCA, PIA, etc.)**  
   - Botão “Gerar rascunho com IA”:
     - Chama `preencherRelatorioFlow` com processo + tipo de documento.
     - Mostra loading e depois **editor rich-text** (ou texto longo) com o rascunho e indicação de “Revisar trechos marcados”.
   - Botão “Exportar PDF/DOCX” usa o conteúdo revisado.

3. **Termo de referência**  
   - Opção “Gerar ToR com IA” na abertura de um estudo que exija ToR → `gerarTorFlow`; resultado editável e salvo como documento.

4. **Assistente**  
   - Manter como está; opcionalmente permitir “usar contexto do processo X” para respostas mais contextualizadas.

---

## 8. Checklist de implementação (priorizado)

- [ ] **Tipos**  
  - [ ] `Processo`, `Empreendimento`, `Local`, `DiagnosticoTecnico` em `src/lib/types/processo.ts`.  
  - [ ] `DocumentoEstudo`, `RascunhoIA`, `Fontes` em `src/lib/types/relatorio.ts`.

- [ ] **Templates**  
  - [ ] Metadados (instruções IA, seções, placeholders) por slug.  
  - [ ] (Opcional) Versão Markdown com placeholders para preenchimento por IA.

- [ ] **Fluxos IA**  
  - [ ] `enriquecerProcessoFlow` + tools (CAR, geo, outorgas quando possível).  
  - [ ] `preencherRelatorioFlow` (dados + template → texto + fontes).  
  - [ ] `gerarTorFlow` para ToR.

- [ ] **API**  
  - [ ] `POST /api/ai/enriquecer-processo`  
  - [ ] `POST /api/ai/preencher-relatorio`  
  - [ ] `POST /api/ai/gerar-tor`

- [ ] **UI**  
  - [ ] Botão “Atualizar dados com fontes oficiais” na tela de processo.  
  - [ ] Botão “Gerar rascunho com IA” nas telas de estudo (RCA, PIA, etc.).  
  - [ ] Exibição de rascunho editável e exportação PDF/DOCX.

- [ ] **MCP**  
  - [ ] Configurar Firebase MCP no projeto.  
  - [ ] (Opcional) Servidor HTTP ou Composio para ferramentas governamentais.

---

## 9. Resumo

- **Dados**: modelo claro de Processo + Empreendimento + Local + Diagnóstico; Firestore + tipos em `lib/types`.
- **Templates**: metadados por slug + (opcional) Markdown com placeholders para a IA preencher.
- **IA**: três fluxos principais — enriquecer processo, preencher relatório, gerar ToR — usando tools (CAR, geo, outorgas/licenças) e prompts específicos por tipo de documento.
- **Governamental**: tools Genkit no backend; MCP (Firebase + opcionalmente outros) para Cursor e futuras integrações.
- **UX**: botões explícitos para “atualizar com fontes oficiais” e “gerar rascunho com IA”, com revisão humana antes de exportar.

Isso estrutura a aplicação para a IA atuar de forma correta e sustentável no preenchimento e elaboração de relatórios, formulários e termos de referência com base nos dados do empreendedor, detalhes locais e técnicos e pesquisas em ferramentas governamentais, sempre apoiada pelos templates carregados no sistema.
