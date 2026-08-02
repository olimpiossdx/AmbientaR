# Plano mestre de migração do `web` para o `new`

Data-base: 21/07/2026  
Escopo: reimplementar no `new` e no `ambientaR-api` todas as funcionalidades, menus, interfaces e integrações identificadas no portal `web`, sem reutilizar código, endpoints, Firebase ou infraestrutura do legado e sem autorização baseada em perfis.

## 1. Resultado esperado

Ao final da migração:

- o `new` será o único portal web em produção;
- o `ambientaR-api` será o único backend consumido pelo `new`;
- menus, rotas, componentes e ações serão autorizados pelas claims da sessão;
- o `ambientaR-api` será a autoridade final de autenticação, autorização, regras de negócio e escopo de dados;
- o navegador não importará SDKs do Firebase nem acessará Firestore, Firebase Auth, Storage ou Functions diretamente;
- o `ambientaR-api` também não dependerá de APIs Next, serviços ou bibliotecas do legado;
- todas as leituras, gravações, uploads, exportações e processos assíncronos passarão por contratos do `ambientaR-api`;
- as funcionalidades do `web` terão paridade funcional e visual validada antes do corte;
- o `web` será usado somente para inventariar requisitos e comportamentos, nunca como dependência de execução, fallback ou contingência.

## 2. Linha de base auditada

Inventário técnico observado no repositório:

| Item | Linha de base |
| --- | ---: |
| Páginas em `web/src/app` | 301 |
| URLs canônicas após consolidar rotas interceptadas | 275 |
| Padrões de rota autenticada no destino | 262 |
| Variações funcionais autenticadas a homologar | 280 |
| Rotas de API Next em `web/src/app/api` | 157 |
| Arquivos do `web` com import de Firebase | 527 |
| Arquivos do `web` com operações diretas de dados | 421 |
| Rotas cobertas pelo inventário anterior de menu/alias | 284 |
| Módulos de topo esperados na sidebar | 22, além do Painel |

O `new` já possui partes importantes da fundação:

- React, Vite, TypeScript e TanStack Router;
- shell autenticado e rotas públicas de autenticação;
- cliente HTTP com interceptadores;
- sessão persistida sem armazenar tokens no `localStorage`;
- índice de claims em memória, `ClaimGuard` e filtro de navegação;
- registro modular de rotas e menus;
- componentes de interface reutilizáveis;
- dashboards iniciais ainda sem paridade completa de dados;
- documentos de auditoria do legado em `new/docs` e `web/docs`.

Esta linha de base deve ser regenerada no início e no fim de cada onda. Contagens não substituem o checklist de comportamento: uma página pode conter diversos fluxos, ações, integrações e regras de acesso.

Inventários executáveis deste plano:

- `new/docs/INVENTARIO-COMPLETO-TELAS-ROTAS.md`: todas as telas, padrões de rota, variações A–H e decisões de remoção;
- `new/docs/CATALOGO-MENUS-FUNCIONALIDADES-API.md`: 188 funcionalidades `FUN-*`, incluindo cada menu/submenu, endpoints, claims, regras e aceite;
- este documento: ordem, dependências, gates e processo de execução.

### 2.1 Estado validado da migração

Última validação: 23/07/2026.

O status abaixo considera o gate vertical completo. Rota, tela ou service isolados não tornam uma funcionalidade migrada.

| Indicador | Estado atual |
| --- | ---: |
| Funcionalidades catalogadas | 188 |
| Funcionalidades concluídas | 1 (`FUN-AUTH-001`) |
| Funcionalidades com frontend parcial | 3 (`FUN-CAD-001`, `FUN-AGEN-001`, `FUN-CORE-001`) |
| Variações do inventário atendidas por rota concreta | 8 de 285 |
| Padrões do inventário atendidos por rota concreta | 8 de 267 |
| Funcionalidades cuja rota declarada já existe | 9 |
| Catch-all de compatibilidade | 1, excluído da cobertura |

As nove funcionalidades com rota concreta são `FUN-AUTH-001..006`, `FUN-CORE-001`, `FUN-CAD-001` e `FUN-AGEN-001`. Destas, somente o login está concluído. Cadastro, recuperação, política, offline e sessão ainda precisam de aceite individual; Painel, Usuários e Agenda já têm frontend modular, mas ainda não fecharam o corte vertical com o `ambientaR-api`.

