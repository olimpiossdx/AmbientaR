# Fase 4 – IA / RAG e MCP – Detalhamento e pendências

Este documento detalha o que a **Fase 4** significa, o que já está implementado e **o que falta para a fase ficar completa**.

---

## 1. Objetivo da Fase 4

A Fase 4 une duas camadas:

- **MCP (camada de dados):** funções que entregam **dados confiáveis** do sistema (cadastro, gestão ambiental, projetos) para a IA. Não é “Model Context Protocol” no sentido do protocolo MCP genérico; no AmbientaR é a camada que monta o **contexto ambiental** por empreendimento.
- **RAG (Retrieval Augmented Generation):** uso de trechos da **base jurídica** (leis, termos de referência, laudos antigos, notas internas) para a IA fundamentar respostas e gerar textos técnicos alinhados à realidade do cliente e à legislação.

**Fase 4 completa** significa:

1. A IA (assistente e geração de laudos) usa sempre **MCP + RAG** quando há empreendimento/conteúdo relevante.
2. A base jurídica pode ser **alimentada de forma automática ou semiautomática** (não só manual).
3. Existe **fluxo de aprovação** para fontes sugeridas por robô antes de entrarem no RAG.
4. Opcional: **ferramentas MCP granulares** para a IA chamar dados específicos (hoje já existe a função de alto nível que entrega o pacote completo).

---

## 2. O que já está implementado

### 2.1 MCP (contexto ambiental)

| Item | Onde está | Descrição |
|------|-----------|-----------|
| Definição do MCP | `src/lib/ambiental-context.ts` (comentário) | “Camada que sabe buscar dados confiáveis do sistema e entregar para a IA.” |
| Função de alto nível | `getAmbientalContextByEmpreendimentoId(firestore, empreendimentoId)` | Retorna `AmbientalContext`: empreendedor, empreendimento, empresa ambiental, licenças, outorgas, usos insignificantes, intervenções, fauna, monitoramentos, outros projetos. |
| Tipos | `src/lib/types.ts` | `AmbientalContext`, tipos de licenças, outorgas, etc. |
| Uso no laudo | Tela `/laudos/[id]` | Botão “Carregar contexto ambiental” e “Gerar DOCX” usam esse contexto. |
| Uso no assistente | `src/ai/flows/assistant-flow.ts`, `src/app/(app)/studies/assistant/page.tsx` | Usuário pode escolher empreendimento; o cliente chama MCP e envia `contextoAmbiental` para o assistente. |

**Conclusão:** MCP está implementado e em uso. Falta apenas (opcional) expor **ferramentas granulares** (ex.: `get_empreendedor_by_id`, `list_licencas_for_empreendimento`) para a IA chamar sob demanda em vez de receber sempre o pacote completo.

---

### 2.2 RAG e Base Jurídica

| Item | Onde está | Descrição |
|------|-----------|-----------|
| Coleção `knowledge_sources` | Firestore + `src/lib/types.ts` | Fontes de conhecimento (leis, TR, laudos, notas). Campos: tipo, órgão, número, status, storagePath, modoInclusao, aprovado, etc. |
| Coleção `rag_index` | Firestore + `src/lib/types.ts` | Trechos (chunkText, sourceId, tipoDocumento, orgao, uf, numero, titulo). Campo `embedding` previsto no tipo para busca vetorial futura. |
| Regras Firestore | `src/firebase/rules/firestore.rules` | Leitura autenticada; escrita restrita (admin/supervisor). |
| Consulta ao RAG | `src/lib/rag.ts` | `queryRagChunks(firestore, options)` – retorna trechos por limite e filtros (tipo, UF, órgão). **Sem embeddings:** não há busca por similaridade semântica; retorna trechos recentes ou filtrados. |
| Formatação para prompt | `src/lib/rag.ts` | `formatRagChunksForPrompt(chunks)` – monta texto para injetar no prompt. |
| Telas Base Jurídica | `/knowledge-sources`, `/knowledge-sources/new`, `/knowledge-sources/[id]` | Listagem, criação de fonte, detalhe com “Adicionar trechos (manual)” (cola texto → grava em `rag_index`). |
| Menu | Configurações → Base Jurídica | Roles: admin, supervisor, gestor. |
| Script em lote | `scripts/import-termos-referencia/` | Lê pasta local (ex.: `termos de referencia`), extrai texto de PDF/DOCX/DOTX, cria fontes em `knowledge_sources` e trechos em `rag_index`. |
| Uso no assistente | `src/app/(app)/studies/assistant/page.tsx` | Chama `queryRagChunks` e envia `trechosRag` junto com `contextoAmbiental` para o assistente. |

