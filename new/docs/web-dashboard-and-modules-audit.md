# Auditoria do dashboard `web` e plano modular para o `new`

Data da auditoria: 2026-07-08.

## Fontes verificadas

- `web/src/app/(app)/page.tsx`
- `web/src/app/(app)/layout.tsx`
- `web/src/app/(app)/dashboard-router-view.tsx`
- `web/src/app/(app)/dashboards/*`
- `web/src/components/nav-content.tsx`
- `web/src/lib/navigation-config.ts`
- `web/src/lib/route-access.ts`
- `web/src/lib/role-guards.ts`
- Menus auxiliares: `gov-access-menu`, `gestao-processos-menu`, `ia-menu`, `pca-menu`, `rca-menu`, `georef-menu`, `crm-menu`, `financeiro-menu-paths`.
- `new/src/router.tsx`
- `new/src/layouts/authenticated-layout.tsx`
- `new/src/modules/auth/*`
- `new/src/modules/navigation/navigation-registry.ts`
- `new/src/modules/dashboard/dashboard-registry.tsx`
- `new/src/pages/dashboard/*`

Relatorios completos gerados do `web`:

- `web/docs/auditoria-menus-fase3-checklist.md`
- `web/docs/menu-route-audit.md`

## Resumo do legado `web`

O dashboard autenticado do `web` entra por `/`, carrega `DashboardRouterView` sem SSR e escolhe a tela por `user.role`. O layout autenticado tambem aplica:

- filtro de menu por `canAccessNavItem`;
- guard de rota por `isRoleAllowedForPath`;
- bottom navigation mobile;
- atalho mobile dinamico para Documentos Ambientais;
- sidebar desktop colapsavel/redimensionavel;
- tratamento especial de `/external`;
- notificacoes, branding, chat, upgrade, fila offline e tema.

O auditor encontrou:

| Medida | Resultado |
| --- | ---: |
| Itens visiveis para `admin` | 101 |
| Itens visiveis para `gestor` | 63 |
| Itens visiveis para `supervisor` | 66 |
| Itens visiveis para `technical` | 62 |
| Itens visiveis para `sales` | 14 |
| Itens visiveis para `financial` | 34 |
| Itens visiveis para `client` | 24 |
| Itens visiveis para `cliente_autonomo` | 22 |
| Itens visiveis para `representative` | 22 |
| Itens visiveis para `diretor_fauna` | 20 |
| Itens visiveis para `advogado` | 58 |
| Rotas cobertas por menu/alias no `web` | 284 |
| Rotas dinamicas sem entrada direta no menu | 3 |
| Rotas estaticas sem entrada direta no menu | 9 |

## Dashboard por perfil no `web`

| Perfil | Dashboard renderizado | Funcionamento principal |
| --- | --- | --- |
| `admin` | `AdminDashboard` | Hub de Documentos Ambientais, agenda, tarefas, aniversarios, financeiro, CRM e gestao ambiental. |
| `supervisor` | `AdminDashboard` | Mesmo layout do admin, respeitando dados/permissoes de supervisor. |
| `financial` | Composicao financeira | Hub de Documentos Ambientais, agenda, aniversarios, financeiro e CRM. |
| `sales` | Composicao comercial | Hub de Documentos Ambientais, agenda, aniversarios e CRM. |
| `gestor` | Composicao ambiental | Hub de Documentos Ambientais, agenda, tarefas, aniversarios e `EnvironmentalDashboard`. |
| `technical` | Composicao ambiental | Igual ao gestor, com permissoes de tecnico. |
| `advogado` | Composicao ambiental | Hub, agenda, tarefas, aniversarios e ambiental com titulo proprio. |
| `diretor_fauna` | `FaunaDashboard` | Agenda, tarefas, hub e KPIs de estudos de fauna. |
| `client` | `ClientDashboard` | Escopo filtrado por titular/empreendedor, onboarding e dados ambientais. |
| `cliente_autonomo` | `ClientDashboard` | Igual ao cliente, com escrita permitida em cadastros e operacoes proprias. |
| `representative` | `ClientDashboard` | Escopo filtrado pelos titulares representados; leitura operacional. |
| `consultor_representante` | `ClientDashboard` | Escopo por carteira aprovada; espelha representante e ganha `Minha Carteira`. |