| Módulo/pai | Estado | Pendência principal |
| --- | --- | --- |
| Acesso e sessão | parcial | login concluído; `FUN-AUTH-002..006` sem gate individual completo |
| Painel e Carteira | bloqueado | frontend do Painel consome `GET /dashboard` sem fallback; endpoint ausente; Carteira não iniciada |
| Cadastro | em execução | finalizar `FUN-CAD-001` Usuários; Empreendedores, Empreendimentos e Empresas pendentes |
| Agenda | bloqueado | frontend existe; domínio, persistência e endpoints `/calendar-events` não existem na API |
| Financeiro | pendente | 25 funcionalidades |
| Documentos Ambientais | pendente | 13 funcionalidades |
| Multas e Defesas | pendente | 2 funcionalidades |
| Vistoria Técnica | pendente | 3 funcionalidades |
| Licenciamento | pendente | 3 funcionalidades |
| Gestão de Projetos e Processos | pendente | 6 funcionalidades |
| IA | pendente | 9 funcionalidades |
| Fiscal Ambiental Digital | pendente | 14 funcionalidades |
| Estudos Técnicos | pendente | 49 funcionalidades |
| Inventários de campo | pendente | 1 funcionalidade |
| Georreferenciamento | pendente | 12 funcionalidades |
| Vendas & CRM | pendente | 9 funcionalidades |
| Ofícios | pendente | 1 funcionalidade |
| Webmail | pendente | 1 funcionalidade |
| Acessos Governamentais | pendente | 8 funcionalidades |
| Ferramentas do Sistema | pendente | 19 funcionalidades |

Itens visuais de menu sem requisito funcional confirmado no `web` permanecem como `GAP-*` e não entram nas 188 funcionalidades até especificação de produto.

#### Próxima entrega

A próxima entrega deve ser **concluir `FUN-CAD-001` — Cadastro / Usuários**, e não abrir outro módulo amplo. É o piloto com menor distância para o gate: a API já possui CRUD de `/user`, grupos e catálogo de claims, e o `new` já possui rota, listagem, formulário e painel de grupos.

Ordem imediata:

1. fechar contrato, escopo, edição própria versus administração, DTOs sem senha/hash e versionamento;
2. alinhar menu e rota ao registro do próprio módulo, com claims cumulativas de Cadastro + Usuários;
3. completar testes negativos e de integração do `ambientaR-api`;
4. executar aceite desktop/mobile e anexar evidência dos dez passos;
5. em seguida, implementar a API da Agenda e substituir os dados estáticos do Painel.

## 3. Princípios obrigatórios

### 3.1 Sem Firebase ou runtime legado

No `new` será proibido:

- importar `firebase`, `firebase-admin` ou arquivos de configuração do Firebase;
- consultar coleções/documentos diretamente;
- observar dados com `onSnapshot`;
- autenticar ou recuperar senha diretamente em Firebase Auth;
- enviar ou obter arquivos diretamente pelo Firebase Storage;
- chamar Cloud Functions por SDK.

No `ambientaR-api` será proibido:

- encaminhar requisições para as 157 rotas Next do `web`;
- consultar Firestore, Firebase Auth, Firebase Storage ou Cloud Functions;
- importar regras de negócio do repositório legado;
- manter adaptadores temporários que façam o `new` depender do funcionamento do `web`;
- expor respostas no formato acidental das coleções antigas em vez de DTOs do novo domínio.

O `web` é uma fonte de levantamento de requisitos, não uma camada da arquitetura-alvo. Código antigo poderá ser lido para compreender comportamento, mas cada capacidade será redesenhada com contrato, domínio, testes e persistência próprios no `ambientaR-api`.

O padrão deste plano é iniciar com persistência própria no MongoDB do `ambientaR-api`. Uma eventual importação de dados históricos fica fora do fluxo principal e dependerá de decisão explícita; se aprovada, será feita por scripts controlados, auditáveis e descartáveis, nunca pelo runtime do `new` ou pelo caminho normal de requisição do API.

### 3.2 Claims substituem perfis nas decisões de acesso

`role`, `perfil`, `isAdmin` e listas de perfis não serão usados para decidir menu, rota, ação ou acesso a endpoint. Um perfil pode continuar existindo como dado de negócio ou como modelo para atribuir um conjunto inicial de claims, mas não como mecanismo de autorização em tempo de execução.

Formato canônico:

```ts
type AuthClaim = {
  claimType: string;
  claimValue: string;
};
```

Convenção proposta:

| Finalidade | `claimType` | `claimValue` de exemplo |
| --- | --- | --- |
| Entrada no módulo | `modulo.cadastro` | `acessar` |
| Recurso | `recurso.usuario` | `visualizar`, `criar`, `editar`, `excluir` |
| Operação especial | `operacao.financeiro.conciliacao` | `executar` |
| Exportação | `recurso.licenca` | `exportar` |
| Administração | `recurso.claim` | `atribuir` |

Regras:

- comparação de `claimType` e `claimValue` sem diferença de caixa;
- nenhuma implicação automática: `editar` não concede `visualizar`;
- requisitos de pais e filhos são cumulativos;
- menu oculto não substitui guard de rota;
- guard de rota não substitui validação da API;
- ações como criar, editar, excluir, aprovar, exportar e executar jobs terão claims próprias quando o risco for diferente;
- não haverá claim universal implícita de administrador no frontend;
- alterações de claims deverão invalidar ou renovar a sessão para produzir efeito previsível.

### 3.3 Permissão e escopo são problemas diferentes

A claim responde **o que** a pessoa pode fazer. O backend responde **sobre quais registros** ela pode fazer.

Exemplos de escopo:

- todos os registros da organização;
- registros do próprio usuário;
- titular/cliente vinculado;
- empreendimentos representados;
- carteira aprovada do consultor;
- tarefas em que o usuário participa.