**Conclusão:** RAG está implementado para **inserção manual e via script** e para **uso no Assistente IA**. Falta: pipeline automático para popular `rag_index`, robô de sugestão, busca por embeddings e **preenchimento dos blocos BLOCO_* no DOCX pela IA**.

---

### 2.3 Fluxos de IA atuais

- **Assistente** (`/studies/assistant`): já usa MCP (contexto ambiental) + RAG (trechos) quando o usuário escolhe um empreendimento. Gera respostas em chat.
- **Gerar DOCX** (`/api/laudos/gerar-docx`): usa apenas `buildPlaceholderDataFromContext(ctx)`. Os placeholders `{{BLOCO_*}}` são preenchidos com **string vazia** em `src/lib/docx-placeholders.ts` (linhas 88–97). Ou seja, a IA **não** gera ainda os blocos de texto do laudo no momento de gerar o DOCX.

---

## 3. O que falta para a Fase 4 ficar completa

### 3.1 Pipeline para popular `rag_index` (prioridade alta)

**Objetivo:** Encher o `rag_index` a partir de PDFs/DOCX já existentes (laudos antigos, legislação, termos de referência), sem depender só de colar texto manual ou do script em pasta local.

**O que fazer:**

1. **Processo (job ou API protegida)** que:
   - Recebe um documento já cadastrado em `knowledge_sources` (com `storagePath` apontando para um PDF/DOCX no Storage ou em `public/`).
   - Extrai o texto do arquivo (ex.: biblioteca para PDF/DOCX no Node).
   - Quebra o texto em trechos (parágrafos ou janelas com overlap), com tamanho mínimo/máximo (ex.: 50–800 caracteres).
   - Para cada trecho, cria um documento em `rag_index` com: `sourceId`, `chunkText`, `tipoDocumento`, `orgao`, `uf`, `numero`, `titulo` (e, no futuro, `embedding`).
   - Opcional: marcar a fonte como “indexada” para não reprocessar.

2. **Ponto de disparo:**  
   - Ao **aprovar** uma fonte na tela de Base Jurídica (botão “Aprovar”), ou  
   - Botão “Indexar para RAG” no detalhe da fonte (`/knowledge-sources/[id]`), ou  
   - Job agendado que processa fontes com `aprovado === true` e ainda não indexadas.

3. **Escopo inicial:** Pode ser só PDF e DOCX; DOC/DOTX já são cobertos pelo script `import-termos-referencia` em ambiente local.

**Arquivos sugeridos:** Nova API (ex.: `POST /api/knowledge-sources/[id]/index-rag`) ou Cloud Function; reutilizar lógica de extração de texto do `scripts/import-termos-referencia` se for em Node.

---

### 3.2 Robô semiautomático de atualização da base jurídica (prioridade média)

**Objetivo:** Sugerir novas normas e atualizações (vigente/revogada/alterada) a partir de fontes oficiais (COPAM, SEMAD, IGAM, IEF), sem que o humano precise descobrir tudo manualmente.

**O que fazer:**

1. **Script ou job** (ex.: 1x por semana):
   - Acessa páginas/listas oficiais de legislação (scraping ou APIs, se existirem).
   - Compara com o que já existe em `knowledge_sources` (por número, órgão, tipo).
   - Para **norma nova:** cria registro em `knowledge_sources` com `modoInclusao = "robo_sugeriu"` e `aprovado = false`; opcionalmente baixa o PDF e preenche `storagePath`.
   - Para **norma existente** que foi revogada/alterada: atualiza o campo `status` e `ultimaVerificacao`.

2. **Não** popular `rag_index` automaticamente: só após aprovação humana (ver 3.3).

**Complexidade:** Depende da estrutura das páginas (HTML, PDFs, links). Pode começar com uma lista fixa de URLs e um parser simples.

