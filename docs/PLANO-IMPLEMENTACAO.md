## AmbientaR 2.0 – Plano de Implementação

### 1. Objetivo

Organizar a evolução do AmbientaR para um **SaaS de consultas ambientais automatizadas**, com foco inicial em Minas Gerais e expansão para o Brasil, mantendo a base atual em produção e evoluindo de forma incremental e segura.

---

### 2. Fases macro (explicadas em linguagem simples)

- **Fase 1 – Organização e clareza da visão**
  - Ideia: alinhar “para onde o barco está indo”.
  - O que significa na prática:
    - Colocar por escrito a visão do AmbientaR 2.0 (este arquivo + o PDF de visão).
    - Anotar quais partes do sistema atual já ajudam nessa visão (cadastros, estudos, contratos etc.).
    - Esclarecer quem são os perfis de usuário (cliente titular, representante, consultor, financeiro, gestor) e o que cada um consegue fazer.
  - Resultado esperado:
    - Quando alguém novo entrar no projeto, consegue entender o que é o AmbientaR 2.0 lendo poucos arquivos.

- **Fase 2 – Núcleo de Consultas e Laudos**
  - Ideia: criar um “funil” único, do pedido de serviço até o laudo pronto.
  - Coleções base no banco de dados (Firestore):
    - `consultas`: cada vez que alguém pede um serviço ambiental (via site, WhatsApp, interno) nasce uma “consulta”.
    - `laudos` (ou `studies`): o resultado daquela consulta, em forma de estudo/técnico (RCA, PIA, inventário, relatório de fauna etc.).
    - `rag_index`: uma espécie de “biblioteca inteligente” com trechos de documentos importantes (leis, laudos antigos, notas internas) que a IA vai consultar.
  - Relação com o menu do sistema:
    - Usa informações do **menu Cadastro** (Empreendedor, Empreendimento, Empresa ambiental).
    - Usa informações do **menu Gestão Ambiental** (licenças, outorgas, usos insignificantes, monitoramentos, fauna, etc.).
    - Usa informações do **menu Projetos** e **Estudos** (RCA, PIA, PCA, inventário, fauna, PRADA, etc.).
  - Resultado esperado:
    - Você consegue olhar uma “consulta” e ver todo o contexto ambiental daquele cliente/empreendimento antes de gerar o laudo.

- **Fase 3 – Motor de Relatórios (DOCX + PDF)**
  - Ideia: transformar aquele contexto ambiental em um laudo profissional, com cara de Word, de forma semiautomática.
  - Como funciona:
    - Para cada tipo de estudo (RCA, PIA, etc.) existe um **arquivo `.docx` modelo**, com trechos fixos e espaços marcados com códigos (ex.: `{{NOME_CLIENTE}}`, `{{MUNICIPIO}}`, `{{BLOCO_DIAGNOSTICO_AMBIENTAL}}`).
    - O sistema pega:
      - Dados do cadastro + gestão ambiental + projetos (via MCP).
      - Trechos de texto recomendados pela IA (via RAG).
      - E preenche esses espaços no `.docx`.
    - Depois, o `.docx` é convertido para **PDF** para envio e assinatura.
  - Resultado esperado:
    - Você gasta energia pensando na qualidade das informações e menos “copiando e colando” entre documentos.

- **Fase 4 – IA / RAG e MCP**
  - Ideia: separar bem duas funções:
    - **MCP**: “guarda-costas” dos dados estruturados (cadastros, gestão ambiental, projetos, laudos).
    - **RAG**: “cérebro” que lê documentos longos (leis, laudos antigos, notas) e sugere textos novos.
  - MCP (Multi-Component Platform), na prática:
    - Um conjunto de funções bem definidas que respondem perguntas como:
      - “Qual é o cadastro completo deste empreendedor e deste empreendimento?”
      - “Quais licenças, outorgas, usos insignificantes e monitoramentos estão ativos para este empreendimento?”
      - “Quais projetos e estudos já existem para este cliente?”
    - MCP monta um **“pacote de contexto ambiental”** para um determinado empreendimento.
  - RAG (Retrieval Augmented Generation), na prática:
    - Quando precisa escrever um trecho do laudo (por exemplo: enquadramento legal), o sistema:
      - Usa o contexto ambiental do MCP (atividade, porte, localização, situação de licenças).
      - Procura na biblioteca `rag_index` trechos de leis, resoluções, laudos parecidos.
      - Pede para a IA escrever um parágrafo novo, citando o que for mais relevante.
  - Resultado esperado:
    - Textos técnicos mais coerentes com a realidade do cliente, baseados no que já existe (internalizado no `rag_index`) e no contexto real daquele empreendimento (MCP).

