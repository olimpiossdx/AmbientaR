# Refinamento: painel do administrador no `new`

## Contexto

A tela exibida logo após o login hoje cai em `/app`. No projeto antigo, essa entrada renderiza `DashboardRouterView`, que escolhe o painel por perfil. Para `admin` e `supervisor`, o painel principal é `AdminDashboard`, composto por:

- cabeçalho do painel;
- hub de documentos ambientais;
- agenda;
- tarefas internas;
- aniversários;
- visão financeira;
- visão de vendas/CRM;
- visão de gestão ambiental.

No `new`, a rota `/app` já está protegida pelo TanStack Router, mas ainda exibe uma home provisória. O layout autenticado também ainda usa navegação superior simples, sem o menu lateral do painel.

## Plano de migração

1. Criar um `DashboardRouterView` no `new` para centralizar a decisão por `role`.
2. Implementar o primeiro `AdminDashboard` nativo do `new`, com dados de preparação enquanto os serviços reais não são plugados.
3. Substituir a home pós-login por esse router, preservando `/app` como entrada inicial.
4. Refinar `AuthenticatedLayout` para usar header + menu lateral, alinhado ao painel antigo.
5. Separar os pontos de integração futura:
   - documentos ambientais;
   - agenda;
   - tarefas internas;
   - financeiro;
   - CRM;
   - gestão ambiental.

## Auditoria de componentes

Diretriz: toda a virada deve usar componentes do `new/src/componentes`. Quando um bloco ainda não existir no catálogo, ele deve ser reportado aqui antes de virar implementação definitiva.

### Componentes do `new` já disponíveis

- `Button`: ações de header, menu mobile, logout e comandos dos widgets.
- `Avatar`: identificação do usuário logado.
- `Badge`: perfil do usuário, status de processos, status de tarefas e indicadores.
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`: cards de métricas, widgets e hubs.
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`: listas recentes e detalhes de processos.
- `Sidebar`: base do menu lateral.
- `Dialog`: disponível para detalhar licenças/condicionantes, equivalente ao dashboard antigo.
- `Skeleton`: disponível para estados de carregamento.
- `DropdownMenu`: disponível, mas com API diferente da usada no `web` antigo.
- `Chart`: disponível para substituir gráficos financeiros/CRM quando os dados reais forem plugados.
- `Tooltip`, `Popover`, `Sheet`, `ScrollArea`, `Separator`, `Tabs`: disponíveis para refinamentos de navegação e filtros.
- `PageHeader`: criado no catálogo para cabeçalhos de página do painel.
- `MetricGrid`: criado no catálogo para cards de indicadores.
- `HubGrid`: criado no catálogo para hubs de acesso rápido.
- `TaskList`: criado no catálogo para agenda, tarefas e listas operacionais compactas.
- `ProcessTable`: criado no catálogo para tabelas de processos/licenças recentes.
- `AppSidebar`: criado no catálogo para navegação lateral autenticada.
- `AppHeader`: criado no catálogo para topo do shell autenticado.
- `AppUserMenu`: criado no catálogo para ações de usuário.
- `NotificationMenu`: criado no catálogo para notificações, ainda aguardando dados reais.

### Blocos usados no painel antigo que ainda precisam virar componentes próprios

- `DocumentosAmbientaisHubCard`: não existe no `new`. Deve virar componente próprio usando `Card`, `Button`, `Badge` e ícones.
- `NavContent`: a navegação lateral agora usa `AppSidebar`, mas ainda falta migrar a matriz completa de rotas/permissões do antigo.
- `SidebarProvider`, `SidebarInset`, `SidebarTrigger`, `SidebarResizeHandle`: o `new` tem `Sidebar` + `AppSidebar`. Se quisermos paridade com recolhimento, resize persistido e inset dedicado, precisamos ampliar o componente `sidebar`.
- `AgendaWidget`: não existe como componente no `new`; deve ser migrado usando `Card`, `Badge`, `Button` e `Skeleton`.
- `OfficeTasksWidget`: não existe como componente no `new`; deve ser migrado usando `Card`, `Badge`, `Button` e `Skeleton`.
- `BirthdayWidget`: não existe como componente no `new`; deve ser migrado usando `Card` e `Skeleton`.
- `FinancialDashboard`: não existe no `new`; precisa de componente de dashboard com `Card`, `Table`, `Chart` e serviço de estatísticas.
- `CrmDashboard`: não existe no `new`; precisa de componente de dashboard com `Card`, `Table` e `Chart`.
- `EnvironmentalDashboard`: existe apenas como primeira versão local em `pages/dashboard`; deve virar módulo/componente de dashboard com serviço real.
- `DocumentDetailDialog`: no antigo os detalhes ficam embutidos em `EnvironmentalDashboard`; no `new`, deve virar componente dedicado usando `Dialog` + `Table`.
- `ThemeToggle`, `OfflineQueueBadge`, `UpgradeButton`, `ChatWidget`: não existem no catálogo do `new`. Devem ser avaliados separadamente, porque dependem de infraestrutura ainda não migrada.

### Uso provisório que deve ser refinado antes da virada definitiva

- Os blocos antes concentrados em `new/src/pages/dashboard/dashboard-ui.tsx` foram migrados para `new/src/componentes`.
- `new/src/layouts/authenticated-layout.tsx` agora delega o shell para `AppSidebar`, `AppHeader`, `AppUserMenu` e `NotificationMenu`.
- Os dados em `new/src/pages/dashboard/dashboard-data.ts` são de preparação. A versão definitiva deve consumir serviços do `new/src/service`.
- Os itens de menu desabilitados no layout representam módulos não roteados ainda. Antes da virada, cada item deve apontar para rota real ou ser removido por feature flag/permissão.

## Plano de refinamento por componentes

1. Migrar os widgets do painel antigo um por um: `DocumentosAmbientaisHubCard`, `AgendaWidget`, `OfficeTasksWidget`, `BirthdayWidget`.
2. Migrar os dashboards de domínio com contratos de dados: financeiro, CRM e ambiental.
3. Evoluir o menu lateral com rotas/permissões reais, substituindo os itens desabilitados.
4. Avaliar se precisamos de paridade completa do `SidebarProvider`, `SidebarInset`, `SidebarTrigger` e `SidebarResizeHandle`.
5. Trocar os dados mock por chamadas reais e validar o pós-login com usuário `admin`.

## Critérios de aceite desta etapa

- Após login, `/app` mostra o painel do administrador quando `role` for `admin` ou `supervisor`.
- Perfis ambientais (`gestor`, `technical`, `advogado`) veem painel de gestão ambiental.
- Perfis financeiros e comerciais veem painéis focados em seus módulos.
- Perfis ainda sem dashboard dedicado recebem uma tela de fallback clara.
- O layout autenticado tem menu lateral persistente em desktop e navegação superior de sessão.

## Próximas etapas

1. Trocar os dados de preparação por chamadas reais da API.
2. Migrar os widgets legados individualmente, começando por agenda e documentos ambientais.
3. Criar contratos de serviço para estatísticas financeiras, CRM e gestão ambiental.
4. Adicionar permissões de rota equivalentes ao `route-access` antigo.
5. Cobrir o `DashboardRouterView` com testes por perfil.