## Regras de acesso principais

- `admin` tem acesso total a menus, rotas e acoes.
- Menus sao filtrados por `roles` em `allNavItems`.
- Rotas conhecidas sao bloqueadas no layout quando o papel nao esta autorizado.
- Rotas nao mapeadas no menu nao sao bloqueadas automaticamente, para evitar quebrar rotas internas/dinamicas.
- `/external` compara destino/titulo com entradas do menu e herda as permissoes desses itens.
- `cliente_autonomo` e bloqueado nos prefixos: `/ai-lab`, `/studies`, `/georeferenciamento`, `/analise-ambiental`, `/ia/fiscal-ambiental-digital`, `/requests`.
- `consultor_representante` espelha `representative`, recebe extra em `/carteira` e nao acessa Financeiro.
- Oficios tem leitura para portal e escrita apenas para equipe interna.
- Dashboard de cliente/representante/consultor nunca deve ler colecoes completas; precisa filtrar por titular, empreendedor ou carteira.

## Modulos e funcionalidades implementadas no `web`

### Painel e carteira

| Funcionalidade | Rota |
| --- | --- |
| Painel | `/` |
| Minha Carteira | `/carteira` |
| Detalhe de carteira | `/carteira/[clientId]` |

### Agenda

| Funcionalidade | Rota |
| --- | --- |
| Agenda | `/calendar` |

### Financeiro

| Funcionalidade | Rota |
| --- | --- |
| Acesso Bancario | `/bank-access` |
| Clientes | `/clients` |
| Contratos | `/contracts` |
| Contratos Plataforma | `/financial/platform-subscription-contracts` |
| Contratos-Fornecedores | `/contracts-suppliers` |
| Curva ABC | `/financial/abc-curve` |
| Bens e Patrimonio | `/financial/bens-patrimonio` |
| DRE Contabil | `/financial/dre-contabil` |
| Faturas | `/invoices` |
| Fornecedores | `/suppliers` |
| Lancamentos de Caixa | `/cash-flow` |
| NFe Nacional | `/external?...NFe` |
| Orcamentos e Propostas | `/commercial-proposals` |
| Painel Financeiro | `/financial/painel` |
| Projetos & ROI | `/financial/projetos-roi` |
| Fluxo de Caixa Projetado | `/financial/fluxo-projetado` |
| Conciliacao Bancaria | `/financial/conciliacao` |
| Debug PIX Assinatura | `/financial/billing-debug` |
| Curva ABC Servicos | `/financial/abc-servicos` |
| Curva ABC Fornecedores | `/financial/abc-fornecedores` |
| Orcamento Anual | `/financial/orcamento` |
| Exportacao Contabil | `/financial/export-contabil` |
| Assistente Financeiro | `/studies/assistant?tipo=financeiro` |
| Tabela de Servicos | `/services` |

### Cadastro

| Funcionalidade | Rota |
| --- | --- |
| Usuarios | `/users` |
| Empreendedores | `/empreendedores` |
| Empreendimentos | `/projects` |
| Empresas | `/responsible-company` |

### Documentos Ambientais

| Funcionalidade | Rota |
| --- | --- |
| CAR | `/car` |
| Condicionantes | `/compliance` |
| CTF/IBAMA | `/ctf-ibama` |
| DAIA's | `/intervencoes` |
| Fauna | `/fauna` |
| Licencas | `/licenses` |
| TAC | `/tacs` |
| MTR-Declaracao | `/mtr-declaracao` |
| Pasta do cliente | `/documentos-ambientais/pasta-cliente` |
| Monitoramento de Outorga: lancamento manual | `/monitoring/manual` |
| Monitoramento de Outorga: telemetria | `/monitoring/telemetric` |
| Outorgas | `/outorgas` |
| Usos Insignificantes | `/usos-insignificantes` |

### Multas e Defesas

| Funcionalidade | Rota |
| --- | --- |
| Consultar multas e defesas | `/multas-defesas` |
| Nova multa/processo | `/multas-defesas/nova` |
| Detalhe | `/multas-defesas/[id]` |

### Vistoria Tecnica