- **Fase 5 – Aplicativo Offline (campo)**
  - Ideia: permitir que o trabalho de campo (inventário florestal, fauna, medições, fotos, coordenadas) seja feito no celular, mesmo sem internet.
  - Primeiros passos:
    - Escolher 1 fluxo de campo mais importante para você (por exemplo: inventário florestal).
    - Criar telas simples de coleta (lista de parcelas, árvores, DAP, altura, fotos, coordenadas).
    - Guardar essas informações localmente no aparelho e sincronizar com o AmbientaR quando houver conexão.
  - Resultado esperado:
    - Menos risco de perder dados de campo, menos planilhas soltas, e dados já prontos para alimentar os laudos automatizados.

- **Fase 6 – Canais e Automação**
  - Ideia: depois que a “máquina de laudos” está funcionando, facilitar a entrada de pedidos e a entrega dos resultados.
  - Exemplos:
    - WhatsApp Business:
      - Cliente manda mensagem → robô registra uma `consulta` → quando o laudo estiver pronto, o sistema envia o PDF pelo WhatsApp.
    - Instagram:
      - Story com “Saiba se sua atividade está regular” → pessoa preenche dados básicos → vira uma `consulta` no sistema.
    - Cobrança recorrente (Vindi):
      - Consultorias assinam um plano mensal/anual → têm direito a um certo número de consultas/laudos por mês.
  - Resultado esperado:
    - Menos trabalho manual de “ficar anotando pedido” e mais tempo para a parte técnica.


---

### 3. Entregáveis imediatos da Fase 1 (nesta etapa)

- **Documentação mínima no repositório**
  - Este arquivo: `docs/PLANO-IMPLEMENTACAO.md` (visão geral das fases).
  - `docs/ROADMAP.md` com um quadro enxuto de backlog por fase.
  - Ajuste futuro do `README.md` para apontar para estes documentos (sem urgência técnica).

- **Mapeamento alto nível do sistema atual**
  - Registros já existentes (clientes, empreendedores, empreendimentos, estudos, contratos, propostas).
  - Papéis de usuário disponíveis (`admin`, `client`, `representative`, `technical`, `sales`, `financial`, etc.).
  - Telas principais que serão diretamente impactadas pelas novas coleções de consultas/laudos.

---

### 4. Critérios de “Fase 1 concluída”

- Existe um **ponto único de verdade** para:
  - Visão do produto (PDF + este documento).
  - Fases da implementação (`docs/ROADMAP.md`).
- O time consegue responder, olhando estes arquivos:
  - **O que já está pronto no app atual.**
  - **O que será atacado nas próximas fases** (prioridade: consultas + laudos + motor de relatórios).

---

### 5. Base jurídica de Minas (leis, normas, laudos antigos) – modo semiautomático

Esta seção descreve como o AmbientaR vai guardar e manter atualizada a base jurídica/técnica que a IA usa como referência (leis, deliberações, portarias, resoluções, laudos antigos, notas internas).

#### 5.1. Onde os documentos ficam

- **Coleção `knowledge_sources` (fontes de conhecimento)**
  - Cada documento oficial (ou interno) importante vira um registro aqui.
  - Exemplos:
    - Deliberação Normativa COPAM.
    - Resolução/Portaria SEMAD, IGAM, IEF.
    - Leis estaduais relevantes.
    - Laudos antigos produzidos pela consultoria (RCA, PIA, inventário, fauna).
    - Notas internas (orientações da equipe).
  - Campos principais (conceito, não é código):
    - **tipo**: lei, deliberação, resolução, portaria, nota interna, laudo antigo, etc.
    - **uf**: normalmente “MG”.
    - **orgao**: COPAM, SEMAD, IGAM, IEF, CONAMA, etc.
    - **numero**: ex.: “DN COPAM 217/2017”.
    - **dataPublicacao**.
    - **status**: vigente, revogada, alterada parcialmente.
    - **assunto**: resumo curto (ex.: “licenciamento ambiental atividades minerárias”).
    - **urlOficial**: link no site do governo (quando existir).
    - **storagePath**: caminho do PDF/HTML no Storage do Firebase.
    - **ultimaVerificacao**: data em que o sistema/robô conferiu se ainda vale.
    - **modoInclusao**: manual (você/equipe) ou “robo_sugeriu”.
    - **aprovado**: se `false`, ainda não entra na IA; se `true`, é usado pelo RAG.

