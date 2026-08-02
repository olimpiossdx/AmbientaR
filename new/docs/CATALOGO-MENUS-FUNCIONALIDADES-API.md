# Catálogo de menus, funcionalidades e contratos do `ambientaR-api`

Data-base: 21/07/2026  
Destino: `AmbientaR/new` + `ambientaR-api`  
Finalidade: transformar cada menu ou submenu funcional em uma entrega vertical com tela, rota, endpoint, claims, regra de escopo e aceite verificável.

## 1. Como ler o catálogo

Cada linha com ID `FUN-*` representa uma funcionalidade entregável. Grupos puramente visuais não recebem endpoint, mas recebem claim de módulo e só aparecem quando ao menos um filho estiver autorizado.

Convenções:

- todas as rotas autenticadas do frontend ficam sob `/app`;
- endpoints listados são do `ambientaR-api` e usam cookies seguros;
- `{id}` na API e `$id` no TanStack Router representam identificadores validados;
- toda listagem é paginada no servidor;
- toda consulta aplica escopo no repositório/policy antes de retornar dados;
- toda mutação relevante registra usuário, data, correlação, entidade e alteração;
- `CRUD` significa o contrato padrão descrito na seção 2;
- claims de menu são cumulativas: `modulo.<módulo>=acessar` no pai e `recurso.<recurso>=visualizar` no filho;
- ações adicionais usam `criar`, `editar`, `excluir`, `aprovar`, `exportar`, `executar`, `configurar` ou outro verbo explícito;
- o `ClaimsGuard` do `ambientaR-api` é obrigatório; ocultar botão no frontend é apenas experiência.

## 2. Contratos e critérios compartilhados

### API-CRUD — recurso transacional

Contrato padrão:

```text
GET    /<recurso>?page=&size=&search=&sort=&filters=
GET    /<recurso>/{id}
POST   /<recurso>
PATCH  /<recurso>/{id}
DELETE /<recurso>/{id}
```

Regras:

- controller declara `@ClaimType('recurso.<recurso>')`;
- handlers declaram `@ClaimValue('visualizar|criar|editar|excluir')`;
- `id`, paginação, ordenação e filtros são validados e limitados;
- `GET /{id}` fora do escopo retorna `404` ou `403` conforme política uniforme da API;
- criação deriva tenant, titular e autor da sessão, nunca do payload como fonte de confiança;
- atualização usa controle de versão para impedir sobrescrita silenciosa;
- exclusão é lógica quando retenção/auditoria exigir;
- resposta não expõe schema MongoDB nem campos internos.

Aceite `AC-CRUD`:

1. lista, busca, filtro, ordenação e paginação funcionam com massa maior que uma página;
2. detalhe válido abre e ID inválido é tratado;
3. criar, editar e excluir respeitam claims distintas;
4. sem claim e fora do escopo são negados também por chamada HTTP direta;
5. conflito de versão e validação retornam erro de domínio mapeável por campo;
6. loading, vazio, erro, sucesso e confirmação destrutiva existem no frontend;
7. teste unitário de domínio, integração do endpoint, contrato e E2E crítico passam.

### API-READ — consulta ou relatório

Contrato base: `GET /<recurso>` e, quando necessário, `GET /<recurso>/{id}`.

Aceite `AC-READ`: filtros e período são validados; agregações são calculadas no API; escopo é aplicado antes da agregação; resposta vazia é válida; sem claim e fora do escopo são negados; valores/data/unidades possuem formato explícito no DTO.

### API-WORKFLOW — processo com transição

Contrato base: CRUD + `POST /<recurso>/{id}/actions/{action}` com `expectedVersion` e motivo quando aplicável.

Aceite `AC-WORKFLOW`: somente transições permitidas pelo domínio; repetição é idempotente; transição concorrente retorna conflito; histórico é imutável; cada ação tem claim própria; interface exibe somente ações atualmente possíveis.

### API-FILE — anexos e documentos

Contrato base:

```text
POST   /files/uploads              # prepara upload autorizado
POST   /files/uploads/{id}/complete
GET    /files/{id}/download
DELETE /files/{id}
```

Aceite `AC-FILE`: tipo, tamanho, checksum e vínculo são validados; nome físico não vem do usuário; download verifica claim e escopo; arquivo órfão é limpo; malware scanning/política equivalente é definido; URL temporária não concede acesso permanente.

### API-JOB — processamento ou exportação

Contrato base:

```text
POST /<recurso>/{id}/jobs
GET  /jobs/{jobId}
POST /jobs/{jobId}/cancel
GET  /jobs/{jobId}/result
```

Aceite `AC-JOB`: criação idempotente; estados `queued/running/succeeded/failed/cancelled`; progresso consultável; retry controlado; resultado protegido por claim/escopo; erro não perde correlação; frontend não mantém request longo aberto.

### API-INTEGRATION — serviço externo

Aceite `AC-INT`: segredo somente no API; allowlist de host; timeout, retry e circuit breaker; payload externo traduzido para DTO interno; indisponibilidade tem mensagem segura; chamadas possuem métrica e correlação; nenhuma URL arbitrária é aceita.

### FRONT-SCREEN — tela

Aceite `AC-FRONT`: rota lazy; guard antes de carregar dados; menu e rota usam a mesma claim; serviço usa cliente HTTP central; URL guarda filtros relevantes; loading/vazio/erro/403/404; formulário acessível e responsivo; navegação por teclado; nenhum Firebase, `role`, `isAdmin` ou `fetch` direto.

### Regras transversais obrigatórias do `ambientaR-api`

Antes do primeiro módulo funcional, a API deve:

1. configurar CORS por allowlist de ambiente; nunca refletir qualquer origem em produção;
2. aplicar `ValidationPipe` global com transformação, whitelist e rejeição de campos desconhecidos;
3. aplicar autenticação global, deixando públicas somente rotas marcadas explicitamente;
4. aplicar `ClaimsGuard` e falhar quando um controller protegido possuir metadados incompletos;
5. padronizar envelope, códigos de erro, mensagens por campo e `correlationId`;
6. usar UTC nos DTOs e declarar moeda, unidade e timezone quando relevantes;
7. limitar `page`, `size`, filtros, upload e payload;
8. aceitar chave de idempotência nas operações financeiras, integrações e criação de jobs;
9. emitir auditoria para login, alteração de claim, leitura de segredo, mutação financeira e transição legal;
10. mascarar PII/segredos em logs e respostas;
11. publicar `GET /health/live` e `GET /health/ready`, incluindo MongoDB, Redis, storage e fila;
12. possuir teste arquitetural que impeça controller→repositório direto e dependência do `web`/Firebase.

## 3. Rotas públicas e sessão