| Funcionalidade | Rota |
| --- | --- |
| Consultar vistorias | `/inspections` |
| Nova vistoria | `/inspections/new` |
| Relatorios de campo | `/inspections/reports` |
| Editar vistoria | `/inspections/[id]/edit` |

### Gestao de Projetos e Processos

| Funcionalidade | Rota |
| --- | --- |
| Hub/visao geral | `/gestao-processos` |
| Projetos | `/gestao-processos/projetos` |
| Detalhe do projeto | `/gestao-processos/projetos/[id]` |
| Fluxo de Processos | `/gestao-processos/fluxo` |
| Tarefas | `/gestao-processos/tarefas` |
| Indicadores: resumo | `/gestao-processos/indicadores` |
| Indicadores: grafico de analise | `/gestao-processos/indicadores/analise` |
| Planilha/importacao | `/gestao-processos/planilha` |

### IA e Fiscal Ambiental Digital

| Funcionalidade | Rota |
| --- | --- |
| Aguas / MIRA-IGAM | `/studies/assistant?tipo=mira` |
| Fiscal Ambiental Digital | `/ia/fiscal-ambiental-digital` |
| FAD: dashboard | `/ia/fiscal-ambiental-digital/dashboard` |
| FAD: montar acervo | `/ia/fiscal-ambiental-digital/montar-acervo` |
| FAD: biblioteca | `/ia/fiscal-ambiental-digital/biblioteca` |
| FAD: linha do tempo | `/ia/fiscal-ambiental-digital/linha-do-tempo` |
| FAD: comparador | `/ia/fiscal-ambiental-digital/comparador` |
| FAD: evidencias | `/ia/fiscal-ambiental-digital/evidencias` |
| FAD: inteligencia | `/ia/fiscal-ambiental-digital/inteligencia` |
| FAD: fiscalizacao | `/ia/fiscal-ambiental-digital/fiscalizacao` |
| FAD: relatorios | `/ia/fiscal-ambiental-digital/relatorios` |
| FAD: monitoramento | `/ia/fiscal-ambiental-digital/monitoramento` |
| FAD: auditoria ESG | `/ia/fiscal-ambiental-digital/esg` |
| FAD: configuracoes | `/ia/fiscal-ambiental-digital/configuracoes` |
| FAD: workspace novo | `/ia/fiscal-ambiental-digital/workspace/novo` |
| FAD: workspace | `/ia/fiscal-ambiental-digital/workspace/[workspaceId]` |
| Analise Geoespacial | `/analise-ambiental` |
| Analise Socioambiental | `/studies/analise-socioambiental` |
| Cruzamento de dados | `/studies/assistant?tipo=mcp` |
| Legislacao e estudos | `/studies/assistant?tipo=geral` |
| Relatorios de IA | `/reporting` |
| Sintese de texto | `/studies/assistant?tipo=rag` |
| Automacoes IA | `/ai-lab/automations` |
| Biblioteca IA OneDrive | `/ai-lab/cloud-library` |
| Ferramentas MCP | `/ai-lab/mcp` |
| Laboratorio RAG | `/ai-lab/rag` |

### Estudos Tecnicos