---

### 3.3 Tela de aprovação da base jurídica (prioridade alta)

**Objetivo:** O humano aprovar ou arquivar fontes sugeridas pelo robô e, ao aprovar, disparar a indexação para o `rag_index`.

**O que já existe:**

- Listagem em `/knowledge-sources` com filtro “Arquivados”.
- Para fontes com `modoInclusao === 'robo_sugeriu'` e não aprovadas, já existem botões **Aprovar** e **Arquivar** (aprovado → `aprovado: true`, arquivar → `arquivado: true`).

**O que falta:**

- Ao clicar **Aprovar**, além de setar `aprovado: true`, **disparar o pipeline de indexação** (3.1): ler o documento (Storage ou URL), extrair texto, criar trechos em `rag_index`.  
  Isso pode ser uma chamada à API `POST /api/knowledge-sources/[id]/index-rag` ou equivalente.

- Garantir que fontes com `aprovado: false` não sejam usadas em `queryRagChunks` (filtrar por fonte aprovada ao buscar trechos, ou só indexar quando aprovar).

---

### 3.4 Preenchimento dos blocos BLOCO_* no DOCX pela IA (prioridade alta)

**Objetivo:** Na geração do laudo DOCX, os placeholders `{{BLOCO_ENQUADRAMENTO_LEGAL}}`, `{{BLOCO_MEIO_FISICO}}`, etc., devem ser preenchidos com **texto gerado pela IA** usando MCP + RAG, e não com string vazia.

**O que fazer:**

1. No fluxo de **Gerar DOCX** (na API `gerar-docx` ou em um passo anterior na tela do laudo):
   - Já se tem o `AmbientalContext` (MCP).
   - Buscar trechos RAG com `queryRagChunks` (ex.: filtro por tipo de estudo ou genérico).
   - Para cada placeholder `BLOCO_*`, chamar a IA (Genkit ou outro) com:
     - contexto ambiental (resumo do MCP),
     - trechos RAG formatados (`formatRagChunksForPrompt`),
     - instrução do que gerar (ex.: “Redija o enquadramento legal para este empreendimento com base no contexto e nas normas abaixo”).
   - Montar o objeto de placeholders com esses textos e os demais campos já preenchidos por `buildPlaceholderDataFromContext`.

2. **Alternativa:** Tela do laudo com botão “Gerar blocos com IA” que preenche apenas os BLOCO_* (e grava em algum campo do laudo ou retorna para colar no Word). Depois, “Gerar DOCX” usaria esses textos se existirem.

3. Cuidados: limite de tokens, timeout, tratamento de erro (se a IA falhar, deixar vazio ou texto padrão).

**Arquivos envolvidos:** `src/lib/docx-placeholders.ts` (ou novo módulo que chama IA e monta os blocos), `src/app/api/laudos/gerar-docx/route.ts`, fluxos em `src/ai/flows/` (reutilizar padrão do assistente).

---

### 3.5 Busca vetorial (embeddings) no RAG (prioridade baixa)

**Objetivo:** Em vez de retornar trechos “recentes” ou “por filtro”, retornar os trechos **mais similares** à pergunta ou ao contexto do laudo.

**O que fazer:**

1. Ao criar/atualizar trechos em `rag_index`, calcular **embedding** do `chunkText` (ex.: via API de embeddings do Google ou outro provedor) e gravar no campo `embedding` (array numérico).
2. Na `queryRagChunks`, aceitar um parâmetro `queryText` (ou `embedding`); se existir, usar busca por similaridade (ex.: Firestore com extensão de vetores, ou outro store).
3. Documentação em `src/lib/rag.ts` já menciona que “busca vetorial fica para implementação futura”.

**Impacto:** Melhora a relevância dos trechos injetados na IA; não é obrigatório para considerar a Fase 4 “completa” se o volume de trechos for pequeno e os filtros (tipo, órgão) forem suficientes.

---

### 3.6 Ferramentas MCP granulares (prioridade baixa / opcional)

**Objetivo:** Expor funções como `get_empreendedor_by_id`, `get_empreendimento_by_id`, `list_licencas_for_empreendimento`, etc., para a IA chamar sob demanda (ex.: em um fluxo de agente com tools), em vez de receber sempre o pacote completo.