| ID | Menu/funcionalidade | Telas no `new` | API | Claims/escopo | Aceite adicional |
| --- | --- | --- | --- | --- | --- |
| FUN-AUTH-001 | Login | `/login` | `POST /auth/login`, `GET /auth/session` | pública; sessão devolve claims efetivas | e-mail/CPF/CNPJ; erro não enumera usuário; cookies e redirecionamento testados |
| FUN-AUTH-002 | Cadastro | `/register` | `POST /auth/register`, `POST /auth/register/document-preview` | pública; vínculos criados pelo caso de uso | documento único, senha com hash, cadastro parcial consistente e sessão válida |
| FUN-AUTH-003 | Recuperar senha | `/forgot-password` | `POST /auth/password-reset`, `POST /auth/password-reset/confirm` | pública; token único e expirável | resposta genérica, expiração, revogação e troca real da senha |
| FUN-AUTH-004 | Política de privacidade | `/politica-privacidade` | `GET /public/legal/privacy-policy` | pública | versão e vigência visíveis; aceite vinculável quando exigido |
| FUN-AUTH-005 | Estado offline | `/offline` | `GET /health/ready` | pública | distingue API indisponível de navegador offline; retry sem loop |
| FUN-AUTH-006 | Sessão | modal e `/sessao-bloqueada` | `POST /auth/refresh`, `POST /auth/relogin`, `POST /auth/logout` | usuário conhecido | refresh concorrente único, retorno à rota e limpeza completa no logout |

## 4. Painel e carteira

| ID | Menu/submenu | Telas no `new` | API | Claim do filho | Regra e aceite adicional |
| --- | --- | --- | --- | --- | --- |
| FUN-CORE-001 | Painel | `/app` | `GET /dashboard` | `recurso.dashboard=visualizar` | API retorna somente widgets autorizados e agregados já escopados; `AC-READ`, `AC-FRONT` |
| FUN-CORE-002 | Minha Carteira | `/app/carteira`, `/app/carteira/$clientId` | `GET /carteira`, `GET /carteira/{clientId}` | `recurso.carteira=visualizar` | titular, representante ou consultor só recebe vínculos aprovados; `AC-READ`, `AC-FRONT` |

## 5. Financeiro

Pai: `modulo.financeiro=acessar`.

| ID | Submenu/funcionalidade | Telas no `new` | API do `ambientaR-api` | Claim do filho | Regras/aceite |
| --- | --- | --- | --- | --- | --- |
| FUN-FIN-001 | Acesso Bancário | `/app/bank-access` | CRUD `/bank-access` | `recurso.acesso-bancario=*` | segredos cifrados e nunca retornados completos; auditoria de leitura; `AC-CRUD` |
| FUN-FIN-002 | Clientes | `/app/clients`, `/new`, `/$id/edit` | CRUD `/financial/clients` | `recurso.cliente-financeiro=*` | CPF/CNPJ único, vínculo comercial e escopo; `AC-CRUD` |
| FUN-FIN-003 | Contratos | `/app/contracts`, `/new`, `/$id/edit` | CRUD `/contracts`; `POST /contracts/{id}/actions/{action}` com approve/sign/cancel | `recurso.contrato=*` | versões, partes, vigência, aprovação/assinatura; `AC-WORKFLOW`, `AC-FILE` |
| FUN-FIN-004 | Contratos da Plataforma | `/app/financial/platform-subscription-contracts` | `GET /platform-contracts`, `GET /{id}`, ações activate/suspend/cancel | `recurso.contrato-plataforma=*` | cobrança e acesso mudam atomicamente; `AC-WORKFLOW` |
| FUN-FIN-005 | Contratos de Fornecedores | `/app/contracts-suppliers` | CRUD `/supplier-contracts` | `recurso.contrato-fornecedor=*` | fornecedor, centro de custo, vigência e anexos; `AC-CRUD`, `AC-FILE` |
| FUN-FIN-006 | Curva ABC de Clientes | `/app/financial/abc-curve` | `GET /financial/reports/abc-clients` | `recurso.relatorio-financeiro=visualizar` | período, critério e totais reconciliáveis; `AC-READ` |
| FUN-FIN-007 | Bens e Patrimônio | `/app/financial/bens-patrimonio`, `/new`, `/$id/edit` | CRUD `/assets` | `recurso.patrimonio=*` | tombamento único, depreciação e baixa por ação; `AC-CRUD`, `AC-WORKFLOW` |
| FUN-FIN-008 | DRE Contábil | `/app/financial/dre-contabil` | `GET /financial/reports/income-statement` | `recurso.dre=visualizar` | competência/caixa explícito, categorias e totalização; `AC-READ` |
| FUN-FIN-009 | Faturas | `/app/invoices`, `/new`, `/$id/edit` | CRUD `/invoices`; ações issue/cancel/mark-paid | `recurso.fatura=*` | portal só vê próprias faturas; pagamento idempotente; `AC-WORKFLOW` |
| FUN-FIN-010 | Fornecedores | `/app/suppliers`, `/new`, `/$id/edit` | CRUD `/suppliers` | `recurso.fornecedor=*` | documento e dados bancários validados/mascarados; `AC-CRUD` |
| FUN-FIN-011 | Lançamentos de Caixa | `/app/cash-flow`, `/new`, `/$id/edit` | CRUD `/cash-transactions`; ação `reverse` | `recurso.lancamento-caixa=*` | valor monetário decimal, competência, conta e estorno imutável; `AC-WORKFLOW` |
| FUN-FIN-012 | NFe Eletrônica | `/app/external?target=nfe` | `GET /external-targets/nfe` | `recurso.nfe=acessar` | destino cadastrado no API, sem parâmetro de URL livre; `AC-INT` |
| FUN-FIN-013 | Orçamentos | `/app/proposals`, `/new`, `/$id/edit` | CRUD `/quotes`; `POST /quotes/{id}/exports` | `recurso.orcamento=*` | numeração, itens, impostos, validade e PDF; `AC-CRUD`, `AC-JOB` |
| FUN-FIN-014 | Orçamentos e Propostas Comerciais | `/app/commercial-proposals`, `/new`, `/$id/edit` | CRUD `/commercial-proposals`; ações send/accept/reject/expire | `recurso.proposta-comercial=*` | aceite guarda autor/data/versão; `AC-WORKFLOW`, `AC-JOB` |
| FUN-FIN-015 | Painel Financeiro | `/app/financial/painel` | `GET /financial/dashboard` | `recurso.dashboard-financeiro=visualizar` | período, moeda e origem de cada KPI; `AC-READ` |
| FUN-FIN-016 | Projetos e ROI | `/app/financial/projetos-roi`, `/$caseId` | CRUD `/roi-cases`; `/time-entries`; ações de aprovação/estorno | `recurso.projeto-roi=*` | custos restritos por claim específica; ROI consistente; `AC-WORKFLOW` |
| FUN-FIN-017 | Fluxo de Caixa Projetado | `/app/financial/fluxo-projetado` | `GET /financial/reports/cash-flow-forecast` | `recurso.fluxo-projetado=visualizar` | cenário, período e premissas explícitos; `AC-READ` |
| FUN-FIN-018 | Conciliação Bancária | `/app/financial/conciliacao` | `GET /bank-reconciliation`, `POST /matches`, `DELETE /matches/{id}` | `recurso.conciliacao-bancaria=executar` | match idempotente, diferença e desfazer auditado; `AC-WORKFLOW` |
| FUN-FIN-019 | Diagnóstico PIX | `/app/financial/billing-debug` | `GET /billing/diagnostics`, `POST /billing/charges/{id}/retry` | `recurso.diagnostico-cobranca=visualizar` ou `executar` | sem segredo/payload sensível; retry idempotente; `AC-READ`, `AC-WORKFLOW` |
| FUN-FIN-020 | Curva ABC de Serviços | `/app/financial/abc-servicos` | `GET /financial/reports/abc-services` | `recurso.relatorio-financeiro=visualizar` | `AC-READ` |
| FUN-FIN-021 | Curva ABC de Fornecedores | `/app/financial/abc-fornecedores` | `GET /financial/reports/abc-suppliers` | `recurso.relatorio-financeiro=visualizar` | `AC-READ` |
| FUN-FIN-022 | Orçamento Anual | `/app/financial/orcamento` | CRUD `/annual-budgets`; ação `approve` | `recurso.orcamento-anual=*` | versão por exercício e centro de custo; `AC-WORKFLOW` |
| FUN-FIN-023 | Exportação Contábil | `/app/financial/export-contabil` | `POST /accounting-exports`, `GET /jobs/{id}` | `recurso.exportacao-contabil=exportar` | layout, período, checksum e reprocessamento idempotente; `AC-JOB` |
| FUN-FIN-024 | Assistente Financeiro | `/app/studies/assistant?type=financeiro` | `POST /ai/assistants/financial/runs` | `recurso.assistente-financeiro=executar` | fontes autorizadas, custo/rate limit e sem acesso implícito a dados; `AC-JOB` |
| FUN-FIN-025 | Tabela de Serviços | `/app/services`, `/new`, `/$id/edit` | CRUD `/services` | `recurso.servico=*` | código único, preço decimal e vigência; `AC-CRUD` |