| Funcionalidade | Rota |
| --- | --- |
| Programa de Educacao Ambiental | `/studies/educacao-ambiental` |
| Programa de Acao Emergencial | `/studies/acao-emergencial` |
| EIA/RIMA | `/studies/eia-rima` |
| Estudo de Cavidades | `/studies/cavidades` |
| Estudos de Fauna | `/studies/fauna` |
| IDE-SisemaNet | `/studies/ide-sisemanet` |
| Inventario Florestal | `/studies/inventario` |
| Coleta de campo | `/coleta-campo` |
| LAS-RAS | `/studies/las-ras` |
| Reanalise | `/studies/reanalise` |
| Procuracao | `/studies/procuracao` |
| Mapas | `/studies/mapas` |
| Memorial Descritivo | `/studies/memorial-descritivo` |
| Outorgas: processos | `/studies/outorgas` |
| Outorgas: nova | `/studies/outorgas/new` |
| PCA: lista | `/studies/pca` |
| PCA: listagens A-H | `/studies/pca/new?listagem=A..H` |
| PIA | `/studies/pia` |
| PRADA | `/studies/prada` |
| Barragens: visao geral | `/studies/barragens` |
| Barragens: projeto tecnico | `/studies/barragem` |
| Barragens: seguranca e emergencia | `/studies/seguranca-barragens` |
| Piscinao off-stream | `/studies/piscinao-off-stream` |
| PTRF | `/studies/ptrf` |
| RCA: lista | `/studies/rca` |
| RCA: listagens A-H | `/studies/rca/new?listagem=A..H` |
| Relatorios diversos: visao geral | `/studies/relatorios-diversos` |
| Relatorios diversos: carvao vegetal | `/studies/relatorios-diversos/carvao-vegetal` |
| Relatorios diversos: PTRF/PRAD | `/studies/relatorios-diversos/ptrf-prad` |
| Relatorios diversos: transporte de residuos | `/studies/relatorios-diversos/transporte-residuos` |
| MTR-MG | `/studies/mtr` |
| Compensacao Ambiental: visao geral | `/studies/compensacao-ambiental` |
| Compensacao Ambiental: especies | `/studies/compensacao-ambiental/especies` |
| Compensacao Ambiental: SNUC | `/studies/compensacao-ambiental/snuc` |
| Compensacao Ambiental: Mata Atlantica | `/studies/compensacao-ambiental/mata-atlantica` |
| Compensacao Ambiental: mineraria | `/studies/compensacao-ambiental/mineraria` |
| Compensacao Ambiental: APP | `/studies/compensacao-ambiental/app` |
| Reserva Legal | `/studies/reserva-legal` |

### Georeferenciamento

| Funcionalidade | Rota |
| --- | --- |
| Painel | `/georeferenciamento` |
| Tramites fundiarios | `/georeferenciamento/processos` |
| Rural SIGEF/INCRA | `/georeferenciamento/rural` |
| Urbano cartorio | `/georeferenciamento/urbano` |
| CAR/SICAR | `/georeferenciamento/ambiental` |
| Historico CAR | `/georeferenciamento/historico-car` |
| Campo e levantamento | `/georeferenciamento/campo` |
| Documentacao tecnica | `/georeferenciamento/documentos` |
| Memorial descritivo | `/georeferenciamento/memorial-descritivo` |
| Validacoes | `/georeferenciamento/validacoes` |
| Cartorio e registro | `/georeferenciamento/registro` |
| Referencias normativas | `/georeferenciamento/referencias` |

### Vendas & CRM

| Funcionalidade | Rota |
| --- | --- |
| Alertas e notificacoes | `/crm/alerts` |
| Configuracoes CRM | `/crm/settings` |
| Equipe e desempenho | `/crm/team` |
| Gestao de clientes | `/crm/clients` |
| Midias sociais | `/social-media` |
| Oportunidades e pipeline | `/crm/opportunities` |
| Painel de vendas | `/crm` |
| Relatorios e analises | `/crm/reports` |
| Vendas e propostas | `/crm/proposals` |

### Ofícios

| Funcionalidade | Rota |
| --- | --- |
| Lista de oficios | `/oficios` |
| Novo oficio | `/oficios/new` |
| Editar oficio | `/oficios/[id]/edit` |

### Acessos Governamentais

Todos usam `/external` com URL oficial allowlisted pelo menu.

| Funcionalidade | Destino |
| --- | --- |
| Consulta Intervencao Ambiental | `sistemas.meioambiente.mg.gov.br/consulta-intervencao` |
| Consulta Licenciamento | `sistemas.meioambiente.mg.gov.br/licenciamento/site/consulta-licenca` |
| Consulta Outorgas | `sistemas.meioambiente.mg.gov.br/licenciamento/site/lista-outorgas` |
| CTF/IBAMA | `servicos.ibama.gov.br/ctf` |
| IDE-SisemaNet-MG | `visualizador.idesisema.meioambiente.mg.gov.br` |
| SEI-IBAMA | `sei.ibama.gov.br` |
| SEI-MG | `sei.mg.gov.br` |
| SLA-Ecossistemas/MG | `ecosistemas.meioambiente.mg.gov.br` |

### Ferramentas do Sistema

