# Mapeamento da sidebar administrativa do legado

Origem auditada:

- `old/src/lib/navigation-config.ts`
- `old/src/lib/gestao-processos-menu.ts`
- `old/src/lib/ia-menu.ts`
- `old/src/lib/pca-menu.ts`
- `old/src/lib/rca-menu.ts`
- `old/src/lib/georef-menu.ts`
- `old/src/lib/crm-menu.ts`
- `old/src/lib/gov-access-menu.ts`
- `old/src/app/(app)/layout.tsx`
- `old/src/app/(app)/page.tsx`

Destino inicial no `new`:

- `new/src/layouts/admin-navigation.ts`
- `new/src/componentes/app-shell/app-sidebar.tsx`
- `new/src/layouts/authenticated-layout.tsx`
- `new/src/pages/dashboard/dashboard-router-view.tsx`

## Fluxo pós-login

No legado, depois do login a entrada principal é `/`, dentro de `old/src/app/(app)/page.tsx`. Essa página carrega `DashboardRouterView`, que seleciona o dashboard por perfil.

No `new`, `/` redireciona para `/app`, e `/app/` renderiza `HomePage`, que chama `DashboardRouterView`. O painel do administrador e supervisor já entra por `AdminDashboard`.

## Estado da implementação no `new`

- O dashboard pós-login existe no `new/src/pages/dashboard`.
- A sidebar agora aceita grupos aninhados.
- A navegação foi extraída para `new/src/layouts/admin-navigation.ts`.
- Itens já migrados e navegáveis: `Painel` (`/app`) e `Catálogo UI` (`/app/exemplos`).
- Itens legados ficam visíveis e desativados até a respectiva rota existir no Vite.
- O menu é filtrado por `user.role`, preservando a matriz de permissões do legado como ponto de partida.
- Revisão visual posterior: a foto da sidebar administrativa mostra 22 módulos de topo. A configuração do `new` foi ajustada para manter esses módulos como entradas próprias, mesmo quando a rota ainda não foi localizada no legado auditado.

## Mapa funcional da sidebar

### Módulos de topo esperados pela foto

1. Acessos Governamentais
2. Agenda
3. AmbBot
4. Cadastro
5. Comunicação interna
6. Documentos Ambientais
7. Estudos Técnicos
8. Ferramentas do Sistema
9. Financeiro
10. Financiamento Agrário
11. Fiscal Ambiental Digital
12. Georeferenciamento
13. Gestão de Projetos e Processos
14. Inteligência Ambiental
15. Minha área RH
16. Minha Carteira
17. Multas e Defesas
18. Ofícios
19. Recursos Humanos
20. Vendas & CRM
21. Vistoria Técnica
22. Webmail

Observação: `Painel` continua no `new` como entrada pós-login (`/app`), porque é a rota protegida inicial do novo app.

### Entradas gerais

| Menu | Rotas / funcionalidades | Perfis principais | Status no `new` |
| --- | --- | --- | --- |
| Painel | `/` | todos os perfis operacionais | Migrado para `/app` |
| Minha Carteira | `/carteira` | consultor-representante, cliente, cliente autônomo, admin | Mapeado, pendente rota |
| Agenda | `/calendar` | admin, técnico, financeiro, gestor, cliente, representante, supervisor, vendas, fauna, advogado | Mapeado, pendente rota |

### Financeiro

| Funcionalidade | Rota legada |
| --- | --- |
| Acesso Bancário | `/bank-access` |
| Clientes | `/clients` |
| Contratos | `/contracts` |
| Contratos Plataforma | `/financial/platform-subscription-contracts` |
| Contratos-Fornecedores | `/contracts-suppliers` |
| Curva ABC | `/financial/abc-curve` |
| Bens e Patrimônio | `/financial/bens-patrimonio` |
| DRE Contábil | `/financial/dre-contabil` |
| Faturas | `/invoices` |
| Fornecedores | `/suppliers` |
| Lançamentos de Caixa | `/cash-flow` |
| NFe Nacional | link externo via `/external` |
| Orçamentos e Propostas | `/commercial-proposals` |
| Painel Financeiro | `/financial/painel` |
| Projetos & ROI | `/financial/projetos-roi` |
| Fluxo de Caixa Projetado | `/financial/fluxo-projetado` |
| Conciliação Bancária | `/financial/conciliacao` |
| Debug PIX Assinatura | `/financial/billing-debug` |
| Curva ABC Serviços | `/financial/abc-servicos` |
| Curva ABC Fornecedores | `/financial/abc-fornecedores` |
| Orçamento Anual | `/financial/orcamento` |
| Exportação Contábil | `/financial/export-contabil` |
| Assistente Financeiro (IA) | `/studies/assistant?tipo=financeiro` |
| Tabela de Serviços | `/services` |