## 6. Cadastro

Pai: `modulo.cadastro=acessar`.

| ID | Submenu | Telas | API | Claim | Regras/aceite |
| --- | --- | --- | --- | --- | --- |
| FUN-CAD-001 | Usuários | `/app/users` e formulário/modal | CRUD existente `/user`; `/authorization/groups`; `/authorization/claims` | `recurso.usuario=*`; claims de grupo existentes | edição própria separada da administração; senha nunca retorna; grupos usam versão; `AC-CRUD` |
| FUN-CAD-002 | Empreendedores | `/app/empreendedores`, `/new`, `/$id/edit` | CRUD `/empreendedores` | `recurso.empreendedor=*` | CPF/CNPJ, titularidade e vínculos; `AC-CRUD` |
| FUN-CAD-003 | Empreendimentos | `/app/projects`, `/new`, `/$id/edit` | CRUD `/empreendimentos` | `recurso.empreendimento=*` | vínculo autorizado, coordenadas, pacote e status; `AC-CRUD` |
| FUN-CAD-004 | Empresas | `/app/responsible-company`, `/new`, `/$id/edit` | CRUD `/empresas-responsaveis` | `recurso.empresa-responsavel=*` | CNPJ, responsáveis e apenas uma empresa ativa quando aplicável; `AC-CRUD` |

## 7. Documentos Ambientais

Pai: `modulo.documentos-ambientais=acessar`.

| ID | Submenu | Telas | API | Claim | Regras/aceite |
| --- | --- | --- | --- | --- | --- |
| FUN-DOC-001 | CAR | `/app/car` | CRUD `/car-records`; anexos/geometria | `recurso.car=*` | recibo, imóvel, geometria e histórico; `AC-CRUD`, `AC-FILE` |
| FUN-DOC-002 | Condicionantes | `/app/compliance` | CRUD `/conditions`; ação `fulfill` | `recurso.condicionante=*` | prazo, recorrência, evidência e alerta; `AC-WORKFLOW`, `AC-FILE` |
| FUN-DOC-003 | CTF/IBAMA | `/app/ctf-ibama` | CRUD `/ctf-ibama-records` | `recurso.ctf-ibama=*` | validade, titular e certificado; `AC-CRUD`, `AC-FILE` |
| FUN-DOC-004 | DAIA | `/app/intervencoes` | CRUD `/environmental-interventions` | `recurso.daia=*` | área, modalidade, validade e empreendimento; `AC-CRUD`, `AC-FILE` |
| FUN-DOC-005 | Fauna documental | `/app/fauna` | CRUD `/fauna-documents` | `recurso.fauna-documento=*` | tipo, vigência, projeto e anexo; `AC-CRUD`, `AC-FILE` |
| FUN-DOC-006 | Licenças | `/app/licenses`, `/new`, `/$id/edit` | CRUD `/licenses`; ações de status | `recurso.licenca=*` | número, órgão, modalidade, validade e alertas; `AC-WORKFLOW`, `AC-FILE` |
| FUN-DOC-007 | TAC | `/app/tacs`, `/new`, `/$id/edit` | CRUD `/tacs`; compromissos | `recurso.tac=*` | partes, obrigações, prazo e evidências; `AC-WORKFLOW`, `AC-FILE` |
| FUN-DOC-008 | MTR Declaração | `/app/mtr-declaracao` | CRUD `/mtr-declarations`; `POST /sync-jobs` | `recurso.mtr-declaracao=*` | período, manifesto, integração e deduplicação; `AC-CRUD`, `AC-JOB`, `AC-INT` |
| FUN-DOC-009 | Pasta do cliente | `/app/documentos-ambientais/pasta-cliente` | `GET /client-folders/{clientId}`, API-FILE | `recurso.pasta-cliente` com visualizar/enviar/excluir | árvore virtual por metadados, não path livre; `AC-FILE` |
| FUN-DOC-010 | Monitoramento manual | `/app/monitoring/manual` | CRUD `/water-monitoring/manual-readings`; export | `recurso.monitoramento-outorga=*` | unidade, data, ponto e limites; `AC-CRUD`, `AC-JOB` |
| FUN-DOC-011 | Telemetria | `/app/monitoring/telemetric` | `GET /water-monitoring/telemetry`; ingestão protegida separada | `recurso.telemetria` com visualizar/exportar | série temporal paginada/agregada e gaps explícitos; `AC-READ`, `AC-JOB` |
| FUN-DOC-012 | Outorgas | `/app/outorgas`, `/new`, `/$id/edit` | CRUD `/water-grants` | `recurso.outorga=*` | ponto, finalidade, vazão, portaria e validade; `AC-CRUD`, `AC-FILE` |
| FUN-DOC-013 | Usos Insignificantes | `/app/usos-insignificantes` | CRUD `/insignificant-water-uses` | `recurso.uso-insignificante=*` | enquadramento, vazão, validade e vínculo; `AC-CRUD`, `AC-FILE` |

## 8. Multas, vistorias, licenciamento e processos