O frontend nunca deve baixar uma coleção ampla para filtrá-la localmente. A API aplicará o escopo usando a identidade da sessão e os vínculos persistidos. IDs enviados pelo cliente não serão considerados prova de acesso.

### 3.4 Migração vertical por funcionalidade

Cada item será entregue de ponta a ponta:

```text
claim -> menu -> rota -> tela -> serviço HTTP -> endpoint -> regra de escopo
      -> persistência/arquivo/job -> auditoria -> testes -> aceite
```

Não considerar uma funcionalidade migrada quando somente a interface existir ou quando ainda consumir o Firebase/Next legado.

## 4. Arquitetura-alvo

### 4.1 Componentes oficiais

| Componente | Tecnologia atual | Papel na solução |
| --- | --- | --- |
| `new` | React, Vite, TypeScript, TanStack Router | apresentação, interação, estado de tela e consumo HTTP |
| `ambientaR-api` | NestJS e TypeScript | casos de uso, domínio, autorização, integrações e contratos HTTP |
| persistência do API | MongoDB com MikroORM | fonte oficial dos dados da aplicação |
| projeção de autorização | Redis | cache reconstruível e versionado de claims efetivas |

O `ambientaR-api` já possui autenticação por cookies, MongoDB/MikroORM, Redis, catálogo de claims, grupos de autorização, decorators `@ClaimType`/`@ClaimValue` e `ClaimsGuard`. A migração deve evoluir essa base, sem criar um segundo mecanismo de autorização.

### 4.2 Responsabilidades do `new`

Estrutura mínima de cada módulo:

```text
new/src/modules/<modulo>/
  <modulo>.module.ts
  <modulo>.routes.tsx
  <modulo>.navigation.ts
  <modulo>.claims.ts
  pages/
  components/
  services/
  schemas/
  types/
  __tests__/
```

O frontend pode:

- renderizar menus, rotas, formulários, tabelas, dashboards e feedbacks;
- fazer validação de experiência para respostas rápidas ao usuário;
- consultar as claims da sessão para ocultar ou bloquear elementos;
- montar filtros, paginação e comandos conforme contratos publicados;
- acompanhar o estado de uploads, exports e jobs.

O frontend não pode:

- implementar regra de negócio que determine o resultado oficial de uma operação;
- decidir escopo de dados ou confiar em IDs enviados pelo usuário;
- acessar banco, armazenamento ou integrações externas diretamente;
- conter segredos, credenciais ou chaves de terceiros;
- reproduzir listas de perfis ou regras de autorização paralelas às claims.

### 4.3 Responsabilidades do `ambientaR-api`

Cada domínio novo deverá separar:

```text
ambientaR-api/src/modules/<dominio>/
  presentation/
    http/                 # controllers, requests e responses
  application/
    use-cases/            # orquestração das operações
    ports/                # contratos necessários pelo caso de uso
    dto/                  # entrada e saída da aplicação
  domain/
    models/               # entidades e value objects
    services/             # regras que envolvem mais de uma entidade
    policies/             # regras de negócio e escopo
  infrastructure/
    persistence/          # repositórios MikroORM/MongoDB
    integrations/         # serviços externos
    storage/              # arquivos
    jobs/                 # processamento assíncrono
  <dominio>.module.ts
```

Regra de dependência:

```text
presentation -> application -> domain
infrastructure -> application/domain por implementação de portas
domain -> não depende de NestJS, banco, HTTP ou serviços externos
```

Papéis das camadas:

| Camada do API | Responsabilidade |
| --- | --- |
| controller | protocolo HTTP, validação estrutural e chamada do caso de uso |
| caso de uso | orquestra transação, autorização contextual e fluxo da operação |
| domínio/policy | invariantes, transições, cálculos e regras de escopo |
| repositório | persistência e consultas já limitadas ao escopo necessário |
| integração | traduzir contratos de terceiros para tipos internos |
| job | executar trabalho demorado, idempotente e observável |
| guard de claims | negar endpoint antes do caso de uso quando faltar capacidade |

Controllers não acessarão repositórios diretamente. Repositórios não retornarão modelos de transporte HTTP. O `new` não conhecerá schemas de banco.

### 4.4 Registro de módulos no frontend

Responsabilidades:

| Camada | Responsabilidade |
| --- | --- |
| `app-modules` | registrar cada módulo uma única vez |
| registro de navegação | gerar sidebar e atalhos a partir dos módulos |
| TanStack Router | lazy loading, parâmetros, busca e guards por claims |
| `auth` | login, refresh, logout, reautenticação e snapshot da sessão recebido do `ambientaR-api` |
| `authorization` | normalizar e consultar claims; não conhecer perfis |
| cliente HTTP | cookies seguros, correlação, erros e renovação de sessão |
| serviços do módulo | traduzir UI para DTOs; nunca chamar Firebase |
| `ambientaR-api` | validar sessão, claims, escopo, entrada, invariantes e concorrência |
| persistência | MongoDB e arquivos atrás de repositórios/adaptadores do `ambientaR-api` |
| jobs | exportações e processamentos longos com status consultável |

