## AmbientaR 2.0 – Roadmap Resumido

Este arquivo organiza as próximas etapas em blocos executáveis, sempre evitando “big bang” e privilegiando entregas incrementais.

---

### Fase 1 – Organização e clareza da visão

- **Documentação**
  - [x] Criar `docs/PLANO-IMPLEMENTACAO.md` com visão macro das fases.
  - [x] Criar `docs/ROADMAP.md` com backlog resumido.
  - [x] Ajustar `README.md` para apontar para a documentação de produto (quando for conveniente).

- **Mapeamento do sistema atual**
  - [ ] Listar, em um quadro simples, quais módulos atuais serão diretamente usados na jornada de consulta:
    - **Cadastro**:
      - Empreendedores.
      - Empreendimentos / Projetos.
      - Empresa ambiental (sua consultoria).
    - **Gestão Ambiental**:
      - Licenças ambientais.
      - Outorgas, usos insignificantes, intervenções.
      - Monitoramentos (manual e telemetria).
      - Fauna, barragens, reserva legal, segurança de barragens, etc.
    - **Projetos e Estudos**:
      - RCA, PIA, PCA, PRADA, inventário florestal, relatórios de fauna, outros estudos.
    - **Financeiro e Comercial**:
      - Contratos, propostas comerciais, faturamento (para ligar consultas/laudos à parte financeira).
  - [ ] Identificar 1–2 tipos de estudo prioritários para o primeiro fluxo de laudos automatizados (ex.: RCA + PIA).
  - [ ] Esboçar, em 1 página, “como é hoje” o fluxo manual de um estudo prioritário (do pedido do cliente até o envio do laudo).
  - [ ] Esboçar, em 1 página, “como será” o mesmo fluxo usando consultas + laudos + IA.

---

### Fase 2 – Núcleo de Consultas e Laudos

- **Modelagem de dados**
  - [x] Definir estrutura das coleções Firestore:
    - **`consultas`**: entrada de dados da demanda (quem pediu, para qual cliente/empreendimento, canal, status, responsável técnico).
    - **`laudos` (ou `studies`)**: resultado consolidado, linkado à consulta, empreendedor, empreendimento, empresa ambiental e templates.
    - **`rag_index`**: índice de documentos longos (PDFs de laudos antigos, legislações, normas, notas internas).
  - [x] Especificar estados mínimos de uma consulta (ex.: `nova`, `em_andamento`, `aguardando_dados`, `concluida`, `cancelada`).
  - [x] Definir o que é o “**contexto ambiental mínimo**” necessário para qualquer laudo:
    - Dados do **empreendedor** (quem responde pelo empreendimento).
    - Dados do **empreendimento/projeto** (atividade, localização, porte).
    - Dados da **gestão ambiental** (licenças, outorgas, monitoramentos, fauna, intervenções).
    - Dados da **empresa ambiental** (CNPJ, RT, registros em conselho).

- **Primeiras telas e integrações internas**
  - [x] Criar tela simples de listagem/criação de `consultas` (apenas usuários internos).
  - [x] Adicionar vínculo entre `consultas` e:
    - Empreendedor.
    - Empreendimento/Projeto.
    - Tipo de estudo desejado (RCA, PIA, inventário, fauna etc.).
  - [x] Criar primeira versão da tela de `laudos`:
    - Exibir laudos por consulta.
    - Exibir status (rascunho, em geração, pronto, enviado).

---

### Fase 3 – Motor de Relatórios (DOCX + PDF)

- **Templates**
  - [x] Definir convenção de placeholders em `.docx` (ex.: `{{NOME_CLIENTE}}`, `{{CNPJ_CLIENTE}}`, `{{BLOCO_DIAGNOSTICO_AMBIENTAL}}`). Ver `docs/PLACEHOLDERS-DOCX.md` e `docs/PLANO-IMPLEMENTACAO.md` §7.
  - [x] Subir primeiros templates básicos para Storage (ex.: `template_rca.docx`, `template_pia.docx`). Templates em `public/templates/{tipo}/template.docx` ou upload em Configurações > Templates.

- **Serviço de preenchimento**
  - [x] Implementar função (Cloud Function ou endpoint Next.js) que:
    - Lê o template `.docx` do Storage (ou `public/templates`).
    - Preenche campos com dados estruturados (empreendedor, empreendimento, empresa ambiental, gestão ambiental, estudo) via MCP.
    - Insere blocos de texto IA/RAG onde configurado (placeholders BLOCO_*; Fase 4 preencherá com IA).
  - [ ] Converter o `.docx` final em PDF e anexar ao registro de `laudos`.
  - [x] Criar tela simples para:
    - Ver o laudo gerado (link para DOCX/PDF).
    - Acionar manualmente uma “regeração” em caso de ajustes (botão “Gerar DOCX” na tela do laudo).

---

### Fase 4 – IA / RAG e MCP

*(Detalhamento do que falta para completar a fase: `docs/FASE4-DETALHAMENTO.md`.)*