| ID | Menu/submenu | Telas | API | Claim | Regras/aceite |
| --- | --- | --- | --- | --- | --- |
| FUN-LEG-001 | Multas e Defesas / Consultar | `/app/multas-defesas`, `/$id` | `GET /environmental-fines`, `GET /{id}` | `recurso.multa-defesa=visualizar` | prazo processual e escopo; `AC-READ` |
| FUN-LEG-002 | Multas e Defesas / Nova | `/app/multas-defesas/nova` | `POST /environmental-fines`; ações e anexos | `recurso.multa-defesa` com criar/editar/protocolar | defesa versionada, protocolo e documentos; `AC-WORKFLOW`, `AC-FILE` |
| FUN-VIS-001 | Vistoria / Consultar | `/app/inspections`, `/$id/edit` | CRUD `/inspections` | `recurso.vistoria=*` | empreendimento, equipe, agenda e status; `AC-CRUD` |
| FUN-VIS-002 | Vistoria / Nova | `/app/inspections/new` | `POST /inspections` | `recurso.vistoria=criar` | checklist coerente com tipo; `AC-CRUD` |
| FUN-VIS-003 | Vistoria / Relatórios de Campo | `/app/inspections/reports` | `POST /inspections/{id}/report-jobs` | `recurso.vistoria-relatorio=exportar` | fotos, coordenadas, assinatura e documento visual validado; `AC-JOB`, `AC-FILE` |
| FUN-LIC-001 | Licenciamento / Trâmites | `/app/requests`, `/$id/edit` | CRUD `/licensing-requests`; ações | `recurso.tramite-licenciamento=*` | protocolo, órgão, fase e transições; `AC-WORKFLOW`, `AC-FILE` |
| FUN-LIC-002 | Licenciamento / Nova solicitação | `/app/requests/new` | `POST /licensing-requests` | `recurso.tramite-licenciamento=criar` | pré-requisitos e titularidade; `AC-WORKFLOW` |
| FUN-LIC-003 | Licenciamento / AIA | `/app/requests/$id/aia` | `GET/PUT /licensing-requests/{id}/aia` | `recurso.aia` com visualizar/editar | checklist AIA e vínculo com solicitação; `AC-CRUD` |
| FUN-PRO-001 | Processos / Projetos | `/app/gestao-processos/projetos`, `/$id` | CRUD `/process-projects` | `recurso.projeto-processo=*` | escopo por carteira/titular; `AC-CRUD` |
| FUN-PRO-002 | Processos / Fluxo | `/app/gestao-processos/fluxo` | CRUD `/processes`; ações de transição | `recurso.fluxo-processo=*` | kanban deriva estados válidos; `AC-WORKFLOW` |
| FUN-PRO-003 | Processos / Tarefas | `/app/gestao-processos/tarefas` | CRUD `/tasks`; ações assign/complete/reopen | `recurso.tarefa=*` | participante, prazo e visibilidade; `AC-WORKFLOW` |
| FUN-PRO-004 | Processos / Indicadores / Resumo | `/app/gestao-processos/indicadores` | `GET /process-indicators/summary` | `recurso.indicador-processo=visualizar` | agregação escopada; `AC-READ` |
| FUN-PRO-005 | Processos / Indicadores / Análise | `/app/gestao-processos/indicadores/analise` | `GET /process-indicators/analysis` | `recurso.indicador-processo=visualizar` | séries e filtros reproduzíveis; `AC-READ` |
| FUN-PRO-006 | Processos / Planilha | `/app/gestao-processos/planilha` | `POST /process-import-jobs` | `recurso.processo=importar` | preview, validação por linha e importação idempotente; `AC-JOB`, `AC-FILE` |

## 9. IA e Fiscal Ambiental Digital

Pai: `modulo.ia=acessar`.

| ID | Submenu/aba | Tela | API | Claim | Regras/aceite |
| --- | --- | --- | --- | --- | --- |
| FUN-IA-001 | Águas / MIRA | `/app/studies/assistant?type=mira` | `POST /ai/assistants/mira/runs` | `recurso.assistente-mira=executar` | fontes e escopo explícitos; `AC-JOB` |
| FUN-IA-002 | Análise Geoespacial | `/app/analise-ambiental` | `POST /geo-analysis-jobs` | `recurso.analise-geoespacial=executar` | geometria válida, catálogo versionado e resultado reproduzível; `AC-JOB`, `AC-FILE` |
| FUN-IA-003 | Análise Socioambiental | `/app/studies/analise-socioambiental` | `POST /socio-environmental-analysis-jobs` | `recurso.analise-socioambiental=executar` | ondas/fontes registradas; `AC-JOB` |
| FUN-IA-004 | Cruzamento de dados | `/app/studies/assistant?type=mcp` | `POST /ai/assistants/data-crossing/runs` | `recurso.assistente-cruzamento=executar` | tools allowlist e rate limit; `AC-JOB` |
| FUN-IA-005 | Legislação e estudos | `/app/studies/assistant?type=geral` | `POST /ai/assistants/legal/runs` | `recurso.assistente-legislacao=executar` | citações e fontes retornadas; `AC-JOB` |
| FUN-IA-006 | Relatórios de IA | `/app/reporting` | `GET /ai/reports`, `GET /{id}` | `recurso.relatorio-ia=visualizar` | escopo por autor/organização; `AC-READ` |
| FUN-IA-007 | Síntese de texto | `/app/studies/assistant?type=rag` | `POST /ai/assistants/summarization/runs` | `recurso.assistente-sintese=executar` | arquivos autorizados e retenção definida; `AC-JOB`, `AC-FILE` |
| FUN-IA-008 | Automações IA | `/app/ai-lab/automations` | CRUD `/ai-automations`; ações run/enable/disable | `recurso.automacao-ia=*` | agenda, limites e execução auditada; `AC-WORKFLOW`, `AC-JOB` |
| FUN-IA-009 | Hub IA | `/app/ai-lab` | `GET /ai/capabilities` | `modulo.ia=acessar` | só mostra capacidades com claim; `AC-READ` |
| FUN-FAD-001 | FAD / Início | `/app/ia/fiscal-ambiental-digital/dashboard` | `GET /fad/dashboard` | `recurso.fad-dashboard=visualizar` | `AC-READ` |
| FUN-FAD-002 | FAD / Montar acervo | `/app/ia/fiscal-ambiental-digital/montar-acervo` | `POST /fad/collection-jobs` | `recurso.fad-acervo=criar` | fonte, perímetro e período; `AC-JOB` |
| FUN-FAD-003 | FAD / Biblioteca | `/app/ia/fiscal-ambiental-digital/biblioteca` | `GET /fad/assets`, API-FILE | `recurso.fad-biblioteca=visualizar` | ownership e download; `AC-READ`, `AC-FILE` |
| FUN-FAD-004 | FAD / Linha do tempo | `/app/ia/fiscal-ambiental-digital/linha-do-tempo` | CRUD `/fad/timeline-events` | `recurso.fad-linha-tempo=*` | ordenação temporal e fonte; `AC-CRUD` |
| FUN-FAD-005 | FAD / Comparar | `/app/ia/fiscal-ambiental-digital/comparador` | `POST /fad/comparison-jobs` | `recurso.fad-comparador=executar` | duas fontes compatíveis e resultado versionado; `AC-JOB` |
| FUN-FAD-006 | FAD / Evidências | `/app/ia/fiscal-ambiental-digital/evidencias` | CRUD `/fad/evidence` | `recurso.fad-evidencia=*` | cadeia de custódia e checksum; `AC-CRUD`, `AC-FILE` |
| FUN-FAD-007 | FAD / Inteligência | `/app/ia/fiscal-ambiental-digital/inteligencia` | `POST /fad/intelligence-jobs` | `recurso.fad-inteligencia=executar` | modelo/fonte/custo registrados; `AC-JOB` |
| FUN-FAD-008 | FAD / Fiscalização | `/app/ia/fiscal-ambiental-digital/fiscalizacao` | `POST /fad/inspection-check-jobs` | `recurso.fad-fiscalizacao=executar` | checks determinísticos identificados; `AC-JOB` |
| FUN-FAD-009 | FAD / Relatórios | `/app/ia/fiscal-ambiental-digital/relatorios` | `POST /fad/report-jobs`, `GET /fad/reports` | `recurso.fad-relatorio` com visualizar/exportar | `AC-JOB` |
| FUN-FAD-010 | FAD / Monitoramento | `/app/ia/fiscal-ambiental-digital/monitoramento` | CRUD `/fad/monitoring-rules`; `POST /runs` | `recurso.fad-monitoramento=*` | regra, agenda e deduplicação; `AC-WORKFLOW`, `AC-JOB` |
| FUN-FAD-011 | FAD / Auditoria ESG | `/app/ia/fiscal-ambiental-digital/esg` | `GET /fad/esg`, `POST /fad/esg/snapshots` | `recurso.fad-esg` com visualizar/executar | metodologia e snapshot imutável; `AC-READ` |
| FUN-FAD-012 | FAD / Configurações | `/app/ia/fiscal-ambiental-digital/configuracoes` | `GET/PATCH /fad/settings` | `recurso.fad-configuracao=configurar` | segredo não retorna; versão e auditoria; `AC-CRUD` |
| FUN-FAD-013 | FAD / Novo workspace | `/app/ia/fiscal-ambiental-digital/workspace/novo` | `POST /fad/workspaces` | `recurso.fad-workspace=criar` | `AC-CRUD` |
| FUN-FAD-014 | FAD / Workspace | `/app/ia/fiscal-ambiental-digital/workspace/$workspaceId` | CRUD `/fad/workspaces` | `recurso.fad-workspace=*` | membro/ownership e sub-recursos escopados; `AC-CRUD` |

