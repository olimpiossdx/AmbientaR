# Paridade do dashboard antigo e plano modular do `new`

## Escopo auditado

Arquivos-base do `old`:

- `old/src/app/(app)/page.tsx`
- `old/src/app/(app)/layout.tsx`
- `old/src/app/(app)/dashboard-router-view.tsx`
- `old/src/app/(app)/dashboards/*.tsx`
- `old/src/lib/navigation-config.ts`
- `old/src/lib/route-access.ts`
- `old/src/lib/role-guards.ts`
- builders de menu: `gestao-processos-menu`, `pca-menu`, `rca-menu`, `georef-menu`, `ia-menu`, `crm-menu`, `gov-access-menu`, `financeiro-external-menu`.

Arquivos-base do `new`:

- `new/src/router.tsx`
- `new/src/pages/home-page.tsx`
- `new/src/pages/dashboard/*`
- `new/src/layouts/authenticated-layout.tsx`
- `new/src/layouts/admin-navigation.ts`
- `new/src/componentes/app-shell/*`
- `new/src/service/api.ts`
- `new/src/auth/*`

## Funcionamento do dashboard no `old`

Entrada pós-login:

- A rota autenticada inicial é `/`, implementada por `old/src/app/(app)/page.tsx`.
- Ela carrega `DashboardRouterView` sem SSR.
- O layout autenticado guarda acesso por perfil, fecha menu mobile ao navegar, sincroniza notificações, carrega branding, exibe chat/offline/upgrade e aplica regra de rota via `isRoleAllowedForPath`.

Seleção por perfil:

| Perfil | Dashboard antigo | Blocos exibidos |
| --- | --- | --- |
| `admin` | `AdminDashboard` | Hub de Documentos Ambientais mobile, Agenda, Minhas tarefas, Aniversariantes, Financeiro, CRM, Gestão Ambiental |
| `supervisor` | `AdminDashboard` com título de supervisor | Igual ao admin, respeitando dados/permissões |
| `financial` | painel financeiro composto no router | Hub de Documentos Ambientais mobile para rotas permitidas, Agenda, Aniversariantes, Financeiro e CRM |
| `sales` | painel de vendas composto no router | Hub de Documentos Ambientais mobile para rotas permitidas, Agenda, Aniversariantes e CRM |
| `gestor` | painel ambiental composto no router | Hub de Documentos Ambientais mobile, Agenda, Minhas tarefas, Aniversariantes, Gestão Ambiental |
| `technical` | painel ambiental composto no router | Igual a `gestor`, com título de gestão ambiental |
| `advogado` | painel ambiental composto no router | Hub, Agenda, Minhas tarefas, Aniversariantes, Gestão Ambiental |
| `diretor_fauna` | `FaunaDashboard` | Hub de Documentos Ambientais mobile, Agenda, Minhas tarefas, KPIs de fauna e atividade recente |
| `client` | `ClientDashboard` | Onboarding, Hub de Documentos Ambientais mobile, hub de perfil mobile, Agenda, resumo do titular, Gestão Ambiental filtrada |
| `cliente_autonomo` | `ClientDashboard` | Igual ao cliente, mas com escrita permitida em cadastros e operações próprias em regras auxiliares |
| `representative` | `ClientDashboard` | Dados filtrados pelos titulares representados, leitura operacional |
| `consultor_representante` | `ClientDashboard` | Dados filtrados pela carteira aprovada, com escrita operacional delegada em regras específicas |

Dados e regras do dashboard:

