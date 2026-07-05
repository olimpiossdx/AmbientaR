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