## 10. Estudos Técnicos

Pai: `modulo.estudos-tecnicos=acessar`. Todos os estudos CRUD usam `recurso.estudo-<slug>` e, quando geram documento, `exportar` + `AC-JOB`.

| ID | Submenu/funcionalidade | Telas no `new` | API | Regra/aceite específico |
| --- | --- | --- | --- | --- |
| FUN-EST-001 | Programa de Educação Ambiental | `/app/studies/educacao-ambiental`, `/novo`, `/$id/edit`, `/solicitar-dispensa`, `/dispensas/$id` | CRUD `/studies/environmental-education`; `/waivers`; exports | projeto, público, cronograma e fluxo de dispensa; `AC-WORKFLOW` |
| FUN-EST-002 | Programa de Ação Emergencial | `/app/studies/acao-emergencial` | CRUD `/studies/emergency-action-programs` | cenários, responsáveis e revisão; `AC-CRUD`, `AC-JOB` |
| FUN-EST-003 | EIA/RIMA | `/app/studies/eia-rima`, `/new`, `/$id/edit` | CRUD `/studies/eia-rima`; exports | versão, capítulos, equipe e anexos; `AC-CRUD`, `AC-JOB` |
| FUN-EST-004 | Estudo de Cavidades | `/app/studies/cavidades`, `/new`, `/$id/edit` | CRUD `/studies/caves`; analysis/exports | coordenadas, relevância e fontes; `AC-CRUD`, `AC-JOB` |
| FUN-EST-005 | Estudos de Fauna / Hub | `/app/studies/fauna` | `GET /fauna-studies/dashboard` | cards somente com claims filhas; `AC-READ` |
| FUN-EST-006 | Fauna / Inventário | `/app/studies/fauna/inventario`, `/$id` | CRUD `/fauna-studies/inventories` | campanha, grupo, ponto e espécie; `AC-CRUD` |
| FUN-EST-007 | Fauna / Relatório de Inventário | `/app/studies/fauna/inventario-relatorio`, `/$id` | `POST /fauna-studies/inventories/{id}/report-jobs` | documento visual e dados congelados por versão; `AC-JOB` |
| FUN-EST-008 | Fauna / Monitoramento | `/app/studies/fauna/monitoramento`, `/$id` | CRUD `/fauna-studies/monitoring` | campanhas comparáveis; `AC-CRUD` |
| FUN-EST-009 | Fauna / Relatório de Monitoramento | `/app/studies/fauna/monitoramento-relatorio`, `/$id` | report jobs | `AC-JOB` |
| FUN-EST-010 | Fauna / Resgate | `/app/studies/fauna/resgate`, `/$id` | CRUD `/fauna-studies/rescues` | indivíduo, destino e cadeia de custódia; `AC-CRUD` |
| FUN-EST-011 | Fauna / Relatório de Resgate | `/app/studies/fauna/resgate-relatorio`, `/$id` | report jobs | `AC-JOB` |
| FUN-EST-012 | IDE-SisemaNet | `/app/studies/ide-sisemanet` | `GET /integrations/ide-sisema/catalog`, analysis jobs | `recurso.ide-sisema=consultar`; `AC-INT`, `AC-JOB` |
| FUN-EST-013 | Inventário Florestal / Lista | `/app/studies/inventario`, `/$id` | CRUD `/forest-inventories` | unidade amostral, método e versão; `AC-CRUD` |
| FUN-EST-014 | Inventário / Árvores | `/app/studies/inventario/$id/arvores` | CRUD `/forest-inventories/{id}/trees` | DAP, altura, espécie e parcela; `AC-CRUD` |
| FUN-EST-015 | Inventário / Parcelas | `/app/studies/inventario/$id/parcelas` | CRUD `/forest-inventories/{id}/plots` | área e geometria; `AC-CRUD` |
| FUN-EST-016 | Inventário / Espécies | `/app/studies/inventario/$id/especies` | CRUD `/forest-inventories/{id}/species` | taxonomia e proteção; `AC-CRUD` |
| FUN-EST-017 | Inventário / Fórmulas | `/app/studies/inventario/$id/formulas` | CRUD `/forest-inventories/{id}/formulas` | expressão validada e versionada; `AC-CRUD` |
| FUN-EST-018 | Inventário / Calculadora e Resultado | `/app/studies/inventario/$id/calculadora`, `/resultado/$runId` | `POST /forest-inventories/{id}/calculation-jobs`; resultado | fórmula/entrada congeladas e reprodutíveis; `AC-JOB` |
| FUN-EST-019 | Coleta de Campo | `/app/coleta-campo`, `/nova`, `/$id`, `/$id/parcelas/$parcelaId` | CRUD `/field-collections`; sub-recurso plots | offline apenas se aprovado; conflito explícito; `AC-CRUD` |
| FUN-EST-020 | LAS-RAS | `/app/studies/las-ras`, `/new`, `/$id/edit` | CRUD `/studies/las-ras`; exports | formulário e anexos versionados; `AC-CRUD`, `AC-JOB` |
| FUN-EST-021 | Reanálise | `/app/studies/reanalise`, `/new`, `/$id/edit` | CRUD `/studies/reanalysis`; exports | referência ao estudo anterior e motivo; `AC-CRUD`, `AC-JOB` |
| FUN-EST-022 | Procuração | `/app/studies/procuracao`, `/new`, `/$id/edit` | CRUD `/powers-of-attorney`; exports | outorgante/outorgado, poderes e validade; `AC-CRUD`, `AC-JOB` |
| FUN-EST-023 | Mapas | `/app/studies/mapas` | CRUD `/study-maps`; render jobs | CRS, camadas, escala e layout; `AC-CRUD`, `AC-JOB` |
| FUN-EST-024 | Memorial Descritivo | `/app/studies/memorial-descritivo` | CRUD `/descriptive-memorials`; calculation/export jobs | polígono fechado, azimute, distância e CRS; `AC-JOB` |
| FUN-EST-025 | Outorgas / Processos | `/app/studies/outorgas`, `/processo/$id`, `/$id/edit` | CRUD `/water-grant-processes` | fases, protocolo e documentos; `AC-WORKFLOW` |
| FUN-EST-026 | Outorgas / Nova | `/app/studies/outorgas/new` | `POST /water-grant-processes` | pré-requisitos e escopo; `AC-WORKFLOW` |
| FUN-EST-027 | PCA / Lista | `/app/studies/pca`, `/$id/edit` | CRUD `/studies/pca` | listagem A–H é enum validado; `AC-CRUD` |
| FUN-EST-028 | PCA / Listagens A–H | `/app/studies/pca/new?listagem=A..H` | `POST /studies/pca`; schemas `GET /study-schemas/pca/{A..H}` | cada schema versionado; export preserva versão; `AC-CRUD`, `AC-JOB` |
| FUN-EST-029 | PIA | `/app/studies/pia`, `/new`, `/$id/edit` | CRUD `/studies/pia`; inventory/export jobs | inventário vinculado e cálculo consistente; `AC-CRUD`, `AC-JOB` |
| FUN-EST-030 | PRADA | `/app/studies/prada`, `/new`, `/$id/edit` | CRUD `/studies/prada`; exports | diagnóstico, ações, cronograma e indicadores; `AC-CRUD`, `AC-JOB` |
| FUN-EST-031 | Barragens / Visão geral | `/app/studies/barragens` | `GET /dam-studies/dashboard` | agregação escopada; `AC-READ` |
| FUN-EST-032 | Barragens / Projeto técnico | `/app/studies/barragem`, `/new`, `/$id/edit` | CRUD `/dam-projects`; calculation/export jobs | geometria, estruturas, hidrologia e versão; `AC-JOB` |
| FUN-EST-033 | Barragens / Segurança e emergência | `/app/studies/seguranca-barragens`, `/new`, `/$id/edit` | CRUD `/dam-safety-plans`; HEC-RAS/export jobs | cenários, classificação e plano; `AC-JOB`, `AC-FILE` |
| FUN-EST-034 | Barragens / Piscinão | `/app/studies/piscinao-off-stream`, `/new`, `/$id/edit` | CRUD `/offstream-reservoir-projects`; calculation/export jobs | balanço hídrico e geometria; `AC-JOB` |
| FUN-EST-035 | PTRF | `/app/studies/ptrf`, `/new`, `/$id/edit` | CRUD `/studies/ptrf`; exports | intervenção, recomposição e cronograma; `AC-CRUD`, `AC-JOB` |
| FUN-EST-036 | RCA / Lista | `/app/studies/rca`, `/$id/edit` | CRUD `/studies/rca` | listagem A–H; `AC-CRUD` |
| FUN-EST-037 | RCA / Listagens A–H | `/app/studies/rca/new?listagem=A..H` | `POST /studies/rca`; schemas `GET /study-schemas/rca/{A..H}` | schema/export versionados; `AC-CRUD`, `AC-JOB` |
| FUN-EST-038 | Relatórios Diversos / Visão geral | `/app/studies/relatorios-diversos` | `GET /misc-reports/catalog` | `recurso.relatorio-diverso=visualizar`; `AC-READ` |
| FUN-EST-039 | Carvão vegetal | `/app/studies/relatorios-diversos/carvao-vegetal` | CRUD `/misc-reports/charcoal`; exports | `AC-CRUD`, `AC-JOB` |
| FUN-EST-040 | PTRF/PRAD | `/app/studies/relatorios-diversos/ptrf-prad` | CRUD `/misc-reports/ptrf-prad`; exports | `AC-CRUD`, `AC-JOB` |
| FUN-EST-041 | Transporte de resíduos | `/app/studies/relatorios-diversos/transporte-residuos` | CRUD `/misc-reports/waste-transport`; exports | transportador, resíduo e destino; `AC-CRUD`, `AC-JOB` |
| FUN-EST-042 | MTR-MG | `/app/studies/mtr` | CRUD `/mtr-studies`; sync/export jobs | integração isolada e idempotente; `AC-INT`, `AC-JOB` |
| FUN-EST-043 | Compensação / Visão geral | `/app/studies/compensacao-ambiental` | `GET /environmental-compensations/dashboard` | `AC-READ` |
| FUN-EST-044 | Compensação / Espécies | `/app/studies/compensacao-ambiental/especies` | CRUD `/environmental-compensations/protected-species` | base normativa versionada; `AC-CRUD` |
| FUN-EST-045 | Compensação / SNUC | `/app/studies/compensacao-ambiental/snuc` | CRUD `/environmental-compensations/snuc` | cálculo e base legal; `AC-CRUD` |
| FUN-EST-046 | Compensação / Mata Atlântica | `/app/studies/compensacao-ambiental/mata-atlantica` | CRUD `/environmental-compensations/atlantic-forest` | área e proporção; `AC-CRUD` |
| FUN-EST-047 | Compensação / Minerária | `/app/studies/compensacao-ambiental/mineraria` | CRUD `/environmental-compensations/mining` | empreendimento e cálculo; `AC-CRUD` |
| FUN-EST-048 | Compensação / APP | `/app/studies/compensacao-ambiental/app` | CRUD `/environmental-compensations/app` | intervenção e área; `AC-CRUD` |
| FUN-EST-049 | Reserva Legal | `/app/studies/reserva-legal` | CRUD `/legal-reserves`; analysis/export jobs | imóvel, percentual, geometria e compensação; `AC-JOB` |