- `AgendaWidget`: lê `appointments`. Perfis internos (`admin`, `supervisor`, `financial`, `sales`, `gestor`, `technical`, `diretor_fauna`, `advogado`) veem a agenda inteira; perfis externos combinam eventos públicos não financeiros com eventos próprios (`ownerId == user.uid`). Mostra próximos 30 dias, até 10 itens.
- `OfficeTasksWidget`: usa `officeTasks`. Só aparece para perfis internos de gestão de processos. `admin` e `gestor` veem tudo; demais veem tarefas em que participam.
- `BirthdayWidget`: lê `clients` e mostra aniversariantes do mês.
- `FinancialDashboard`: lê `revenues`, `expenses`, `invoices`, `project_roi_cases`; calcula DRE/caixa sem duplicar Projetos & ROI, gráfico mensal e transações recentes.
- `EnvironmentalDashboard`: lê `projects`, `licenses`, `condicionantes`, `outorgas`, `intervencoes`, `empreendedores`. Calcula licenças válidas/vencidas/vencendo em 30/60/180/360 dias, condicionantes pendentes/atrasadas, outorgas ativas e intervenções. Cards de vencimento e condicionantes abrem dialogs com tabelas filtradas. A tabela de licenças recentes aponta para `/licenses/[id]/edit`.
- `ClientDashboard`: antes de chamar `EnvironmentalDashboard`, resolve escopo por `fetchEmpreendedorIdsForPortalScope` e clientes por titular/representante/consultor. Isso evita que portal externo leia coleções completas.
- `FaunaDashboard`: lê `faunaStudies` e agrupa por inventário, monitoramento, resgate, rascunho, concluído e recentes.

## Regras de menu e rota no `old`

A navegação antiga tem duas camadas:

1. `NavContent` filtra `allNavItems` por `canAccessNavItem`.
2. `layout.tsx` aplica guard de rota com `isRoleAllowedForPath`, impedindo acesso direto por URL quando a rota tem regra conhecida.

Exceções importantes:

- `admin` passa por todos os menus/rotas.
- `consultor_representante` não herda menus de gestor/técnico/supervisor; ele espelha `representative` e ganha extra em `/carteira`. Rotas financeiras são bloqueadas para esse perfil.
- `cliente_autonomo` tem negações explícitas em prefixos como `/ai-lab`, `/studies`, `/georeferenciamento`, `/analise-ambiental`, `/ia/fiscal-ambiental-digital` e `/requests`.
- Rotas não mapeadas no menu não são bloqueadas automaticamente, para não quebrar páginas internas/dinâmicas.
- `/external` compara URL/título com os itens de menu para herdar permissões.

## Matriz de perfis e opções principais do menu antigo

| Perfil | Menus/rotas principais |
| --- | --- |
| `admin` | Painel `/`; Minha Carteira `/carteira`; Financeiro; Cadastro; Documentos Ambientais; Multas e Defesas; Vistoria Técnica; Gestão de Projetos e Processos; IA; Estudos Técnicos; Georeferenciamento; Vendas & CRM; Webmail; Ofícios; Acessos Governamentais; Ferramentas do Sistema; Agenda |
| `supervisor` | Painel; Cadastro; Documentos Ambientais; Multas e Defesas; Vistoria Técnica; Gestão de Projetos e Processos; IA; Estudos Técnicos; Georeferenciamento; Vendas & CRM; Webmail; Ofícios; Acessos Governamentais; Ferramentas do Sistema; Agenda |
| `financial` | Painel; Financeiro; Cadastro; IA somente em itens financeiros/autorizados; Webmail; Ofícios; Acessos Governamentais; Ferramentas do Sistema; Agenda |
| `sales` | Painel; Financeiro parcial; Cadastro; Vendas & CRM; Webmail; Ofícios; Acessos Governamentais; Ferramentas do Sistema; Agenda |
| `gestor` | Painel; Cadastro; Documentos Ambientais; Multas e Defesas; Vistoria Técnica; Gestão de Projetos e Processos; IA; Estudos Técnicos; Georeferenciamento; Webmail; Ofícios; Acessos Governamentais; Ferramentas do Sistema; Agenda |
| `technical` | Painel; Cadastro; Documentos Ambientais; Multas e Defesas; Vistoria Técnica; Gestão de Projetos e Processos; IA; Estudos Técnicos; Webmail; Ofícios; Acessos Governamentais; Ferramentas do Sistema; Agenda |
| `advogado` | Painel; Cadastro; Documentos Ambientais; Multas e Defesas; Vistoria Técnica; Gestão de Projetos e Processos; IA; Estudos Técnicos; Georeferenciamento; Webmail; Ofícios; Acessos Governamentais; Ferramentas do Sistema; Agenda |
| `diretor_fauna` | Painel; Cadastro; Documentos Ambientais, incluindo Fauna; Gestão de Projetos e Processos; IA; Estudos Técnicos nos itens permitidos; Georeferenciamento; Webmail; Ofícios; Acessos Governamentais; Ferramentas do Sistema; Agenda |
| `client` | Painel; Minha Carteira; Financeiro parcial (`contracts`, `invoices`, `commercial-proposals`); Cadastro; Documentos Ambientais; Gestão de Projetos e Processos filtrada; Ofícios; Ferramentas do Sistema/Aparência; Agenda |
| `cliente_autonomo` | Painel; Minha Carteira; Financeiro em `commercial-proposals`; Cadastro; Documentos Ambientais; Gestão de Projetos e Processos filtrada; Ofícios; Ferramentas do Sistema/Aparência; Agenda. Prefixos de IA/Estudos/Georef são negados no guard. |
| `representative` | Painel; Financeiro parcial (`contracts`, `invoices`, `commercial-proposals`); Cadastro; Documentos Ambientais; Gestão de Projetos e Processos filtrada; Ferramentas do Sistema/Aparência; Agenda |
| `consultor_representante` | Painel via dashboard de consultor; Minha Carteira; Documentos/gestão em escopo de representante quando a regra permitir; não vê Financeiro; Cadastro não aparece no menu novo/antigo principal, mas regras permitem escrita operacional delegada onde aplicável |