- **MCP (camada de dados)**
  - [x] Definir, em linguagem simples, o que é MCP neste projeto:
    - “Camada que sabe buscar **dados confiáveis** do sistema (cadastro + gestão ambiental + projetos) e entregar para a IA.” (ver comentário em `src/lib/ambiental-context.ts`.)
  - [ ] Definir ferramentas MCP mínimas:
    - Cadastro:
      - `get_empreendedor_by_id`
      - `get_empreendimento_by_id`
      - `get_environmental_company`
    - Gestão Ambiental:
      - `list_licencas_for_empreendimento`
      - `list_outorgas_for_empreendimento`
      - `list_usos_insignificantes_for_empreendimento`
      - `list_monitoramentos_for_empreendimento`
      - `list_fauna_reports_for_empreendimento`
    - Projetos e Estudos:
      - `list_projects_for_empreendedor` ou `list_projects_for_empreendimento`
      - `list_studies_for_empreendimento`
      - `get_study`, `get_study_pdf`
    - Documentos:
      - `list_documents_for_empreendimento` (PDFs relevantes).
  - [x] Criar uma função MCP de alto nível:
    - `get_ambiental_context_by_empreendimento_id` que devolve um “pacote” completo com:
      - Empreendedor, Empreendimento, Empresa ambiental.
      - Licenças, outorgas, usos insignificantes, monitoramentos, fauna.
      - Projetos e estudos relacionados.
  - [x] Expor esses dados de forma estável e bem tipada para os fluxos de IA.

- **RAG (orquestrador externo ao MCP)**
  - [x] Criar coleção `knowledge_sources` para registrar:
    - Leis, deliberações normativas, resoluções, portarias.
    - Termos de Referência oficiais.
    - Laudos antigos e notas internas relevantes.
    - (Tipo e regras Firestore em `src/lib/types.ts` e `src/firebase/rules/firestore.rules`.)
  - [ ] Implementar pipeline para popular `rag_index` com:
    - PDFs de RCAs/PIAs antigos.
    - Documentos de legislação e normas.
    - Termos de Referência.
    - Notas internas técnicas.
  - [ ] Implementar “robô” semiautomático de atualização:
    - Roda 1x por semana e lê páginas oficiais (COPAM, SEMAD, IGAM, IEF).
    - Cria sugestões em `knowledge_sources` com `modoInclusao = "robo_sugeriu"` e `aprovado = false`.
    - Atualiza `status` de normas antigas (vigente, revogada, alterada).
  - [ ] Criar tela interna de aprovação da base jurídica:
    - Listar normas/termos sugeridos pelo robô.
    - Permitir aprovar/arquivar.
    - Ao aprovar, disparar indexação para `rag_index`.
    - *(Parcial: listagem, criação manual e adição de trechos já existem em Configurações → Base Jurídica; script `scripts/import-termos-referencia` importa PDF/DOCX da pasta local. Aprovação de sugestões do robô fica para quando o pipeline existir.)*
  - [x] Ajustar fluxos de IA existentes (`src/ai/flows`) para:
    - Consultar primeiro o **MCP** (contexto ambiental do empreendimento).
    - Consultar depois o `rag_index` para buscar trechos relevantes.
    - Gerar textos que combinem:
      - Situação real do cliente/empreendimento (MCP).
      - Base legal e exemplos de laudos anteriores (RAG).
    - (Assistente IA: input com `contextoAmbiental` e `trechosRag`; tela com seleção opcional de empreendimento; `src/lib/rag.ts` consulta `rag_index`.)

---

### Fase 5 – Aplicativo Offline (React Native / campo)

- **Estrutura no app e documentação (implementado)**
  - [x] Página "App de campo" (`/app-campo`) em Configurações; link no menu.
  - [x] Documentação em `docs/APP-OFFLINE-FASE5.md`: escopo (inventário florestal), modelo de dados, opções (React Native + WatermelonDB vs PWA), próximos passos.

- **Escopo inicial**
  - [ ] Escolher 1 fluxo de campo prioritário (ex.: inventário florestal + fotos + coordenadas).
  - [ ] Definir modelo de dados para coleta offline e sincronização posterior.

- **Sincronização**
  - [ ] Prototipar integração React Native + WatermelonDB + backend (API/Firestore).
  - [ ] Testar em cenário real (área rural com baixa conexão).

---

### Fase 6 – Canais e Automação (WhatsApp, Instagram, Vindi)

- **Estrutura no app (implementado)**
  - [x] Menu "Canais e Integrações" (`/canais`) com cards WhatsApp, Instagram, Assinaturas (Vindi).
  - [x] Documentação dos fluxos e payloads em `docs/CANAIS-FASE6.md`.

- **WhatsApp / n8n**
  - [ ] Definir fluxo mínimo: "consulta criada → laudo pronto → envio automático via WhatsApp Business".
  - [ ] Mapear payloads e endpoints necessários no n8n.

- **Instagram**
  - [ ] Desenhar fluxo de captação: Story com CTA → direct → criação de lead/consulta simplificada.

- **Assinaturas**
  - [ ] Definir planos (Gratuito, Premium, Enterprise) e limites (nº de consultas, usuários, armazenamento).
  - [ ] Integrar com Vindi para cobrança recorrente.