## 11. Georreferenciamento

Pai: `modulo.georreferenciamento=acessar`; filhos usam `recurso.georreferenciamento-<slug>`.

| ID | Submenu | Tela | API | Regras/aceite |
| --- | --- | --- | --- | --- |
| FUN-GEO-001 | Painel | `/app/georeferenciamento` | `GET /georeferencing/dashboard` | `AC-READ` |
| FUN-GEO-002 | Trâmites fundiários | `/app/georeferenciamento/processos`, `/$id` | CRUD `/georeferencing/processes`; ações | estados, responsável e prazos; `AC-WORKFLOW` |
| FUN-GEO-003 | Rural SIGEF/INCRA | `/app/georeferenciamento/rural` | CRUD `/georeferencing/rural-projects`; validation jobs | datum, vértices, confrontantes e normas; `AC-JOB` |
| FUN-GEO-004 | Urbano cartório | `/app/georeferenciamento/urbano` | CRUD `/georeferencing/urban-projects` | matrícula, quadra/lote e memorial; `AC-CRUD`, `AC-JOB` |
| FUN-GEO-005 | CAR/SICAR | `/app/georeferenciamento/ambiental` | CRUD `/georeferencing/car-projects`; integration jobs | recibo, imóvel e geometria; `AC-INT`, `AC-JOB` |
| FUN-GEO-006 | Histórico CAR | `/app/georeferenciamento/historico-car` | `GET /car-history`; snapshot jobs | snapshots imutáveis e comparação; `AC-READ`, `AC-JOB` |
| FUN-GEO-007 | Campo e levantamento | `/app/georeferenciamento/campo` | CRUD `/georeferencing/surveys` | equipamento, precisão e pontos; `AC-CRUD`, `AC-FILE` |
| FUN-GEO-008 | Documentação técnica | `/app/georeferenciamento/documentos` | CRUD `/georeferencing/documents`; API-FILE | tipo, projeto e versão; `AC-FILE` |
| FUN-GEO-009 | Memorial descritivo | `/app/georeferenciamento/memorial-descritivo` | calculation/export jobs | fechamento, área, azimute e CRS; `AC-JOB` |
| FUN-GEO-010 | Validações | `/app/georeferenciamento/validacoes` | `POST /georeferencing/validation-jobs` | topologia, sobreposição e precisão; `AC-JOB` |
| FUN-GEO-011 | Cartório e registro | `/app/georeferenciamento/registro` | CRUD `/georeferencing/registrations`; ações | protocolo e status; `AC-WORKFLOW` |
| FUN-GEO-012 | Referências normativas | `/app/georeferenciamento/referencias` | CRUD `/georeferencing/references` | vigência e fonte; `AC-CRUD` |