## Funcionalidades por agrupador do menu antigo

### Financeiro

Rotas: `/bank-access`, `/clients`, `/contracts`, `/financial/platform-subscription-contracts`, `/contracts-suppliers`, `/financial/abc-curve`, `/financial/bens-patrimonio`, `/financial/dre-contabil`, `/invoices`, `/suppliers`, `/cash-flow`, `/external?...NFe`, `/commercial-proposals`, `/financial/painel`, `/financial/projetos-roi`, `/financial/fluxo-projetado`, `/financial/conciliacao`, `/financial/billing-debug`, `/financial/abc-servicos`, `/financial/abc-fornecedores`, `/financial/orcamento`, `/financial/export-contabil`, `/studies/assistant?tipo=financeiro`, `/services`.

Regras: escrita financeira para `admin`/`financial`; vendas lê/escreve partes comerciais; clientes/representantes consultam contratos/faturas/propostas; aprovações e aceite de proposta ficam restritos por helpers como `canApproveContracts` e `canAcceptRejectCommercialProposals`.

### Cadastro

Rotas: `/users`, `/empreendedores`, `/projects`, `/responsible-company`.

Regras: `client` consulta cadastros, mas fica read-only em `isCadastroReadOnlyClienteGestao`; `cliente_autonomo` escreve seus cadastros; `consultor_representante` tem escrita operacional delegada por carteira; importação de empreendedores a partir de clientes é interna (`admin`, `supervisor`, `gestor`, `financial`).

### Documentos Ambientais

Rotas: `/car`, `/compliance`, `/ctf-ibama`, `/intervencoes`, `/fauna`, `/licenses`, `/tacs`, `/mtr-declaracao`, `/documentos-ambientais/pasta-cliente`, `/monitoring/manual`, `/monitoring/telemetric`, `/outorgas`, `/usos-insignificantes`.

Regras: portal externo vê dados filtrados por empreendedor/titular; `representative` é leitura operacional; `cliente_autonomo` e `consultor_representante` têm escritas específicas em CAR/condicionantes/monitoramento conforme helpers.

### Gestão de Projetos e Processos

Rotas: `/gestao-processos/projetos`, `/gestao-processos/fluxo`, `/gestao-processos/tarefas`, `/gestao-processos/indicadores`, `/gestao-processos/indicadores/analise`.

Regras: leitura interna ampla para `admin`, `technical`, `gestor`, `supervisor`, `advogado`, `diretor_fauna`; portal (`client`, `cliente_autonomo`, `representative`, `consultor_representante`) lê projetos/fluxo filtrados. Escrita de processos é `admin`, `technical`, `gestor`. Tarefas são internas; indicadores são `admin` e `gestor`.

### IA e Fiscal Ambiental Digital

Rotas: `/studies/assistant?tipo=mira`, `/ia/fiscal-ambiental-digital`, `/analise-ambiental`, `/studies/analise-socioambiental`, `/studies/assistant?tipo=mcp`, `/studies/assistant?tipo=geral`, `/reporting`, `/studies/assistant?tipo=rag`, `/ai-lab/automations`.