O registro do módulo deve ser a fonte única para rota e navegação. Isso evita menu sem rota, rota protegida só visualmente e matrizes duplicadas.

### 4.5 Fluxo obrigatório de uma operação

```text
Usuário
  -> tela do new
  -> service HTTP do módulo
  -> controller do ambientaR-api
  -> AuthGuard + ClaimsGuard
  -> caso de uso
  -> policy de domínio/escopo
  -> porta de repositório ou integração
  -> implementação MongoDB/serviço externo
  -> DTO de resposta
  -> tela do new
```

## 5. Entregáveis de governança antes da migração em massa

### 5.1 Matriz de paridade

Criar uma linha para cada fluxo, não apenas para cada URL, contendo:

| Campo | Conteúdo esperado |
| --- | --- |
| ID | identificador estável, por exemplo `CAD-USU-001` |
| módulo/fluxo | nome funcional |
| rota legada e nova | origem e destino |
| telas/estados | lista, detalhe, criação, edição, vazio, erro |
| ações | visualizar, criar, editar, excluir, aprovar, exportar etc. |
| claims | requisito de módulo, rota e ação |
| escopo | global, próprio, titular, carteira, participante etc. |
| fontes observadas | dados, arquivos, funções e integrações que explicam o comportamento do `web` |
| endpoints novos | contratos necessários no `ambientaR-api` |
| arquivos/jobs | upload, exportação e processamento |
| dependências | cadastros e serviços necessários |
| testes | unitário, integração, contrato e E2E |
| status | inventariado, contratado, implementando, homologando, concluído |
| evidência | teste, captura ou aceite do responsável |

### 5.2 Catálogo de claims

Usar e ampliar o catálogo versionado já implementado no `ambientaR-api`, com:

- descrição de cada claim;
- módulo e ação protegidos;
- criticidade;
- incompatibilidades;
- templates de claims que substituem os perfis atuais;
- data e motivo de criação/alteração;
- endpoints que exigem a claim.

Os templates servem apenas para facilitar a atribuição. Depois do login, a autorização considera exclusivamente as claims efetivas.

### 5.3 Catálogo do `ambientaR-api`

Para cada endpoint definir:

- método e URL;
- request, response e erros padronizados;
- claim obrigatória;
- regra de escopo;
- paginação, ordenação e filtros;
- idempotência e concorrência para gravações;
- trilha de auditoria;
- limite de tamanho e tipo para uploads;
- política de timeout/retry para integrações externas.

## 6. Fases de execução

### Fase 0 — Descoberta e congelamento da linha de base

Objetivo: eliminar lacunas do inventário antes de reimplementar as capacidades.

Atividades:

1. Executar e corrigir as auditorias de menu/rota existentes no `web`.
2. Inventariar as 301 páginas por fluxo e remover duplicidades técnicas, como rotas interceptadas.
3. Inventariar as 157 rotas Next somente para descobrir capacidades e criar casos de uso próprios no `ambientaR-api`; nenhuma será reutilizada ou chamada.
4. Mapear as 527 dependências do Firebase por Auth, Firestore, Storage, Functions, listeners e Admin SDK.
5. Registrar APIs externas, exports DOCX/PDF/XLSX, mapas, processamento geoespacial, notificações, offline e jobs.
6. Classificar cada fluxo em criticidade, uso e complexidade.
7. Definir responsáveis de produto para homologação de cada módulo.

Saída obrigatória: matriz de paridade completa, sem rota ou ação órfã.

### Fase 1 — Fundação de autenticação, claims e API

Objetivo: estabelecer o padrão que todas as ondas seguintes utilizarão.

Atividades:

1. Fechar no `ambientaR-api` os contratos de `/auth/login`, `/auth/session`, `/auth/refresh`, `/auth/relogin`, `/auth/logout`, cadastro e recuperação de senha.
2. Validar cookies `HttpOnly`, `Secure`, `SameSite`, CSRF, CORS e expiração.
3. Concluir os fluxos de sessão bloqueada, refresh concorrente, troca de usuário e retorno à rota original.
4. Evoluir requisitos de claims para suportar os requisitos cumulativos da árvore sem duplicar lógica.
5. Aplicar claims no registro de módulo, menu, rota e componentes de ação.
6. Aplicar os decorators e o `ClaimsGuard` já existentes a todos os controllers protegidos e implementar policies de escopo nos casos de uso.
7. Completar os endpoints administrativos existentes de catálogo/grupos para consultar e atribuir claims, com auditoria e proteção por `recurso.claim=atribuir`.
8. Criar testes negativos: sem sessão, sem claim, claim removida, escopo alheio e tentativa por URL direta.
9. Adicionar verificações automáticas que falhem se o `new` importar Firebase ou se o `ambientaR-api` depender de código/endpoints do `web`.

Gate: nenhum módulo de negócio inicia homologação sem autenticação, autorização e cliente HTTP estabilizados.

### Fase 2 — Shell, navegação e dashboard

Objetivo: alcançar paridade da estrutura diária do portal.

Atividades:

1. Reproduzir os 22 grupos da sidebar e o Painel usando o registro modular.
2. Trocar todas as listas de perfis atuais por claims catalogadas.
3. Implementar sidebar desktop, navegação mobile, breadcrumbs, busca, colapso e persistência de preferências.
4. Migrar notificações, branding, tema, sessão bloqueada e acesso negado.
5. Substituir mocks do dashboard por endpoints agregados, autorizados e implementados no `ambientaR-api`.
6. Montar dashboards por capacidades, não por `role`: widgets aparecem quando suas claims e dados estiverem disponíveis.
7. Preservar filtros de titular, representante, consultor e participante exclusivamente no backend.

Gate: menu, rota direta e endpoint produzem a mesma decisão para toda combinação testada de claims.

### Fase 3 — Dados mestres e operação principal

Ordem recomendada:

1. Cadastro: usuários, empreendedores, empreendimentos, empresas e responsáveis técnicos.
2. Agenda e comunicação interna.
3. Documentos Ambientais: CAR, condicionantes, CTF/IBAMA, DAIA, fauna, licenças, TAC, MTR, pasta do cliente, monitoramento, outorgas e usos insignificantes.
4. Gestão de Projetos e Processos: projetos, fluxo, tarefas, indicadores e planilha.
5. Vistoria Técnica, Multas e Defesas e Ofícios.

Motivo da ordem: cadastros e vínculos definem o escopo utilizado pelos módulos seguintes.

Para cada módulo:

- implementar listagem paginada e filtros no servidor;
- migrar detalhe, criação, edição e exclusão quando aplicável;
- portar validações para schemas compartilháveis;
- substituir uploads diretos por fluxo preparado/assinado pelo `ambientaR-api`;
- registrar auditoria de alterações sensíveis;
- validar estados de loading, vazio, erro, conflito e acesso negado;
- validar os resultados contra cenários de aceite derivados do levantamento funcional.

### Fase 4 — Financeiro e CRM

Objetivo: migrar domínios transacionais depois de cadastros e escopos estarem estáveis.

Escopo:

- clientes, fornecedores, serviços, contratos e contratos de fornecedores;
- propostas, faturas, caixa, acesso bancário e contratos da plataforma;
- painéis, DRE, curvas ABC, patrimônio, ROI, fluxo projetado, conciliação, orçamento e exportação contábil;
- CRM: painel, clientes, oportunidades, propostas, equipe, alertas, relatórios e configurações;
- integrações de cobrança, PIX, NFe e serviços externos.

Requisitos adicionais:

- idempotência para pagamentos e lançamentos;
- controle de concorrência e prevenção de duplicidade;
- trilha de auditoria imutável;
- mascaramento de dados sensíveis;
- reconciliação dos totais e invariantes dentro da nova persistência;
- claims separadas para visualizar, lançar, aprovar, estornar, conciliar e exportar.

### Fase 5 — Estudos técnicos e geração documental

Objetivo: migrar os fluxos técnicos extensos por submódulos independentes.

Ondas internas sugeridas:

1. estudos com CRUD e formulários convencionais;
2. PCA e RCA, incluindo listagens A–H;
3. PIA, PRADA, PTRF, compensação e reserva legal;
4. barragens, segurança/emergência e piscinão;
5. inventário, coleta de campo, fauna, cavidades e EIA/RIMA;
6. relatórios diversos, mapas, memorial e exports.

Cada exportação deve ter teste de conteúdo e comparação visual. Processos pesados devem virar jobs assíncronos com criação, progresso, conclusão, falha, cancelamento quando possível e download autorizado.

### Fase 6 — IA, Fiscal Ambiental Digital e geotecnologia

Objetivo: migrar integrações e processamento de maior risco técnico depois dos contratos básicos estarem maduros.

Escopo:

- assistentes, RAG, MCP, automações, biblioteca e relatórios de IA;
- workspaces, acervo, comparador, evidências, inteligência, fiscalização, monitoramento, ESG e relatórios do FAD;
- análise ambiental/socioambiental;
- georreferenciamento rural, urbano, CAR, campo, documentos, validações, registro, referências e trâmites;
- mapas, WFS/ArcGIS, arquivos SHP/KML/DWG, mosaicos e análises espaciais.

Requisitos adicionais:

- credenciais e chaves somente no backend;
- cotas, timeout, retry e circuit breaker;
- registro de modelo, prompt, fonte e custo quando aplicável;
- autorização de download de artefatos;
- processamento assíncrono e observabilidade;
- testes com fixtures geoespaciais e arquivos grandes.

### Fase 7 — Sistema, integrações e acabamento

Escopo:

- acessos governamentais e `/external` com allowlist;
- configurações de empresa, aparência e identidade visual;
- templates, laudos, consultas e fontes de conhecimento;
- arquivos, backups de excluídos, auditoria, canais e integrações;
- webmail, OneDrive, notificações e push;
- comportamento offline, se confirmado como requisito do novo portal;
- acessibilidade, responsividade e desempenho.

Gate: nenhuma URL externa poderá ser aberta a partir de parâmetro arbitrário sem validação no backend ou allowlist versionada.

### Fase 8 — Entrada em produção do novo conjunto