## 12. Vendas e CRM

Pai: `modulo.crm=acessar`.

| ID | Submenu | Tela | API | Claim/regra |
| --- | --- | --- | --- | --- |
| FUN-CRM-001 | Alertas e notificações | `/app/crm/alerts` | CRUD `/crm/alerts`; ações read/dismiss | `recurso.crm-alerta=*`; `AC-WORKFLOW` |
| FUN-CRM-002 | Configurações CRM | `/app/crm/settings` | `GET/PATCH /crm/settings` | `recurso.crm-configuracao=configurar`; versão/auditoria |
| FUN-CRM-003 | Equipe e desempenho | `/app/crm/team` | `GET /crm/team-performance`; metas CRUD | `recurso.crm-equipe` com visualizar/editar; `AC-READ` |
| FUN-CRM-004 | Gestão de clientes | `/app/crm/clients` | CRUD `/crm/clients` | `recurso.crm-cliente=*`; deduplicação e ownership; `AC-CRUD` |
| FUN-CRM-005 | Mídias sociais | `/app/social-media` | CRUD `/social-media/posts`; ações schedule/publish | `recurso.midia-social=*`; `AC-WORKFLOW`, `AC-INT` |
| FUN-CRM-006 | Oportunidades e pipeline | `/app/crm/opportunities`, `/new`, `/$id/edit` | CRUD `/crm/opportunities`; ação move-stage | `recurso.crm-oportunidade=*`; estágio validado; `AC-WORKFLOW` |
| FUN-CRM-007 | Painel de vendas | `/app/crm` | `GET /crm/dashboard` | `recurso.crm-dashboard=visualizar`; `AC-READ` |
| FUN-CRM-008 | Relatórios e análises | `/app/crm/reports` | `GET /crm/reports/*` | `recurso.crm-relatorio=visualizar`; `AC-READ` |
| FUN-CRM-009 | Vendas e propostas | `/app/crm/proposals` | usa `/commercial-proposals` | `recurso.proposta-comercial=visualizar`; é atalho, não API duplicada |

## 13. Ofícios, governo e ferramentas do sistema