- **Coleção `rag_index` (trechos para IA)**
  - Cada registro é um **trecho pequeno** de texto (parágrafo, artigo, seção) de algum documento de `knowledge_sources`.
  - Campos principais:
    - **sourceId**: ID do documento em `knowledge_sources` de onde esse trecho veio.
    - **chunkText**: texto do trecho.
    - **embedding**: representação numérica usada pela IA para achar os trechos mais parecidos com uma pergunta.
    - Metadados importantes (tipoDocumento, órgão, número, artigo/capítulo, etc.).

#### 5.2. Como funciona a atualização semiautomática

- **Papel do “robô” (script/função agendada)**
  - Roda automaticamente de tempos em tempos (ex.: 1 vez por semana).
  - Etapas:
    1. Visita páginas oficiais (COPAM, SEMAD, IGAM, IEF) de legislação/normas.
    2. Lê a lista de normas e compara com o que já existe em `knowledge_sources`.
    3. Quando encontra uma **norma nova**:
       - Cria um registro em `knowledge_sources` com:
         - `modoInclusao = "robo_sugeriu"`.
         - `aprovado = false`.
       - Baixa o PDF/HTML para o Storage e preenche `storagePath`.
    4. Quando percebe que uma norma antiga foi **revogada ou alterada**:
       - Atualiza o campo `status` da fonte existente.
       - Atualiza `ultimaVerificacao`.
    5. Não atualiza o `rag_index` sozinho: apenas prepara as sugestões.

- **Papel do humano (você ou equipe)**
  - Tela interna (ex.: “Base Jurídica”) mostra:
    - Lista de fontes com `modoInclusao = "robo_sugeriu"` e `aprovado = false`.
  - Para cada sugestão você pode:
    - **Aprovar**:
      - O sistema dispara um processo que:
        - Extrai o texto do PDF.
        - Quebra em trechos.
        - Cria registros em `rag_index` ligados ao `sourceId`.
    - **Ignorar/Arquivar**:
      - Mantém `aprovado = false`, e esse documento não é usado pela IA.

- **Como isso impacta a IA nos laudos**
  - A IA só usa trechos de normas com:
    - `aprovado = true`.
    - `status` adequado (por padrão, normas revogadas não entram em laudos novos).
  - Cada parágrafo sugerido pela IA pode citar:
    - Número da norma.
    - Data.
    - Artigo ou seção, graças aos metadados guardados.

#### 5.3. Contexto ambiental mínimo (MCP)

O **contexto ambiental mínimo** é o conjunto de dados estruturados do sistema necessários para qualquer laudo: cadastro do empreendedor e do empreendimento, empresa ambiental (consultoria), licenças, outorgas, intervenções, estudos de fauna, monitoramentos e outros projetos do mesmo empreendedor. Ele é montado pela camada MCP e usado no preenchimento de templates DOCX e pelos fluxos de IA.

- **Conteúdo do contexto (implementado em `src/lib/types.ts` e `src/lib/ambiental-context.ts`):**
  - **Empreendedor**: quem responde pelo empreendimento (cadastro completo).
  - **Empreendimento/projeto**: atividade, localização, porte, dados do imóvel.
  - **Empresa ambiental**: CNPJ, RT, registros em conselho (a consultoria).
  - **Gestão ambiental**: licenças ambientais, outorgas, usos insignificantes (quando houver coleção), intervenções (DAIA), condicionantes (quando consultadas), monitoramentos manuais vinculados às outorgas, estudos de fauna.
  - **Projetos**: outros empreendimentos do mesmo empreendedor (para referência cruzada).
- **Função de alto nível:** `getAmbientalContextByEmpreendimentoId( firestore, empreendimentoId )` retorna um objeto tipado `AmbientalContext` com todos esses dados. Ela é usada na tela de detalhe do laudo (“Carregar contexto ambiental”) e será usada pelo motor de relatórios (Fase 3) e pelos fluxos de IA (Fase 4).

---

### 6. Termos de referência e templates guiados para estudos

Além das normas, o sistema também pode aproveitar **Termos de Referência (TR)** oficiais ou internos para guiar o preenchimento dos estudos.

#### 6.1. Objetivo

- Usar os Termos de Referência:
  - Como **base para os templates `.docx`** (o que o laudo precisa conter).
  - Como **base para os campos do menu “Elaboração de Estudos”** (o que o sistema vai te pedir para preencher).
  - Como fonte para o RAG entender “como deve ser um RCA, um PIA, um inventário, etc.” dentro da realidade de Minas.

