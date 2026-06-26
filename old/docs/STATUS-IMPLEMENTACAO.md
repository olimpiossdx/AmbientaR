# AmbientaR 2.0 – Status da Implementação

Este documento explica, em linguagem simples, o que cada fase do ROADMAP significa e **o que já foi implementado** versus o que ainda está previsto. Serve como “foto” da implantação para o time e para novos desenvolvedores.

---

## Visão geral das fases

| Fase | Nome resumido | Objetivo |
|------|----------------|----------|
| 1 | Organização e visão | Documentação e mapeamento do sistema atual |
| 2 | Consultas e Laudos | Funil do pedido até o laudo (dados + telas) |
| 3 | Motor de Relatórios | Preencher Word (DOCX) com dados e IA |
| 4 | IA / RAG e MCP | Contexto ambiental (MCP) + base jurídica (RAG) para a IA |
| 5 | App Offline | Coleta de campo (ex.: inventário) offline |
| 6 | Canais e Automação | WhatsApp, Instagram, assinaturas (Vindi) |

---

## Fase 1 – Organização e clareza da visão

**O que significa:** Alinhar “para onde o barco está indo” e documentar o que já existe.

### Implementado

- **Documentação**
  - `docs/PLANO-IMPLEMENTACAO.md` – visão macro das fases e convenções (placeholders DOCX, base jurídica, MCP/RAG).
  - `docs/ROADMAP.md` – backlog por fase com checkboxes.
  - `README.md` pode apontar para essa documentação (ajuste opcional).

### Previsto e não feito (baixa prioridade técnica)

- **Mapeamento do sistema atual**
  - Quadro simples dos módulos usados na jornada de consulta (Cadastro, Gestão Ambiental, Projetos/Estudos, Financeiro).
  - Definir 1–2 tipos de estudo prioritários (ex.: RCA + PIA).
  - Esboço “como é hoje” e “como será” do fluxo de um estudo prioritário.

**Conclusão Fase 1:** Documentação central está pronta; mapeamento detalhado em quadro/esboços pode ser feito quando for útil para priorização.

---

## Fase 2 – Núcleo de Consultas e Laudos

**O que significa:** Ter no sistema um “funil” único: pedido de serviço (consulta) → laudo associado, usando cadastros e gestão ambiental.

### Implementado

- **Modelagem de dados**
  - Coleções Firestore definidas e com regras:
    - **`consultas`** – demanda (cliente, empreendimento, tipo de estudo, canal, status, RT).
    - **`laudos`** – resultado vinculado à consulta, empreendedor, empreendimento, empresa ambiental.
    - **`rag_index`** – trechos de documentos longos para a IA.
  - Estados de consulta utilizados (nova, em_andamento, aguardando_dados, concluida, cancelada, etc.).
  - **Contexto ambiental mínimo** definido em tipo e função:
    - Empreendedor, empreendimento, empresa ambiental, licenças, outorgas, usos insignificantes, intervenções, fauna, monitoramentos, outros projetos.
    - Função: `getAmbientalContextByEmpreendimentoId(firestore, empreendimentoId)` em `src/lib/ambiental-context.ts`.

- **Telas e integrações**
  - **Consultas:** listagem (`/consultas`), nova consulta (`/consultas/new`), detalhe (`/consultas/[id]`), edição (`/consultas/[id]/edit`). Vínculo com empreendedor, empreendimento e tipo de estudo.
  - **Laudos:** listagem (`/laudos`), novo laudo (`/laudos/new`, inclusive com `?consultaId=`), detalhe (`/laudos/[id]`) com card “Contexto ambiental” e botão “Gerar DOCX”.
  - Itens de menu **Consultas** e **Laudos** em `src/lib/navigation-config.ts`.

**Conclusão Fase 2:** Núcleo de consultas e laudos está implementado (dados + telas + contexto ambiental).

---

## Fase 3 – Motor de Relatórios (DOCX + PDF)

**O que significa:** Transformar o contexto ambiental (e depois a IA) em laudo em Word e, no futuro, em PDF para envio.