1. Homologar `new` + `ambientaR-api` como um conjunto independente, sem o `web` disponível no caminho de execução.
2. Começar com a persistência própria do `ambientaR-api`; somente executar importação histórica se ela tiver sido aprovada como projeto separado.
3. Realizar ensaio de publicação com tempo, rollback da nova versão e responsáveis registrados.
4. Liberar o conjunto novo por grupos controlados de usuários/organizações.
5. Monitorar erros, latência, jobs, uploads e negações de autorização.
6. Ampliar o acesso somente após aceite dos módulos críticos.
7. Tratar rollback como retorno à versão anterior do `new` e do `ambientaR-api`, nunca como redirecionamento ao `web`.
8. Arquivar o código usado como referência após concluir o inventário e atualizar a documentação operacional.

## 7. Ordem dos módulos e dependências

| Onda | Módulos | Dependências principais |
| --- | --- | --- |
| 0 | inventário e contratos | responsáveis de produto e arquitetura |
| 1 | auth, claims, `ambientaR-api`, auditoria | MongoDB, Redis e cookies de sessão |
| 2 | shell, navegação, dashboard | onda 1 |
| 3A | cadastros e agenda | onda 1 |
| 3B | documentos ambientais | cadastros, arquivos e escopo |
| 3C | processos, vistoria, multas e ofícios | cadastros, agenda e documentos |
| 4 | financeiro e CRM | cadastros, auditoria e integrações |
| 5 | estudos técnicos | cadastros, documentos, arquivos e jobs |
| 6 | IA, FAD e geotecnologia | arquivos, jobs, observabilidade e integrações |
| 7 | sistema e acabamento | módulos anteriores |
| 8 | corte | paridade e gates aprovados |

Módulos independentes dentro de uma onda podem ser executados em paralelo, mas uma equipe não deve começar uma tela antes de fechar claims, contrato de API e regra de escopo daquele fluxo.

### 7.1 Passo a passo obrigatório de cada funcionalidade `FUN-*`

Cada linha do catálogo passa pelas etapas abaixo, na ordem. Não abrir trabalho genérico como “migrar Financeiro”; abrir uma entrega por `FUN-*` ou por pequeno conjunto que compartilhe o mesmo agregado.

#### Passo 1 — Refinamento funcional

- confirmar nome, objetivo, ator e cenários;
- ligar todas as telas do inventário à `FUN-*`;
- identificar ações, estados, campos, cálculos, anexos, exportações e integrações;
- substituir qualquer regra descrita por perfil por capacidade + escopo;
- registrar exemplos válidos, inválidos e limites.

Saída: critérios específicos aprovados e nenhuma tela órfã.

#### Passo 2 — Contrato e autorização

- definir DTOs de request/response e erros;
- definir `claimType` do controller e `claimValue` de cada handler;
- definir política de escopo, tenant/titular/carteira/participação;
- definir paginação, filtros, ordenação, idempotência e versão;
- sincronizar o catálogo de claims em ambiente de desenvolvimento.

Saída: contrato testável antes da interface.

#### Passo 3 — Domínio no `ambientaR-api`

- criar modelos/value objects sem dependência de NestJS/MongoDB;
- implementar invariantes, transições e policies;
- criar portas para persistência, arquivos, filas e integrações;
- cobrir regras e negativas com testes unitários.

Saída: domínio executável sem HTTP.

#### Passo 4 — Aplicação e infraestrutura

- implementar casos de uso;
- implementar repositórios MikroORM com escopo aplicado na consulta;
- implementar integrações/adaptadores sem vazar DTO externo;
- implementar jobs/arquivos conforme padrões do catálogo;
- garantir auditoria, correlação e observabilidade.

Saída: casos de uso testados contra infraestrutura real ou containerizada.

#### Passo 5 — HTTP no `ambientaR-api`

- criar controller fino com DTO/validação;
- aplicar `@ClaimType`, `@ClaimValue`, AuthGuard e ClaimsGuard;
- mapear erros de domínio para resposta uniforme;
- adicionar testes de integração: autorizado, sem claim, fora do escopo, inválido e conflito;
- publicar contrato no catálogo da API.

Saída: endpoint pronto para consumo, sem dependência do frontend.

#### Passo 6 — Fundação do módulo no `new`

- criar/estender `<modulo>.module.ts`, rotas, navegação e claims;
- criar tipos de apresentação e schemas de formulário/search params;
- criar service que usa somente o cliente HTTP central;
- adicionar fixtures de contrato para desenvolvimento/teste.

Saída: módulo registrável sem página monolítica.

#### Passo 7 — Telas e ações

- implementar lista/dashboard/hub quando previsto;
- implementar detalhe, criação e edição compartilhando componentes;
- aplicar guard de rota e `ClaimGuard` em cada ação sensível;
- implementar loading, skeleton, vazio, erro, 403, 404 e conflito;
- implementar responsividade, teclado, foco, rótulos e feedback.

Saída: todas as rotas ligadas à `FUN-*` funcionam contra o API.

#### Passo 8 — Navegação