**O que fazer:**

- Implementar funções em `src/lib/ambiental-context.ts` (ou módulo separado) que leem do Firestore e retornam esses dados.
- Se o assistente ou outro fluxo usar um padrão “tools”, registrar essas funções como ferramentas disponíveis para a IA.

**Benefício:** Mais flexibilidade para a IA pedir só o que precisa; hoje o uso do “pacote completo” já atende o assistente e o laudo.

---

## 4. Resumo: checklist para Fase 4 completa

| # | Item | Prioridade | Status |
|---|------|------------|--------|
| 1 | Pipeline para popular `rag_index` a partir de PDF/DOCX (fonte em `knowledge_sources`) | Alta | Pendente |
| 2 | Ao aprovar fonte na Base Jurídica, disparar indexação para `rag_index` | Alta | Pendente |
| 3 | Preencher `{{BLOCO_*}}` no DOCX com texto gerado pela IA (MCP + RAG) | Alta | Pendente |
| 4 | Robô semiautomático que sugere fontes (COPAM, SEMAD, etc.) com `modoInclusao = "robo_sugeriu"` | Média | Pendente |
| 5 | Busca por embeddings no RAG (similaridade semântica) | Baixa | Pendente |
| 6 | Ferramentas MCP granulares para a IA | Baixa/Opcional | Pendente |

**Já feito e estável:** MCP (contexto ambiental), RAG (consulta a trechos + uso no assistente), Base Jurídica (telas + script em lote), Assistente IA usando MCP + RAG.

Com os itens **1, 2 e 3** implementados, a Fase 4 pode ser considerada **completa** para o fluxo principal (laudos com blocos IA e base jurídica alimentada/indexada com aprovação). Os itens 4, 5 e 6 são evoluções desejáveis mas não bloqueantes.

---

## 5. O que precisa de você vs o que pode seguir sem você

### 5.1 O que **precisa de você** para continuar

Coisas que dependem de decisão sua, de configuração ou de dados que só você tem:

| O que | Por quê |
|-------|--------|
| **Chave de IA** | **OpenAI serve.** Use `OPENAI_API_KEY` (chave da OpenAI). O projeto passará a usar o SDK oficial da OpenAI para gerar os blocos BLOCO_* no DOCX (e opcionalmente para o Assistente). A `GOOGLE_GENAI_API_KEY` continua opcional para o Assistente via Genkit; se você tiver só OpenAI, usamos só ela. Sem nenhuma chave, o código pode ser implementado, mas a geração de texto pela IA não roda. |
| **Onde ficam os arquivos das fontes** | O pipeline de indexação pode ler de **Firebase Storage** (`storagePath` na fonte) ou de um caminho no servidor. Decidir: você sobe os PDFs pelo app (Storage) ou prefere que o script/API leia de uma pasta (ex.: `public/` ou volume no servidor)? Isso define um pouco o desenho da API de indexação. |
| **Robô (item 4 – prioridade média)** | Para o robô sugerir normas sozinho, alguém precisa definir **quais URLs** usar (COPAM, SEMAD, IGAM, IEF) e, se as páginas forem complicadas, dar um esqueleto do que extrair. Isso pode ficar para depois; não bloqueia os itens 1, 2 e 3. |
| **Dados na Base Jurídica** | Cadastrar fontes (leis, TR, laudos antigos) e, depois que o pipeline existir, **aprovar** e **indexar**. Isso você faz quando o código já estiver pronto; não precisa “mexer” antes. |

Em resumo: para **implementar** os itens 1, 2 e 3, a única coisa que pode ser necessária é decidir **onde o pipeline lê o arquivo** (Storage vs caminho no servidor). O resto (chave de IA, cadastro e aprovação de fontes) você usa **depois** que o código estiver no ar.

---

### 5.2 O que **pode continuar agora sem você mexer** (e você só “lança os dados” depois)

Tudo isso pode ser desenvolvido no código agora. Depois você só: cadastra fontes, aprova, gera laudo.