Subrotas FAD: `/ia/fiscal-ambiental-digital/dashboard`, `montar-acervo`, `biblioteca`, `linha-do-tempo`, `comparador`, `evidencias`, `inteligencia`, `fiscalizacao`, `relatorios`, `monitoramento`, `esg`, `configuracoes`, `workspace/novo`, `workspace/[workspaceId]`.

Regras: IA técnica para `admin`, `technical`, `gestor`, `supervisor`, `diretor_fauna`, `advogado`; relatórios de IA também para `financial`; automações só `admin`. Cliente autônomo é bloqueado por prefixo.

### Estudos Técnicos

Rotas principais: Educação Ambiental, Ação Emergencial, EIA/RIMA, Cavidades, Estudos de Fauna, IDE-SisemaNet, Inventário Florestal, Coleta de Campo, LAS-RAS, Reanálise, Procuração, Mapas, Memorial Descritivo, Outorgas de estudo, PCA, PIA, PRADA, Barragens, PTRF, RCA, Relatórios Diversos, MTR-MG, Compensação Ambiental, Reserva Legal.

PCA/RCA: lista geral em `/studies/pca` e `/studies/rca`; criação por Listagem A-H em `/studies/pca/new?listagem=A..H` e `/studies/rca/new?listagem=A..H`.

Regras: módulo interno ambiental (`admin`, `technical`, `gestor`, `supervisor`, `diretor_fauna`, `advogado`) com alguns itens sem `diretor_fauna` quando dependem de PCA/RCA.

### Georeferenciamento

Rotas: `/georeferenciamento`, `/georeferenciamento/processos`, `/georeferenciamento/rural`, `/georeferenciamento/urbano`, `/georeferenciamento/ambiental`, `/georeferenciamento/historico-car`, `/georeferenciamento/campo`, `/georeferenciamento/documentos`, `/georeferenciamento/memorial-descritivo`, `/georeferenciamento/validacoes`, `/georeferenciamento/registro`, `/georeferenciamento/referencias`.

Regras: `admin`, `gestor`, `supervisor`, `diretor_fauna`, `advogado`.

### Vendas & CRM

Rotas: `/crm/alerts`, `/crm/settings`, `/crm/team`, `/crm/clients`, `/social-media`, `/crm/opportunities`, `/crm`, `/crm/reports`, `/crm/proposals`.

Regras: acesso para `admin`, `sales`, `supervisor`, `financial`; escrita de CRM para `admin`, `sales`, `supervisor`.

### Multas, Vistoria, Ofícios, Governo e Sistema

Rotas:

- Multas: `/multas-defesas`, `/multas-defesas/nova`, `/multas-defesas/[id]`.
- Vistoria: `/inspections`, `/inspections/new`, `/inspections/reports`.
- Ofícios: `/oficios`, `/oficios/new`, `/oficios/[id]/edit`.
- Acessos Governamentais: links externos oficiais via `/external`.
- Sistema: `/settings/company`, `/technical-responsible`, `/settings#identidade-visual`, `/settings/appearance`, `/settings/templates`, `/laudos`, `/consultas`, `/configuracoes/mcp-rag`, `/knowledge-sources`, `/ai-lab/cloud-library`, `/settings/onedrive-integration`, `/ai-lab/mcp`, `/ai-lab/rag`, `/settings/ai-local-source`, `/settings/deleted-backups`, `/settings/files`, `/audit-log`, `/canais`.

Regras: multas e vistorias são internas ambientais/advogado; ofícios são leitura para portal e escrita para equipe interna; governo é interno; sistema varia por subrota.

## Estado atual do `new`

Implementado:

- Roteamento TanStack com `/`, `/login`, `/forgot-password`, `/register`, `/app` e `/app/exemplos`.
- `/app` renderiza `DashboardRouterView`.
- Dashboard por perfil existe, mas usa dados estáticos de `dashboard-data.ts`.
- Shell autenticado com sidebar desktop e overlay mobile.
- `admin-navigation.ts` lista muitas rotas legadas, mas quase todas por `legacyHref` e `disabled: true`.
- API base (`api`) e auth service existem para chamadas REST em vez de Firebase direto.

Não implementado ou incompleto:

- Não existe guard de rota equivalente ao `route-access.ts`.
- Não existe matriz modular única de permissões compartilhada entre sidebar, router e API.
- Quase todos os menus do legado são placeholders desabilitados.
- Não há rotas TanStack para os módulos do legado.
- Não há serviços reais do dashboard (`dashboardService`, `financeiroService`, `ambientalService`, `agendaService`, `tarefasService`, `crmService`).
- O `new` não tem filtros de escopo para portal/representante/consultor equivalentes ao Firestore antigo.
- O dashboard do cliente/representante/consultor no `new` virou `EnvironmentalDashboard` genérico; perdeu onboarding, hubs mobile, escopo, resumo do titular e regras de carteira.
- `diretor_fauna` no `new` usa `EnvironmentalDashboard`, mas no `old` usa `FaunaDashboard`.
- `financial` e `sales` no `new` usam métricas mockadas e não carregam agenda, aniversários nem CRM real.
- Responsividade não é equivalente: faltam bottom nav mobile, hub cards mobile de perfil/documentos, sidebar colapsável/resizável e ajustes especiais para `/external`.
- Notificações, badge do app, branding, tema, fila offline, upgrade e chat não foram migrados.

Ponto de atenção: `new/src/layouts/admin-navigation.ts` contém módulos de topo que não aparecem como itens de topo em `old/src/lib/navigation-config.ts` atual, como Comunicação interna, Financiamento Agrário, Minha área RH e Recursos Humanos. Eles podem ser requisitos de produto, mas não são paridade direta do código antigo auditado.

## Padrão modular recomendado para o `new`

Criar `new/src/modules/<modulo>/` para cada agrupador funcional. Cada módulo deve conter suas rotas, componentes, serviços, validações e regras.

Estrutura sugerida:

```txt
new/src/modules/dashboard/
  routes.tsx
  dashboard-router-view.tsx
  services/dashboard-service.ts
  components/
  types.ts
  validation.ts

new/src/modules/<modulo>/
  routes.tsx
  navigation.ts
  permissions.ts
  service.ts
  validation.ts
  pages/
  components/
  types.ts
```

Contratos globais:

- `new/src/modules/navigation/navigation-registry.ts`: agrega itens por módulo.
- `new/src/modules/auth/route-access.ts`: replica `isRoleAllowedForPath`, inclusive aliases e bloqueios por prefixo.
- `new/src/modules/auth/permissions.ts`: fonte única para `UserRole`, grupos de roles e helpers.
- `new/src/service/api.ts`: única entrada HTTP; módulos não devem chamar `fetch` direto.
- `new/src/modules/dashboard/dashboard-service.ts`: endpoints agregados para dashboard, evitando cada widget disparar N chamadas soltas.

## Plano de implementação por módulo

### 1. Base de autorização, rotas e navegação

Objetivo: tornar menu, rota e API coerentes.

Tarefas:

- Criar tipo `UserRole` no `new` com os 12 perfis do `old`.
- Migrar helpers: `isAdminRole`, `isClientePortalRole`, `isConsultorRepresentante`, `canAccessNavItem`, `isRoleAllowedForPath`.
- Implementar aliases do legado (`/autos-infracao-defesa`, `/environmental-company`, `/monitoring`, `/studies`, `/studies/intervencao-ambiental`).
- Implementar bloqueios por prefixo para `cliente_autonomo`.
- Implementar regra especial de `consultor_representante`: espelha representante, não vê Financeiro, ganha `/carteira`.
- Fazer `beforeLoad` das rotas autenticadas validar perfil antes de renderizar.
- Trocar `admin-navigation.ts` por registry modular, onde cada módulo exporta seus próprios itens.

Validações:

- Front: item aparece apenas quando o papel tem acesso; rota direta bloqueada redireciona para `/app` ou tela 403.
- API: todo endpoint deve validar sessão e `role`; rotas com escopo devem validar também ownership/carteira/titular.

### 2. Dashboard core

Objetivo: paridade do `DashboardRouterView` e widgets.

Tarefas:

- Migrar dashboards reais: admin/supervisor, financeiro, vendas, ambiental, cliente, fauna.
- Criar serviços:
  - `GET /dashboard/admin`
  - `GET /dashboard/environmental`
  - `GET /dashboard/client`
  - `GET /dashboard/fauna`
  - `GET /dashboard/financial`
  - `GET /dashboard/crm`
  - `GET /dashboard/agenda`
  - `GET /dashboard/office-tasks`
  - `GET /dashboard/birthdays`