### Implementado

- **Templates e placeholders**
  - Convenção de placeholders documentada em `docs/PLACEHOLDERS-DOCX.md` e no Plano (§7): `{{NOME_CLIENTE}}`, `{{BLOCO_DIAGNOSTICO_AMBIENTAL}}`, etc.
  - Templates em `public/templates/{tipo}/template.docx` (e README em `public/templates/README.md`).

- **Serviço de preenchimento**
  - Função que monta dados para o Word: `src/lib/docx-placeholders.ts` – `buildPlaceholderDataFromContext(ctx)`.
  - API `POST /api/laudos/gerar-docx`: recebe `laudoId`, `tipoEstudo`, `context`; lê o template, preenche placeholders e devolve DOCX para download.
  - Na tela do laudo: botão “Gerar DOCX” (após “Carregar contexto ambiental”).

### Previsto e não feito

- **Converter o DOCX final em PDF** e anexar ao registro de `laudos` (para download/envio).

**Conclusão Fase 3:** Motor de relatórios DOCX está implementado; conversão DOCX→PDF e anexo ao laudo está pendente.

---

## Fase 4 – IA / RAG e MCP

**O que significa:**  
- **MCP:** camada que entrega **dados confiáveis** do sistema (cadastro + gestão ambiental) para a IA.  
- **RAG:** uso de trechos da base jurídica (leis, TR, laudos antigos) para a IA fundamentar respostas.

### Implementado

- **MCP (camada de dados)**
  - Definição em comentário em `src/lib/ambiental-context.ts`.
  - Função de alto nível: `getAmbientalContextByEmpreendimentoId(firestore, empreendimentoId)` retorna pacote completo (empreendedor, empreendimento, empresa ambiental, licenças, outorgas, intervenções, fauna, monitoramentos, outros projetos).
  - Dados tipados (`AmbientalContext`) e usados no laudo e no assistente.

- **RAG e Base Jurídica**
  - Coleção **`knowledge_sources`** com regras Firestore (leitura autenticada; escrita admin/supervisor).
  - Tipos em `src/lib/types.ts`: `KnowledgeSource`, `KnowledgeSourceTipo`, `ModoInclusao`, etc.
  - **Inserção híbrida (manual + pipeline futuro):**
    - **Manual:** telas Base Jurídica – listagem (`/knowledge-sources`), nova fonte (`/knowledge-sources/new`), detalhe da fonte (`/knowledge-sources/[id]`) com “Adicionar trechos (manual)” (cola texto → gera entradas em `rag_index`).
    - **Script em lote:** `scripts/import-termos-referencia/` – lê pasta local (ex.: `termos de referencia`), extrai texto de PDF/DOCX/DOTX, cria fontes em `knowledge_sources` e trechos em `rag_index`.
  - Menu: **Configurações → Base Jurídica** (`/knowledge-sources`), roles admin/supervisor/gestor.
  - `src/lib/rag.ts`: `queryRagChunks(firestore, options)`, `formatRagChunksForPrompt(chunks)`.
  - Fluxos de IA:
    - Assistente (`src/ai/flows/assistant-flow.ts`, `src/app/(app)/studies/assistant/page.tsx`): recebe `contextoAmbiental` (MCP) e `trechosRag` (RAG); seleção opcional de empreendimento; cliente chama MCP + `queryRagChunks` e envia ambos para o assistente.

### Previsto e não feito

- **Ferramentas MCP granulares** (ex.: `get_empreendedor_by_id`, `list_licencas_for_empreendimento`) – hoje o uso é via contexto completo `getAmbientalContextByEmpreendimentoId`.
- **Pipeline automático** para popular `rag_index` (PDFs de laudos antigos, legislação, TR).
- **Robô semiautomático** que sugere fontes em `knowledge_sources` com `modoInclusao = "robo_sugeriu"` e `aprovado = false`.
- **Tela de aprovação:** na listagem da Base Jurídica há filtro "Arquivados", e para fontes com `modoInclusao = 'robo_sugeriu'` e não aprovadas aparecem botões **Aprovar** e **Arquivar**. Aprovar seta `aprovado: true`; Arquivar seta `arquivado: true`. Quando existir o pipeline, as sugestões do robô poderão ser aprovadas ou arquivadas ali. Indexação para `rag_index` ao aprovar fica para o pipeline.