| Item | O que será feito no código | O que você faz depois |
|------|----------------------------|------------------------|
| **Pipeline para popular `rag_index`** (3.1) | API ou job que, dado um `id` de fonte em `knowledge_sources`, lê o PDF/DOCX (Storage ou caminho definido), extrai texto, quebra em trechos e grava em `rag_index`. Botão “Indexar para RAG” na tela da fonte. | Cadastrar as fontes (ou usar o script da pasta `termos de referencia`); clicar em “Indexar” (ou “Aprovar”, se estiver ligado ao aprovar). |
| **Aprovar → disparar indexação** (3.3) | No clique em “Aprovar”, além de `aprovado: true`, chamar a API de indexação acima. Garantir que a busca RAG só use trechos de fontes aprovadas (filtrar por `sourceId` em fontes com `aprovado === true`). | Apenas usar a tela: quando o robô (ou alguém) criar fontes com `robo_sugeriu`, você clica “Aprovar”; o sistema indexa sozinho. |
| **Preencher BLOCO_* no DOCX pela IA** (3.4) | No fluxo “Gerar DOCX”: buscar trechos RAG, chamar a IA (OpenAI via SDK, usando `OPENAI_API_KEY`) com contexto ambiental + trechos para cada bloco (enquadramento, meio físico, etc.) e preencher os placeholders. Se não tiver chave ou der erro, deixar vazio ou texto padrão. | Ter `OPENAI_API_KEY` configurada no `.env.local` e ter **já** carregado contexto ambiental e, se quiser texto melhor, fontes indexadas no RAG. Aí é só clicar “Gerar DOCX”. |

Nada disso exige que você **insira dados ou configure coisas antes** do desenvolvimento. A ordem pode ser:

1. **Agora:** implementar pipeline de indexação + integração no “Aprovar” + preenchimento dos BLOCO_* pela IA no DOCX.  
2. **Depois:** você (ou alguém) cadastra fontes na Base Jurídica, sobe PDFs se for o caso, aprova e indexa; na hora de gerar o laudo, o sistema já usa MCP + RAG e preenche os blocos.

A única decisão técnica que pode ser útil **antes** de fechar o código do pipeline é: **os arquivos das fontes vêm do Firebase Storage (upload pelo app) ou de um caminho no servidor/pasta?** Com isso definido, o resto pode “continuar agora” e você “lança os dados” quando estiver pronto.

---

## 6. As 4 etapas (ordem de implementação)

Seguimos **por etapas** os 4 itens principais. A chave **OpenAI serve**: o projeto usa `OPENAI_API_KEY` para a IA (blocos no DOCX e, se quisermos, Assistente). Configure no `.env.local`:

```env
OPENAI_API_KEY=sk-...
```

| Etapa | Item | O que será feito | Depende de você? |
|-------|------|------------------|-------------------|
| **Etapa 1** | Pipeline para popular `rag_index` | API `POST /api/knowledge-sources/[id]/index-rag`: lê a fonte (Storage ou caminho), extrai texto do PDF/DOCX, quebra em trechos, grava em `rag_index`. Botão “Indexar para RAG” na tela do detalhe da fonte. | Só definir onde o arquivo está (Storage vs pasta/servidor). Depois você cadastra fontes e clica “Indexar”. |
| **Etapa 2** | Aprovar → disparar indexação | No “Aprovar” da Base Jurídica, chamar a API da Etapa 1. Ajustar `queryRagChunks` para só retornar trechos de fontes com `aprovado === true`. | Não. Depois você só aprova fontes na tela. |
| **Etapa 3** | Preencher BLOCO_* no DOCX pela IA | No “Gerar DOCX”: buscar RAG, para cada `BLOCO_*` chamar OpenAI (SDK) com contexto MCP + trechos RAG e instrução do bloco; montar placeholders e gerar DOCX. | Ter `OPENAI_API_KEY` no `.env.local`. Depois você gera o laudo com contexto carregado. |
| **Etapa 4** | Robô semiautomático (prioridade média) | Script/job que acessa páginas oficiais (COPAM, SEMAD, etc.), compara com `knowledge_sources`, cria sugestões com `modoInclusao = "robo_sugeriu"`. | Pode ficar por último; você pode definir URLs/listas quando for implementar. |

Ordem sugerida de desenvolvimento: **Etapa 1 → Etapa 2 → Etapa 3**. A **Etapa 4** pode ser depois, quando as três primeiras estiverem estáveis.