### Cadastro

| Funcionalidade | Rota legada |
| --- | --- |
| Usuários | `/users` |
| Empreendedores | `/empreendedores` |
| Empreendimentos | `/projects` |
| Empresas | `/responsible-company` |

### Documentos Ambientais

| Funcionalidade | Rota legada |
| --- | --- |
| CAR | `/car` |
| Condicionantes | `/compliance` |
| CTF/IBAMA | `/ctf-ibama` |
| DAIA's | `/intervencoes` |
| Fauna | `/fauna` |
| Licenças | `/licenses` |
| TAC - Termo de Ajust. de Conduta | `/tacs` |
| MTR-Declaração | `/mtr-declaracao` |
| Pasta do cliente | `/documentos-ambientais/pasta-cliente` |
| Monitoramento de Outorga / Lançamento Manual | `/monitoring/manual` |
| Monitoramento de Outorga / Telemetria | `/monitoring/telemetric` |
| Outorgas | `/outorgas` |
| Usos Insignificantes | `/usos-insignificantes` |

### Multas, Vistoria e Gestão de Processos

| Grupo | Funcionalidade | Rota legada |
| --- | --- | --- |
| Multas e Defesas | Consultar multas e defesas | `/multas-defesas` |
| Multas e Defesas | Nova multa / processo | `/multas-defesas/nova` |
| Vistoria Técnica | Consultar vistorias | `/inspections` |
| Vistoria Técnica | Nova vistoria | `/inspections/new` |
| Vistoria Técnica | Relatórios de Campo | `/inspections/reports` |
| Gestão de Projetos e Processos | Projetos | `/gestao-processos/projetos` |
| Gestão de Projetos e Processos | Fluxo de Processos | `/gestao-processos/fluxo` |
| Gestão de Projetos e Processos | Tarefas | `/gestao-processos/tarefas` |
| Gestão de Projetos e Processos | Indicadores de Prazos / Resumo | `/gestao-processos/indicadores` |
| Gestão de Projetos e Processos | Indicadores de Prazos / Gráfico de Análise | `/gestao-processos/indicadores/analise` |

### IA

| Funcionalidade | Rota legada |
| --- | --- |
| Águas / MIRA-IGAM | `/studies/assistant?tipo=mira` |
| Fiscal Ambiental Digital | `/fiscal-ambiental` |
| Análise Geoespacial (IA) | `/analise-ambiental` |
| Análise Socioambiental | `/studies/analise-socioambiental` |
| Cruzamento de dados | `/studies/assistant?tipo=mcp` |
| Legislação e estudos | `/studies/assistant?tipo=geral` |
| Relatórios de IA | `/reporting` |
| Síntese de texto | `/studies/assistant?tipo=rag` |
| Automações IA | `/ai-lab/automations` |

### Estudos Técnicos