#### 6.2. Como os TR entram no sistema

- Termos de Referência oficiais (órgãos ambientais) ou modelos internos:
  - São cadastrados também em `knowledge_sources`, com:
    - `tipo = "termo_referencia"`.
    - Metadados:
      - Tipo de estudo (RCA, PIA, PCA, PRADA, fauna, inventário etc.).
      - Órgão emissor (SEMAD, IGAM, IEF, outro).
      - Versão/data de publicação.
    - PDF ou DOCx armazenado no Storage (`storagePath`).
  - Podem ser:
    - Inseridos manualmente (upload seu).
    - Sugeridos pelo robô, se existirem páginas oficiais com lista de TR (mesma lógica de sugestão e aprovação das normas).

- Depois de aprovados:
  - Também são enviados para `rag_index`:
    - Trechos que descrevem:
      - Objetivos do estudo.
      - Estrutura mínima do relatório.
      - Seções obrigatórias.
      - Nível de detalhe esperado.

#### 6.3. Como os TR ajudam a criar templates e campos guiados

- **Templates `.docx` de estudos**
  - A partir de um TR aprovado, o sistema (ou você com ajuda da IA) pode:
    - Sugerir um modelo de sumário (capítulos e subcapítulos).
    - Identificar onde entram:
      - Dados fixos (cadastro, gestão ambiental, empresa).
      - Dados de campo (inventário, fauna, monitoramentos).
      - Blocos de texto IA/RAG.
  - Esse modelo vira o arquivo `.docx` base em `templates/` (RCA, PIA, etc.), com placeholders que serão preenchidos automaticamente.

- **Campos do menu “Elaboração de Estudos”**
  - Para cada tipo de estudo (RCA, PIA, inventário, fauna, etc.), o sistema pode:
    - Ler o TR indexado em `rag_index`.
    - Sugerir uma lista de **seções/campos** que o formulário deve ter:
      - Exemplo (RCA):
        - “Caracterização do empreendimento”.
        - “Meio físico”.
        - “Meio biótico – flora”.
        - “Meio biótico – fauna”.
        - “Meio socioeconômico”.
        - “Medidas mitigadoras e compensatórias”.
    - Esses campos virão os inputs do menu de elaboração, que alimentam diretamente:
      - O `dadosEstruturados` do laudo.
      - O preenchimento dos blocos de texto IA/RAG.

#### 6.4. Atualização semiautomática dos TR

- Quando um órgão publica uma **nova versão** de TR:
  - O robô pode detectar um novo arquivo (número, data ou nome diferente).
  - Cadastra como sugestão em `knowledge_sources` com `tipo = "termo_referencia"` e `aprovado = false`.
- Você avalia:
  - Se aquele TR passa a ser o padrão do escritório.
  - Se sim, marca o antigo como “desatualizado” e aprova o novo.
- A partir desta aprovação:
  - O sistema pode:
    - Sugerir ajustes nos templates `.docx` daquele tipo de estudo.
    - Sugerir ajustes nos campos dos formulários de elaboração (incluindo ou removendo seções).

---

Em resumo:

- A **base jurídica** e os **termos de referência** vivem dentro do próprio banco de dados do AmbientaR (Firestore + Storage).
- A **atualização é semiautomática**:
  - Um robô traz sugestões com base nos sites oficiais.
  - Você aprova o que é relevante para sua realidade.
  - Só o que está aprovado passa a alimentar os laudos e formulários guiados.

---

### 7. Convenção de placeholders nos arquivos Word (`.docx`)

Para que o sistema consiga preencher automaticamente os modelos de laudos no Word, vamos usar uma convenção simples de “marcadores de campo” (placeholders).

#### 7.1. Sintaxe básica

- Todo placeholder será escrito assim no Word:
  - `{{NOME_DO_CAMPO}}`
- Regras:
  - Sempre entre `{{` e `}}` (sem espaços internos).
  - Sempre em **MAIÚSCULAS**, sem acentos ou cedilha.
  - Palavras separadas por **underline** (`_`).

Exemplos:

- `{{EMPREENDEDOR_NOME}}`
- `{{EMPREENDEDOR_CPF_CNPJ}}`
- `{{EMPREENDIMENTO_NOME}}`
- `{{EMPREENDIMENTO_MUNICIPIO}}`
- `{{EMPRESA_AMBIENTAL_RAZAO_SOCIAL}}`

#### 7.2. Campos preenchidos com dados do sistema (cadastro e gestão ambiental)