| ID | Menu/submenu | Tela | API | Claim/regra |
| --- | --- | --- | --- | --- |
| FUN-OFI-001 | Ofícios | `/app/oficios`, `/new`, `/$id/edit` | CRUD `/official-letters`; ações number/approve/send; exports | `recurso.oficio=*`; numeração atômica; `AC-WORKFLOW`, `AC-JOB` |
| FUN-EXT-001 | Webmail | `/app/external?target=webmail` | `GET /external-targets/webmail` | `recurso.webmail=acessar`; allowlist; `AC-INT` |
| FUN-GOV-001 | Consulta Intervenção Ambiental | `/app/external?target=gov-intervencao` | `GET /external-targets/gov-intervencao` | `recurso.acesso-governo-intervencao=acessar`; `AC-INT` |
| FUN-GOV-002 | Consulta Licenciamento | `/app/external?target=gov-licenciamento` | `GET /external-targets/gov-licenciamento` | `recurso.acesso-governo-licenciamento=acessar`; `AC-INT` |
| FUN-GOV-003 | Consulta Outorgas | `/app/external?target=gov-outorgas` | `GET /external-targets/gov-outorgas` | `recurso.acesso-governo-outorgas=acessar`; `AC-INT` |
| FUN-GOV-004 | CTF/IBAMA externo | `/app/external?target=gov-ctf` | `GET /external-targets/gov-ctf` | `recurso.acesso-governo-ctf=acessar`; `AC-INT` |
| FUN-GOV-005 | IDE-SisemaNet externo | `/app/external?target=gov-ide` | `GET /external-targets/gov-ide` | `recurso.acesso-governo-ide=acessar`; `AC-INT` |
| FUN-GOV-006 | SEI-IBAMA | `/app/external?target=gov-sei-ibama` | `GET /external-targets/gov-sei-ibama` | `recurso.acesso-governo-sei-ibama=acessar`; `AC-INT` |
| FUN-GOV-007 | SEI-MG | `/app/external?target=gov-sei-mg` | `GET /external-targets/gov-sei-mg` | `recurso.acesso-governo-sei-mg=acessar`; `AC-INT` |
| FUN-GOV-008 | SLA Ecossistemas | `/app/external?target=gov-sla` | `GET /external-targets/gov-sla` | `recurso.acesso-governo-sla=acessar`; `AC-INT` |
| FUN-SIS-001 | Informações da empresa | `/app/settings/company` | `GET/PATCH /organization/settings` | `recurso.configuracao-empresa=configurar`; versão/auditoria |
| FUN-SIS-002 | Responsáveis técnicos | `/app/technical-responsible`, `/new`, `/$id/edit` | CRUD `/technical-responsibles` | `recurso.responsavel-tecnico=*`; conselho/registro únicos; `AC-CRUD` |
| FUN-SIS-003 | Identidade visual | `/app/settings#identidade-visual` | `GET/PATCH /organization/branding`, API-FILE | `recurso.identidade-visual=configurar`; `AC-FILE` |
| FUN-SIS-004 | Aparência | `/app/settings/appearance` | `GET/PATCH /users/me/preferences` | `recurso.preferencia-propria=editar`; sempre escopo próprio |
| FUN-SIS-005 | Templates | `/app/settings/templates`, `/rca` | CRUD `/document-templates`; API-FILE | `recurso.template-documento=*`; placeholders/schema versionados |
| FUN-SIS-006 | Laudos | `/app/laudos`, `/new`, `/$id` | CRUD `/technical-reports`; report jobs | `recurso.laudo=*`; `AC-CRUD`, `AC-JOB` |
| FUN-SIS-007 | Consultas técnicas | `/app/consultas`, `/new`, `/$id`, `/$id/edit` | CRUD `/technical-consultations`; ações | `recurso.consulta-tecnica=*`; vínculo opcional com laudo; `AC-WORKFLOW` |
| FUN-SIS-008 | MCP + RAG | `/app/configuracoes/mcp-rag` | `GET/PATCH /ai-platform/settings`; sync jobs | `recurso.configuracao-ia=configurar`; segredos write-only |
| FUN-SIS-009 | Fontes de conhecimento | `/app/knowledge-sources`, `/new`, `/$id` | CRUD `/knowledge-sources`; indexing jobs | `recurso.fonte-conhecimento=*`; versão, origem e índice; `AC-JOB` |
| FUN-SIS-010 | Biblioteca IA OneDrive | `/app/ai-lab/cloud-library` | `GET /cloud-library`; sync jobs | `recurso.biblioteca-nuvem` com visualizar/sincronizar; `AC-INT`, `AC-JOB` |
| FUN-SIS-011 | Integração OneDrive | `/app/settings/onedrive-integration` | OAuth begin/callback/status/disconnect no API | `recurso.integracao-onedrive=configurar`; token cifrado; `AC-INT` |
| FUN-SIS-012 | Ferramentas MCP | `/app/ai-lab/mcp` | CRUD `/mcp-tools`; test action | `recurso.ferramenta-mcp=*`; allowlist e segredo write-only |
| FUN-SIS-013 | Laboratório RAG | `/app/ai-lab/rag` | `/rag/indexes`, `/rag/query-jobs` | `recurso.laboratorio-rag=executar`; isolamento de índice |
| FUN-SIS-014 | Importação de fonte local | `/app/settings/ai-local-source` | `POST /knowledge-import-jobs` | `recurso.fonte-conhecimento=importar`; sem dependência de caminho do legado; `AC-JOB` |
| FUN-SIS-015 | Backup de excluídos | `/app/settings/deleted-backups` | `GET /deleted-records`; ação restore | `recurso.registro-excluido` com visualizar/restaurar; restauração auditada |
| FUN-SIS-016 | Explorador de arquivos | `/app/settings/files` | `GET /files`; API-FILE | `recurso.arquivo` com visualizar/excluir; nunca aceita path físico |
| FUN-SIS-017 | Log de auditoria | `/app/audit-log` | `GET /audit-events` | `recurso.auditoria=visualizar`; somente leitura, paginação e filtros |
| FUN-SIS-018 | Canais WhatsApp/Instagram | `/app/canais` | CRUD `/communication-channels`; OAuth/webhooks | `recurso.canal-comunicacao=*`; segredos cifrados; `AC-INT` |
| FUN-SIS-019 | App/Coleta de campo | `/app/app-campo` | `GET /field-app/bootstrap`; sync commands se offline aprovado | `recurso.app-campo=acessar`; escopo mínimo e conflitos explícitos |
| FUN-AGEN-001 | Agenda | `/app/calendar` | CRUD `/calendar-events`; ações invite/respond | `recurso.agenda=*`; eventos próprios/públicos/organização escopados; `AC-WORKFLOW` |
| FUN-INV-001 | Inventários de campo | `/app/inventarios`, `/new`, `/$id`, `/$id/parcelas/$parcelaId` | CRUD `/field-inventories`; plots | `recurso.inventario-campo=*`; `AC-CRUD` |

## 14. Módulos mostrados no padrão novo sem requisito funcional no `web`

Não iniciar implementação nem inventar endpoints até existir especificação aprovada.

| ID | Menu visual | Situação | Gate para entrar no backlog |
| --- | --- | --- | --- |
| GAP-001 | AmbBot | não há fluxo de paridade identificado | casos de uso, dados, claims, telas e integrações aprovados |
| GAP-002 | Comunicação interna | apenas capacidades parciais de canais/notificações | definir mensagens, grupos, retenção e moderação |
| GAP-003 | Financiamento Agrário | sem páginas correspondentes | produto, simulação, proposta, documentos e instituição definidos |
| GAP-004 | Inteligência Ambiental | pode sobrepor IA/FAD/análise geoespacial | decidir se é agrupador ou produto próprio |
| GAP-005 | Minha área RH | sem páginas correspondentes | autosserviço, dados pessoais, férias, documentos e claims definidos |
| GAP-006 | Recursos Humanos | sem páginas correspondentes | pessoas, cargos, ponto, férias, folha/integrações e LGPD definidos |

## 15. Gate de conclusão de cada linha `FUN-*`

Uma linha somente muda para concluída quando:

1. rota e item de navegação estão registrados no módulo do `new`;
2. menu, rota, botões e endpoint usam as claims documentadas;
3. controller, caso de uso, domínio/policy e repositório estão separados no `ambientaR-api`;
4. endpoint usa DTO próprio, paginação e política de escopo;
5. frontend usa apenas o serviço HTTP do módulo;
6. critérios compartilhados e específicos da linha foram automatizados ou evidenciados;
7. nenhum código chama Firebase, API Next ou endpoint do `web`;
8. contrato está publicado e testado;
9. observabilidade e auditoria foram incluídas conforme risco;
10. produto homologou desktop, mobile, erros, vazios e permissões negativas.