- Substituir `dashboard-data.ts` mockado por DTOs reais.
- Migrar dialogs de vencimento/condicionantes.
- Migrar `DocumentosAmbientaisHubCard` e `ProfileNavigationHubCard` para atalhos mobile.

Validações:

- Front: loading, vazio, erro, dialogs, links de edição e tabelas responsivas.
- API: filtros por papel; portal deve retornar apenas registros ligados aos empreendedores/clientes permitidos.

### 3. Cadastro

Rotas: usuários, empreendedores, empreendimentos, empresas.

Tarefas:

- Criar `modules/cadastro`.
- Migrar listagens, criação/edição e estados read-only.
- Serviços: users, empreendedores, projects, responsible-company.
- Preservar `canWriteCadastro`, `canEditUserInUsersList`, `canWriteTechnicalResponsibles`.

Validações:

- Front: CPF/CNPJ, e-mail, obrigatórios, máscaras, read-only para `client`.
- API: ownership do titular, carteira do consultor, permissões de criação/edição/exclusão, auditoria.

### 4. Documentos Ambientais

Rotas: CAR, condicionantes, CTF/IBAMA, DAIA, fauna, licenças, TAC, MTR, pasta do cliente, monitoramento, outorgas, usos insignificantes.

Tarefas:

- Criar `modules/documentos-ambientais`.
- Migrar cada funcionalidade dentro do agrupador.
- Implementar escopo portal/representante/consultor.
- Reusar contratos de dados do dashboard ambiental.

Validações:

- Front: datas de vencimento, status, anexos, campos obrigatórios e ações read-only.
- API: upload seguro, vínculo com empreendedor/projeto, regras de escrita por role, limites por pacote quando aplicável.

### 5. Gestão de Projetos e Processos

Rotas: projetos, fluxo, tarefas, indicadores.

Tarefas:

- Criar `modules/gestao-processos`.
- Migrar permissões internas/portal.
- Migrar tarefas avulsas e indicadores.
- Serviço deve suportar filtros por status, responsável, projeto, prazo e escopo de portal.

Validações:

- Front: workflow/status, prazos, responsáveis, filtros, leitura portal.
- API: `canWriteGestaoProcessos`, `canAccessOfficeTasks`, `canSeeAllOfficeTasks`, `canAccessGestaoProcessosIndicadores`.

### 6. Financeiro

Rotas: todas do agrupador Financeiro.

Tarefas:

- Criar `modules/financeiro`.
- Migrar contratos, faturas, caixa, fornecedores, propostas, ROI, DRE, conciliação, patrimônio, orçamento, exportação contábil.
- Criar serviço agregado para KPIs do dashboard financeiro.
- Manter NFe como link externo com permissão.

Validações:

- Front: valores BRL, status, anexos, parcelas, aprovações, bloqueios para vendas/cliente.
- API: `admin`/`financial` para caixa e aprovações; `sales` para leitura/escrita comercial restrita; portal apenas seus contratos/faturas/propostas.

### 7. Vendas & CRM

Rotas: alertas, configurações, equipe, clientes, mídias sociais, oportunidades, painel, relatórios, propostas.

Tarefas:

- Criar `modules/crm`.
- Migrar dashboard de CRM, pipeline kanban, oportunidades, relatórios e propostas.
- Serviço do dashboard deve fornecer métricas de oportunidades, leads, propostas e desempenho.

Validações:

- Front: estágios do pipeline, responsáveis, datas, valores e filtros.
- API: acesso `admin`, `sales`, `supervisor`, `financial`; escrita `admin`, `sales`, `supervisor`.

### 8. Estudos Técnicos

Rotas: todos os estudos e submódulos A-H de PCA/RCA.

Tarefas:

- Criar `modules/estudos-tecnicos`.
- Separar submódulos: `pca`, `rca`, `fauna`, `inventario`, `barragens`, `compensacao`, `mapas`, etc.
- Migrar geração/exportação DOCX/PDF e formulários com validação.
- Preservar parâmetros `?listagem=A..H`.

Validações:

- Front: schemas por estudo/listagem, autosave quando existir, anexos, exportação, estados de rascunho/concluído.
- API: geração de documentos, uploads, permissões internas, validação de payload por tipo de estudo.

### 9. IA e Fiscal Ambiental Digital

Rotas: assistentes, análise ambiental/socioambiental, reporting, automações, FAD.

Tarefas:

- Criar `modules/ia` e `modules/fiscal-ambiental-digital`.
- Migrar FAD como submódulo de IA ou manter top-level se produto exigir, mas com rota real `/ia/fiscal-ambiental-digital`.
- Migrar clientes de API FAD para `api`.
- Migrar guards por token/sessão.

Validações:

- Front: workspace obrigatório, seleção de área, status de jobs, downloads e erros long-running.
- API: role, workspace ownership, limites, rate limiting e validação de arquivos/URLs.

### 10. Georeferenciamento

Rotas: painel, processos, rural, urbano, ambiental, histórico CAR, campo, documentos, memorial, validações, registro, referências.

Tarefas:

- Criar `modules/georeferenciamento`.
- Migrar hub e submódulos.
- Integrar com CAR/SICAR, memorial e validações.

Validações:

- Front: arquivos KML/SHP/geojson, coordenadas, área, sistema de referência.
- API: validação espacial, ownership, upload e limites de processamento.

### 11. Multas, Vistoria e Ofícios

Tarefas:

- Criar módulos separados: `multas-defesas`, `vistoria-tecnica`, `oficios`.
- Migrar rotas de listagem, criação, edição e geração de documentos.
- Preservar `canManageAutoInfracaoDefesa`, `isOficioReadOnlyRole`, `canApproveOficio`, `canWriteOficioDraft`.

Validações:

- Front: campos legais obrigatórios, prazos, anexos, numeração/aprovação de ofício.
- API: advogado/equipe interna para multas; portal read-only em ofícios; aprovação restrita.

### 12. Ferramentas do Sistema, Governo e External

Tarefas:

- Criar `modules/sistema` e `modules/external`.
- Migrar settings, templates, laudos, consultas, RAG, OneDrive, auditoria, canais.
- Implementar `/external` com validação de destino permitido, título e modo nova aba/embed.

Validações:

- Front: erro quando site externo não permite embed, fallback para nova aba.
- API: allowlist de URLs oficiais, permissões por subrota, proteção admin.

## Ajustes de responsividade necessários

Para paridade com o `old`:

- Reintroduzir bottom navigation mobile com itens: Painel, Agenda, Documentos Ambientais dinâmico, Gestão/Cadastro e Perfil.
- Criar atalhos mobile por perfil usando hubs (`DocumentosAmbientaisHubCard`, `ProfileNavigationHubCard`).
- Implementar sidebar colapsável/resizável em desktop ou documentar decisão de produto para não migrar.
- Corrigir layout especial de `/external` para ocupar área total sem scroll duplo.
- Garantir que tabelas tenham colunas ocultáveis em mobile e links alternativos como no antigo.
- Manter header com notificações reais, menu de usuário, branding e estado de sessão.

## Ordem recomendada de execução

1. Base: roles, route guard, navigation registry modular.
2. Dashboard core real: widgets e serviços agregados.
3. Cadastro + Documentos Ambientais, porque alimentam o painel e o portal.
4. Agenda + Gestão de Processos/Tarefas.
5. Financeiro + CRM.
6. Estudos Técnicos.
7. IA/FAD e Georeferenciamento.
8. Multas, Vistorias, Ofícios, Sistema e External.

## Critérios de aceite gerais

- Cada perfil vê o mesmo dashboard funcional do `old`, com dados reais ou endpoints equivalentes.
- Cada item de menu tem rota real, placeholder explicitamente controlado por feature flag ou é removido.
- Sidebar, roteador e API usam a mesma fonte de permissões.
- Portal/representante/consultor nunca acessam coleção completa; tudo é filtrado por titular, empreendedor, cliente ou carteira aprovada.
- `cliente_autonomo` respeita os bloqueios por prefixo.
- `consultor_representante` não acessa Financeiro e só recebe as permissões extras documentadas.
- Build do `new` passa.
- Testes mínimos cobrem `getNavigationItemsForRole`, route guard por perfil e DTOs do dashboard.