**Conclusão Fase 4:** MCP (contexto ambiental) e RAG (consulta a trechos + uso no assistente) estão implementados; base jurídica com inserção manual e script em lote está pronta; pipeline/robô e tela de aprovação estão previstos para depois.

- **Detalhamento e pendências:** ver `docs/FASE4-DETALHAMENTO.md` (o que falta para a Fase 4 ficar completa, com prioridades e sugestões de implementação).

---

## Fase 5 – Aplicativo Offline (React Native)

**O que significa:** Coleta de campo (inventário, fauna, fotos, coordenadas) no celular, offline, com sincronização depois.

### Implementado (primeiro passo)

- **Menu** Configurações → **App de campo** (`/app-campo`) – visível para admin, technical, gestor, supervisor.
- **Página** que explica a Fase 5 e remete à documentação.
- **Documentação** `docs/APP-OFFLINE-FASE5.md`: escopo (inventário florestal como prioritário), modelo de dados (parcelas, indivíduos, fotos), opções (React Native + WatermelonDB vs PWA), próximos passos e sincronização.

### Previsto (ainda não feito)

- Protótipo React Native (ou PWA) com coleta offline e sync com Firestore/Storage.
- Teste em cenário real (área rural, baixa conexão).

---

## Fase 6 – Canais e Automação (WhatsApp, Instagram, Vindi)

**O que significa:** Entrada de pedidos e entrega de resultados por canais (WhatsApp, Instagram) e cobrança recorrente.

### Implementado (primeiro passo)

- **Menu** "Canais e Integrações" (`/canais`) – visível para admin, sales, supervisor.
- **Página** com três cards: WhatsApp (consulta → laudo pronto → envio), Instagram (Story/direct → lead/consulta), Assinaturas (Vindi).
- **Documentação** `docs/CANAIS-FASE6.md`: fluxos, payloads sugeridos para n8n, planos e limites, próximos passos de implementação.

### Previsto (ainda não feito)

- Webhook "laudo pronto" e integração n8n + WhatsApp Business API.
- Fluxo Instagram (leads/consulta) e endpoint.
- Cadastro de planos na Vindi, webhook e checagem de limites no app.

---

## Resumo executivo

| Fase | Situação | Principais pendências |
|------|----------|------------------------|
| 1 | Documentação feita | Mapeamento em quadro + esboços de fluxo (opcional) |
| 2 | **Implementada** | — |
| 3 | **Quase completa** | Converter DOCX em PDF e anexar ao laudo |
| 4 | **Parcial** | Pipeline/robô para RAG; tela de aprovação da base jurídica; ferramentas MCP granulares (opcional) |
| 5 | **Primeiro passo** | Menu + página App de campo + doc escopo e modelo de dados. Protótipo e sync pendentes. |
| 6 | **Primeiro passo** | Menu + página Canais e Integrações + doc fluxos (WhatsApp, Instagram, Vindi). Integrações técnicas pendentes. |

**O que já está no ar (uso diário):**

- Cadastro e Gestão Ambiental (já existentes).
- **Consultas** e **Laudos** (listar, criar, editar, ver detalhe).
- **Contexto ambiental** por empreendimento (carregar na tela do laudo).
- **Gerar DOCX** do laudo a partir do template e do contexto.
- **Base Jurídica** (fontes + trechos manuais ou via script na pasta “termos de referencia”).
- **Assistente IA** usando contexto ambiental (MCP) e trechos RAG quando o usuário escolhe um empreendimento.

Se quiser, na próxima etapa podemos priorizar: (1) DOCX→PDF e anexo ao laudo, (2) esboço da tela de aprovação da base jurídica, ou (3) itens do mapeamento da Fase 1.