| Funcionalidade | Rota legada |
| --- | --- |
| Programa de Educação Ambiental | `/studies/educacao-ambiental` |
| Programa de Ação Emergencial | `/studies/acao-emergencial` |
| EIA/RIMA | `/studies/eia-rima` |
| Estudo de Cavidades | `/studies/cavidades` |
| Estudos de Fauna | `/studies/fauna` |
| IDE-SisemaNet | `/studies/ide-sisemanet` |
| Inventário Florestal | `/studies/inventario` |
| Coleta de campo | `/coleta-campo` |
| LAS-RAS | `/studies/las-ras` |
| Reanálise | `/studies/reanalise` |
| Procuração | `/studies/procuracao` |
| Mapas | `/studies/mapas` |
| Memorial Descritivo | `/studies/memorial-descritivo` |
| Outorgas (processos) / Processos | `/studies/outorgas` |
| Outorgas (processos) / Nova outorga | `/studies/outorgas/new` |
| PCA / Lista de PCAs | `/studies/pca` |
| PCA / Listagens A-H | `/studies/pca/new?listagem=A` até `H` |
| PIA | `/studies/pia` |
| PRADA | `/studies/prada` |
| Barragens / Visão geral | `/studies/barragens` |
| Barragens / Projeto técnico | `/studies/barragem` |
| Barragens / Segurança e emergência | `/studies/seguranca-barragens` |
| Barragens / Piscinão off-stream | `/studies/piscinao-off-stream` |
| PTRF | `/studies/ptrf` |
| RCA / Lista de RCAs | `/studies/rca` |
| RCA / Listagens A-H | `/studies/rca/new?listagem=A` até `H` |
| Relatórios Diversos / Visão geral | `/studies/relatorios-diversos` |
| Relatórios Diversos / Carvão vegetal | `/studies/relatorios-diversos/carvao-vegetal` |
| Relatórios Diversos / PTRF / PRAD | `/studies/relatorios-diversos/ptrf-prad` |
| Relatórios Diversos / Transporte de resíduos | `/studies/relatorios-diversos/transporte-residuos` |
| MTR-MG (resíduos) | `/studies/mtr` |
| Compensação Ambiental / Visão geral | `/studies/compensacao-ambiental` |
| Compensação Ambiental / Espécies protegidas | `/studies/compensacao-ambiental/especies` |
| Compensação Ambiental / SNUC | `/studies/compensacao-ambiental/snuc` |
| Compensação Ambiental / Mata Atlântica | `/studies/compensacao-ambiental/mata-atlantica` |
| Compensação Ambiental / Minerária | `/studies/compensacao-ambiental/mineraria` |
| Compensação Ambiental / Intervenção em APP | `/studies/compensacao-ambiental/app` |
| Reserva Legal | `/studies/reserva-legal` |

### Georeferenciamento, CRM, Governo e Sistema

| Grupo | Funcionalidades |
| --- | --- |
| Georeferenciamento | Painel, Trâmites fundiários, Rural SIGEF/INCRA, Urbano cartório, CAR/SICAR, Histórico CAR, Campo e levantamento, Documentação técnica, Memorial descritivo, Validações, Cartório e registro, Referências normativas |
| Vendas & CRM | Alertas, Configurações CRM, Equipe, Clientes, Mídias Sociais, Oportunidades, Painel de Vendas, Relatórios, Vendas & Propostas |
| Webmail | acesso externo ao webmail |
| Ofícios | `/oficios` |
| Acessos Governamentais | Consulta Intervenção Ambiental, Consulta Licenciamento, Consulta Outorgas, CTF/IBAMA, IDE-SisemaNet-MG, SEI-IBAMA, SEI-MG, SLA-Ecossistemas/MG |
| Ferramentas do Sistema / Empresa e Aparência | Informações da Empresa, Responsáveis Técnicos, Identidade Visual, Aparência |
| Ferramentas do Sistema / Documentos e Modelos | Templates, Laudos, Consultas Técnicas |
| Ferramentas do Sistema / IA, RAG e Integrações | MCP + RAG, Fontes de Conhecimento, Biblioteca IA OneDrive, Integração OneDrive, Ferramentas MCP, Laboratório RAG, Importação IA legado local |
| Ferramentas do Sistema / Administração e Auditoria | Backup de Dados Apagados, Explorador de Arquivos, Log de Auditoria, Canais WhatsApp/IG |

## Plano de refinamento para migração

1. Consolidar shell autenticado:
   - manter `/app` como tela pós-login;
   - manter `DashboardRouterView` como seletor por perfil;
   - evoluir `AppSidebar` para colapso, busca e persistência de largura somente depois que as rotas principais existirem.

2. Ligar dados reais do dashboard:
   - agenda;
   - tarefas internas;
   - aniversários;
   - documentos ambientais;
   - financeiro;
   - CRM;
   - gestão ambiental.

3. Migrar por blocos de maior uso:
   - `Cadastro`, `Documentos Ambientais`, `Agenda`;
   - depois `Gestão de Projetos e Processos`, `Financeiro`, `CRM`;
   - depois `Estudos Técnicos`, `IA`, `Georeferenciamento`, `Sistema`.

4. Para cada bloco:
   - criar rota TanStack em `new/src/router.tsx`;
   - portar tela e serviços mínimos;
   - trocar `legacyHref` por `to`;
   - remover `disabled`;
   - validar permissões por `role`.

5. Critérios de aceite por módulo:
   - item aparece apenas para perfis permitidos;
   - rota abre dentro do layout autenticado;
   - listagem principal carrega;
   - ações críticas do legado estão presentes ou explicitamente escondidas por feature flag;
   - build do `new` passa.