| Grupo | Funcionalidade | Rota |
| --- | --- | --- |
| Empresa e Aparencia | Informacoes da Empresa | `/settings/company` |
| Empresa e Aparencia | Responsaveis Tecnicos | `/technical-responsible` |
| Empresa e Aparencia | Identidade Visual | `/settings#identidade-visual` |
| Empresa e Aparencia | Aparencia | `/settings/appearance` |
| Documentos e Modelos | Templates | `/settings/templates` |
| Documentos e Modelos | Laudos | `/laudos` |
| Documentos e Modelos | Consultas Tecnicas | `/consultas` |
| IA/RAG/Integracoes | MCP + RAG | `/configuracoes/mcp-rag` |
| IA/RAG/Integracoes | Fontes de Conhecimento | `/knowledge-sources` |
| IA/RAG/Integracoes | Biblioteca IA OneDrive | `/ai-lab/cloud-library` |
| IA/RAG/Integracoes | Integracao OneDrive | `/settings/onedrive-integration` |
| IA/RAG/Integracoes | Ferramentas MCP | `/ai-lab/mcp` |
| IA/RAG/Integracoes | Laboratorio RAG | `/ai-lab/rag` |
| IA/RAG/Integracoes | Importacao IA legado local | `/settings/ai-local-source` |
| Administracao/Auditoria | Backup de Dados Apagados | `/settings/deleted-backups` |
| Administracao/Auditoria | Explorador de Arquivos | `/settings/files` |
| Administracao/Auditoria | Log de Auditoria | `/audit-log` |
| Administracao/Auditoria | Canais WhatsApp/IG | `/canais` |

### Outros top-levels presentes no `new`

Estes aparecem no `new/src/modules/navigation/navigation-registry.ts`, mas nao foram confirmados como paridade direta do `web/src/lib/navigation-config.ts`:

| Modulo | Rota planejada |
| --- | --- |
| Comunicacao interna | `/comunicacao-interna` |
| Financiamento Agrario | `/financiamento-agrario` |
| Minha area RH | `/minha-area-rh` |
| Recursos Humanos | `/recursos-humanos`, `/recursos-humanos/colaboradores`, `/recursos-humanos/solicitacoes` |

## Estado atual do `new`

Implementado:

- Login, cadastro, recuperacao de senha e layout autenticado.
- Router TanStack com `/`, `/login`, `/forgot-password`, `/register`, `/app` e `/app/exemplos`.
- `DashboardRouterView` por role.
- `modules/auth/permissions.ts` com os 12 perfis do `web`.
- `modules/auth/route-access.ts` com aliases, bloqueio de `cliente_autonomo` e regra especial de `consultor_representante`.
- `modules/navigation/navigation-registry.ts` com a maior parte dos itens do legado mapeados como `legacyHref`.
- Shell com sidebar desktop e overlay mobile.
- API base (`new/src/service/api.ts`) e cliente HTTP.

Nao implementado no mesmo nivel do `web`:

- Rotas TanStack dos modulos legados.
- Telas reais dos modulos.
- Services por modulo.
- Endpoints agregados de dashboard.
- Dados reais do dashboard; `new/src/pages/dashboard/dashboard-data.ts` e mock.
- Escopo portal/representante/consultor para dashboard e modulos.
- `FaunaDashboard` dedicado para `diretor_fauna`.
- `ClientDashboard` dedicado com onboarding, carteira/titular, hubs mobile e filtros.
- Bottom navigation mobile equivalente.
- Sidebar desktop colapsavel/redimensionavel equivalente.
- Header com notificacoes reais, branding, tema, upgrade, chat e fila offline.
- `/external` real com validacao de destino/titulo e comportamento de embed/nova aba.

Ponto critico: o registry novo tem muitos itens de menu, mas quase todos chamam `legacyItem(...)` e ficam `disabled: true`. Foram encontrados 160 usos de `legacyItem(...)` e apenas 2 itens com `to` navegavel (`/app` e `/app/exemplos`).

## Padrao modular alvo para o `new`

Cada funcionalidade deve ficar dentro do modulo dono:

```txt
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

Agregadores globais:

- `new/src/modules/navigation/navigation-registry.ts` deve apenas juntar `navigation.ts` dos modulos.
- `new/src/modules/auth/permissions.ts` deve concentrar grupos de roles e helpers comuns.
- `new/src/modules/auth/route-access.ts` deve usar as rotas dos modulos.
- `new/src/router.tsx` deve registrar as rotas exportadas por cada modulo.
- `new/src/service/api.ts` deve ser a unica entrada HTTP.

## Plano por prioridade

### 1. Base de autorizacao e roteamento

- Extrair cada bloco do `navigation-registry.ts` para `modules/<modulo>/navigation.ts`.
- Criar `routes.tsx` por modulo e registrar no `router.tsx`.
- Trocar `legacyHref` por `to` quando a rota existir.
- Manter `legacyHref` apenas como metadado de paridade.
- Criar tela 403 ou redirect consistente quando `isRoleAllowedForPath` negar acesso.
- Testar `getNavigationItemsForRole`, `getAllowedRolesForPath` e bloqueios de `cliente_autonomo`/`consultor_representante`.

### 2. Dashboard real

- Criar `modules/dashboard/service.ts`.
- Substituir mocks por endpoints/DTOs reais.
- Migrar widgets: agenda, tarefas, aniversarios, financeiro, CRM, ambiental, cliente e fauna.
- Recriar `ClientDashboard` e `FaunaDashboard` dedicados.
- Garantir escopo de portal antes de qualquer consulta.

### 3. Cadastro e Documentos Ambientais

- Migrar primeiro porque alimentam dashboard e portal.
- Implementar users, empreendedores, projects, responsible-company.
- Implementar CAR, condicionantes, CTF/IBAMA, DAIA, fauna, licencas, TAC, MTR, monitoramento, outorgas e usos insignificantes.
- Validar CPF/CNPJ, datas, anexos, uploads, vinculos com empreendedor/projeto e regras de escrita.

### 4. Agenda e Gestao de Processos

- Migrar agenda com regra de eventos internos/publicos/proprios.
- Migrar projetos, fluxo, tarefas e indicadores.
- API deve respeitar `canAccessOfficeTasks`, `canSeeAllOfficeTasks`, `canWriteGestaoProcessos` e escopo de portal.

### 5. Financeiro e CRM

- Migrar contratos, faturas, caixa, fornecedores, propostas, ROI, DRE, conciliacao, patrimonio, orcamento e exportacao.
- Migrar CRM, oportunidades, pipeline, equipe, alertas e relatorios.
- Separar escrita financeira (`admin`/`financial`) de escrita comercial (`admin`/`financial`/`sales`) e leitura de portal.

### 6. Estudos Tecnicos

- Migrar por submodulos: PCA, RCA, fauna, inventario, barragens, outorgas, compensacao, relatorios diversos, PIA, PRADA, LAS/RAS, EIA/RIMA, procuracao e memorial.
- Preservar `?listagem=A..H`.
- Migrar geracao DOCX/PDF, uploads, autosave e validacoes por schema.

### 7. IA, FAD, Georeferenciamento, Sistema e External

- Criar modulos `ia`, `fiscal-ambiental-digital`, `georeferenciamento`, `sistema` e `external`.
- Migrar APIs de FAD, RAG, OneDrive, mapas, geospatial e laudos via service.
- Implementar `/external` com allowlist por item de menu, fallback para nova aba e layout sem scroll duplo.

### 8. Responsividade e shell

- Recriar bottom navigation mobile: Painel, Agenda, Documentos Ambientais dinamico, Gestao/Cadastro e Perfil.
- Recriar hubs mobile (`DocumentosAmbientaisHubCard`, `ProfileNavigationHubCard`).
- Portar notificacoes, branding, tema, chat, upgrade e offline queue.
- Revisar tabelas para colunas ocultaveis/stacked em mobile.

## Criterios de aceite

- Cada perfil ve o mesmo dashboard funcional do `web`.
- Cada item de menu do `web` esta implementado no `new`, removido por decisao documentada ou mantido sob feature flag.
- Menu, rota e API usam a mesma fonte de permissao.
- Portal, representante e consultor nunca recebem colecoes completas.
- `cliente_autonomo` continua bloqueado nos prefixos definidos.
- `consultor_representante` nao acessa Financeiro e so ganha `/carteira`.
- `/external` valida destino permitido.
- Build do `new` passa.
- Testes cobrem role/menu/rota e DTOs principais do dashboard.