- registrar menu/submenu no módulo;
- colocar claim de módulo no agrupador e claim de visualização no filho;
- garantir que pai sem filhos autorizados desapareça;
- validar breadcrumb, item ativo, busca e navegação mobile;
- impedir item desabilitado permanente: funcionalidade não pronta fica atrás de feature flag e fora do menu produtivo.

Saída: menu, URL direta e endpoint tomam decisões coerentes.

#### Passo 9 — Testes verticais e aceite

- executar critérios `AC-*` compartilhados e o delta da linha `FUN-*`;
- testar cada variação funcional, inclusive PCA/RCA A–H e tipos de compensação;
- executar E2E com claim+escopo, sem claim e fora do escopo;
- validar documentos/exportações visualmente quando existirem;
- anexar evidência e obter aceite do responsável de produto.

Saída: `FUN-*` concluída e liberável isoladamente.

#### Passo 10 — Liberação

- liberar por feature flag para grupo controlado;
- observar erro, p95, negações, jobs e auditoria;
- corrigir antes de ampliar;
- remover flag somente após período definido da onda;
- atualizar métricas de cobertura e documentação.

Saída: funcionalidade estável em produção no conjunto `new` + `ambientaR-api`.

### 7.2 Sequência detalhada das ondas

1. **Fundação:** `FUN-AUTH-*`, autorização/grupos, arquivos, jobs, auditoria e padrões `AC-*`.
2. **Pilotos:** `FUN-CAD-001` Usuários, `FUN-AGEN-001` Agenda e `FUN-CORE-001` Painel.
3. **Escopo base:** `FUN-CAD-002..004` e `FUN-CORE-002` Carteira.
4. **Operação ambiental:** `FUN-DOC-001..013`.
5. **Fluxos legais/operacionais:** `FUN-LEG-*`, `FUN-VIS-*`, `FUN-LIC-*`, `FUN-PRO-*`, `FUN-OFI-*`.
6. **Financeiro:** `FUN-FIN-001..025`, começando por cadastros e terminando em conciliação/exportações/IA.
7. **CRM:** `FUN-CRM-001..009`.
8. **Estudos convencionais:** `FUN-EST-001..004`, `020..022`, `025..030`, `035..037`.
9. **Inventário/fauna/campo:** `FUN-EST-005..019` e `FUN-INV-001`.
10. **Barragens/compensações/relatórios:** `FUN-EST-031..049`.
11. **Georreferenciamento:** `FUN-GEO-001..012`.
12. **IA e FAD:** `FUN-IA-*`, `FUN-FAD-*`.
13. **Sistema e integrações:** `FUN-SIS-*`, `FUN-GOV-*`, `FUN-EXT-*`.
14. **Gaps de produto:** `GAP-*` somente depois de especificação própria aprovada.
15. **Homologação global:** todas as 285 URLs/variações do inventário, matriz de claims e corte.

## 8. Definição de pronto por funcionalidade

Uma funcionalidade só recebe status `concluído` quando:

- consta na matriz de paridade com responsável e evidência;
- menus desktop/mobile obedecem às claims;
- rota direta possui guard;
- cada ação sensível possui guard de experiência;
- a API valida sessão, claim e escopo novamente;
- não existe import, consulta ou upload Firebase no `new` ou no `ambientaR-api`;
- não existe chamada do `new` ou do `ambientaR-api` para endpoints do `web`;
- controller, caso de uso, domínio e infraestrutura respeitam a separação definida;
- não existe `fetch` fora do cliente/serviço HTTP definido;
- loading, vazio, erro, conflito, sessão expirada e acesso negado foram tratados;
- logs e auditoria não expõem dados sensíveis;
- testes unitários, de contrato, integração e E2E relevantes passam;
- layout foi validado em desktop e mobile;
- acessibilidade básica por teclado, foco, rótulos e contraste foi verificada;
- desempenho está dentro do orçamento do módulo;
- produto comparou o comportamento com o `web` e deu aceite;
- documentação e catálogo de claims/API foram atualizados.

## 9. Estratégia de testes

### Pirâmide mínima

- **Unitários:** normalização de claims, schemas, formatadores, cálculos e componentes críticos.
- **Contrato:** requests/responses do `ambientaR-api` e compatibilidade com o `new`.
- **Integração:** endpoint + policy + escopo + persistência.
- **E2E:** login, menu, URL direta, CRUD, upload, exportação e sessão expirada.
- **Segurança:** ausência de claim, claim inválida, ID de terceiro, alteração de tenant/titular e URL externa maliciosa.
- **Aceite funcional:** cenários extraídos do comportamento esperado, executados integralmente no conjunto novo.
- **Visual:** páginas e documentos exportados de maior importância.

### Matriz de autorização obrigatória

Para cada recurso/ação testar ao menos:

1. com a claim e dentro do escopo: permitido;
2. sem a claim e dentro do escopo: negado;
3. com a claim e fora do escopo: negado;
4. por URL direta: mesma decisão do menu;
5. por chamada direta à API: mesma decisão da rota;
6. após remoção da claim/expiração da sessão: acesso revogado.

## 10. Métricas de acompanhamento

Painel semanal por fluxo e por módulo:

- fluxos inventariados / total;
- contratos de API aprovados / total;
- fluxos independentes de Firebase e do `web` / total;
- casos de uso implementados no `ambientaR-api` / total;
- fluxos implementados, homologados e concluídos;
- claims catalogadas e endpoints cobertos;
- rotas de menu sem implementação;
- rotas implementadas sem entrada/alias documentado;
- bugs abertos por severidade;
- cobertura dos testes de autorização;
- divergências de dados e arquivos;
- taxa de erro, p95 de API e falhas de jobs no piloto.

Não usar “quantidade de telas copiadas” como medida principal. O indicador de progresso é o fluxo vertical homologado.

## 11. Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| Copiar regra de perfil para claims sem revisar capacidade real | workshops por módulo e matriz recurso × ação × escopo |
| Menu autorizado, API desprotegida | policy obrigatória e testes diretos de endpoint |
| Claims excessivamente amplas | granularidade por ação crítica e revisão de menor privilégio |
| Buscar todos os dados e filtrar no browser | paginação e escopo obrigatório no backend |
| Perder comportamento escondido em páginas grandes | inventário por fluxo e homologação com usuários-chave antes de arquivar a referência |
| Reescrever 301 páginas de uma só vez | ondas verticais, feature flags e gates |
| Misturar HTTP, negócio e persistência no API | estrutura por domínio, portas, revisão arquitetural e testes de unidade |
| Divergência em financeiro/documentos | invariantes, importação auditada quando necessária e relatórios de consistência |
| Jobs e exports bloquearem requests | fila assíncrona, status e retry idempotente |
| Firebase ou endpoint legado permanecer indiretamente | regras de lint/build, auditoria de dependências e teste de arquitetura |
| Publicação sem retorno seguro | ensaio, backup e rollback versionado de `new` + `ambientaR-api` |

## 12. Primeiro ciclo executável

O primeiro ciclo deve produzir, nesta ordem:

1. matriz de paridade consolidada a partir das auditorias existentes;
2. catálogo inicial de claims para Auth, Painel, Cadastro e Agenda;
3. contratos correspondentes no `ambientaR-api`;
4. template de módulo do `ambientaR-api` com controller, caso de uso, domínio, porta e infraestrutura separados;
5. verificação automática “zero Firebase e zero dependência do `web`” nos dois projetos;
6. reimplementação vertical de **Usuários** como referência de CRUD e administração de claims;
7. reimplementação vertical de **Agenda** como referência de escopo próprio/global;
8. dashboard composto por claims consumindo endpoints reais;
9. template de módulo frontend e checklist de definição de pronto reutilizável pelas próximas equipes.

Usuários e Agenda funcionam como pilotos complementares: o primeiro valida administração, CRUD e claims; o segundo valida escopo de dados e widgets do dashboard. Somente após esses pilotos passarem pelos gates o trabalho deve ser expandido para Documentos Ambientais e demais módulos.

## 13. Decisões que precisam ser fechadas no início

Estas decisões não impedem o inventário, mas bloqueiam a conclusão da Fase 1:

1. Qual storage de objetos será usado pelo `ambientaR-api` para anexos e documentos?
2. Qual infraestrutura de filas/jobs será usada para exports, IA e geoprocessamento?
3. Qual será o formato de tenant/organização e dos vínculos de titular, representante e carteira?
4. Quem poderá atribuir claims e como ocorrerá a aprovação de acessos críticos?
5. Claims alteradas serão efetivas imediatamente ou na próxima renovação da sessão?
6. O modo offline continuará sendo requisito no portal novo ou será removido do escopo?
7. Confirmar que o novo ambiente começará com base própria; caso contrário, aprovar separadamente o escopo de importação histórica.
8. Qual é a estratégia de deploy e rollback conjunto de `new` + `ambientaR-api`?

## 14. Documentos de apoio existentes

- `new/docs/INVENTARIO-COMPLETO-TELAS-ROTAS.md`: inventário normativo das 301 páginas, 275 URLs canônicas e 285 variações de aceite.
- `new/docs/CATALOGO-MENUS-FUNCIONALIDADES-API.md`: catálogo normativo das 188 funcionalidades, menus, submenus, endpoints, claims e critérios.
- `new/PLANO-AUTORIZACAO-CLAIMS.md`: contrato detalhado de sessão e autorização.
- `new/docs/web-dashboard-and-modules-audit.md`: inventário de dashboard, módulos e regras do `web`.
- `new/docs/admin-sidebar-mapping.md`: mapeamento da sidebar.
- `new/docs/auth-flows-mapping.md`: fluxos públicos de autenticação.
- `new/docs/design-system-migration-impact.md`: impacto do design system.
- `web/docs/menu-route-audit.md`: auditoria de menu e rotas.
- `web/docs/auditoria-menus-fase3-checklist.md`: checklist de menus do legado.

Este documento é o plano mestre. O inventário de rotas e o catálogo `FUN-*` são partes obrigatórias dele. Os demais documentos fornecem detalhes de domínio e devem ser ligados às `FUN-*`, sem manter decisões conflitantes baseadas em perfis.