São campos que vêm diretamente do banco de dados (Cadastro, Gestão Ambiental, Projetos) e que depois você pode corrigir manualmente no Word, se quiser.

- **Empreendedor / Cliente**
  - `{{EMPREENDEDOR_NOME}}`
  - `{{EMPREENDEDOR_TIPO_PESSOA}}`  (PF ou PJ)
  - `{{EMPREENDEDOR_CPF_CNPJ}}`
  - `{{EMPREENDEDOR_ENDERECO_COMPLETO}}`
  - `{{EMPREENDEDOR_MUNICIPIO}}`
  - `{{EMPREENDEDOR_UF}}`
  - `{{EMPREENDEDOR_EMAIL}}`
  - `{{EMPREENDEDOR_TELEFONE}}`

- **Empreendimento / Projeto**
  - `{{EMPREENDIMENTO_NOME}}`
  - `{{EMPREENDIMENTO_TIPO_ATIVIDADE}}`
  - `{{EMPREENDIMENTO_DESCRICAO_ATIVIDADE}}`
  - `{{EMPREENDIMENTO_MUNICIPIO}}`
  - `{{EMPREENDIMENTO_UF}}`
  - `{{EMPREENDIMENTO_COORDENADAS}}`

- **Empresa ambiental / Responsável Técnico**
  - `{{EMPRESA_AMBIENTAL_RAZAO_SOCIAL}}`
  - `{{EMPRESA_AMBIENTAL_CNPJ}}`
  - `{{EMPRESA_AMBIENTAL_ENDERECO}}`
  - `{{RESPONSAVEL_TECNICO_NOME}}`
  - `{{RESPONSAVEL_TECNICO_REGISTRO_CONSELHO}}` (CREA, CRBio, etc.)

- **Gestão Ambiental (textos-resumo gerados a partir de listas)**
  - `{{RESUMO_LICENCAS_VIGENTES}}`
  - `{{RESUMO_OUTORGAS}}`
  - `{{RESUMO_USOS_INSIGNIFICANTES}}`
  - `{{RESUMO_MONITORAMENTOS}}`

Esses campos serão substituídos automaticamente, mas continuam totalmente editáveis no documento final.

#### 7.3. Blocos de texto gerados pela IA (RAG + MCP)

Além dos campos diretos, haverá **blocos maiores de texto** que a IA escreve com base:

- No contexto ambiental do empreendimento (MCP).
- Na base jurídica e nos termos de referência (`rag_index`).

Eles seguirão a convenção:

- `{{BLOCO_ENQUADRAMENTO_LEGAL}}`
- `{{BLOCO_DESCRICAO_PROJETO}}`
- `{{BLOCO_MEIO_FISICO}}`
- `{{BLOCO_MEIO_BIOTICO_FLORA}}`
- `{{BLOCO_MEIO_BIOTICO_FAUNA}}`
- `{{BLOCO_MEIO_SOCIOECONOMICO}}`
- `{{BLOCO_IMPACTOS_AMBIENTAIS}}`
- `{{BLOCO_MEDIDAS_MITIGADORAS}}`
- `{{BLOCO_PROGRAMAS_AMBIENTAIS}}`
- `{{BLOCO_CONCLUSAO_TECNICA}}`

Fluxo:

1. O sistema gera uma primeira versão do laudo:
   - Troca cada `{{BLOCO_...}}` por um texto completo sugerido pela IA.
2. Você abre o Word:
   - Revisa o texto proposto.
   - Ajusta o que for necessário (inclusões, correções, estilo).
3. Opcionalmente, o sistema pode permitir “regerar” um bloco específico a partir de novos dados.

#### 7.4. Frases com partes variáveis

Você também pode misturar texto fixo e placeholders na mesma frase, por exemplo:

> O empreendimento `{{EMPREENDIMENTO_NOME}}`, localizado no município de `{{EMPREENDIMENTO_MUNICIPIO}}`/`{{EMPREENDIMENTO_UF}}`, de titularidade de `{{EMPREENDEDOR_NOME}}` (`{{EMPREENDEDOR_CPF_CNPJ}}`), é objeto do presente estudo.

O sistema apenas substitui os `{{...}}` e mantém o restante da frase exatamente como você escreveu.

Com essa convenção:

- Fica claro para você onde o documento será preenchido automaticamente.
- O código do sistema consegue localizar facilmente todos os pontos a serem preenchidos.
- Você mantém total liberdade para revisar e melhorar os textos após a primeira geração.

