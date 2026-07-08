export type MigrationStatus = "pending" | "in_progress" | "mapped";

export type MigrationFeature = {
 name: string;
 legacyRoute: string;
 targetModule: string;
 frontScope: string;
 apiScope: string;
 validations: string;
 status: MigrationStatus;
};

export type MigrationModule = {
 name: string;
 priority: number;
 folder: string;
 objective: string;
 dependencies: string[];
 acceptance: string[];
 features: MigrationFeature[];
};

export type MigrationPhase = {
 title: string;
 goal: string;
 modules: string[];
 deliverables: string[];
};

export const migrationPhases: MigrationPhase[] = [
 {
  title: "Fase 1 - Base de arquitetura",
  goal: "Garantir que menu, rotas, permissoes e pagina-base estejam sincronizados antes de portar telas complexas.",
  modules: ["auth", "navigation", "dashboard", "migration-plan"],
  deliverables: [
   "Rotas TanStack por modulo",
   "Guard por perfil usando a mesma matriz do menu",
   "Registro modular de navegacao",
   "Plano de migracao visivel no admin",
  ],
 },
 {
  title: "Fase 2 - Dashboard e dados centrais",
  goal: "Trazer paridade do painel antigo: agenda, tarefas, aniversarios, financeiro, CRM, ambiental, cliente e fauna.",
  modules: ["dashboard", "agenda", "gestao-processos", "financeiro", "crm", "documentos-ambientais"],
  deliverables: [
   "Services agregados de dashboard",
   "DTOs reais no lugar de mocks",
   "Escopo portal/representante/consultor",
   "Responsividade mobile com atalhos",
  ],
 },
 {
  title: "Fase 3 - Operacao principal",
  goal: "Migrar cadastros, documentos ambientais, processos, financeiro e CRM, que alimentam a operacao diaria.",
  modules: ["cadastro", "documentos-ambientais", "gestao-processos", "financeiro", "crm"],
  deliverables: [
   "Listagens principais",
   "Criacao e edicao",
   "Uploads e anexos",
   "Regras de escrita/leitura por perfil",
  ],
 },
 {
  title: "Fase 4 - Estudos, IA e geotecnologia",
  goal: "Migrar funcionalidades tecnicas extensas com validacao, geracao de documento e processamento espacial.",
  modules: ["estudos-tecnicos", "ia", "fiscal-ambiental-digital", "georeferenciamento"],
  deliverables: [
   "Submodulos PCA/RCA/Listagens A-H",
   "Geracao DOCX/PDF",
   "Workspaces e jobs long-running",
   "Validacao geoespacial e uploads",
  ],
 },
 {
  title: "Fase 5 - Governo, sistema e acabamento",
  goal: "Fechar links externos oficiais, ferramentas internas, auditoria, responsividade e qualidade final.",
  modules: ["external", "acessos-governamentais", "sistema", "oficios", "multas-defesas", "vistoria-tecnica"],
  deliverables: [
   "Allowlist para /external",
   "Templates, laudos, RAG e integracoes",
   "Fluxos legais e de vistoria",
   "Testes de menu/rota/build",
  ],
 },
];

export const migrationModules: MigrationModule[] = [
 {
  name: "Dashboard",
  priority: 1,
  folder: "new/src/modules/dashboard",
  objective: "Reproduzir o comportamento do dashboard antigo por tipo de usuario.",
  dependencies: ["auth", "navigation", "agenda", "financeiro", "crm", "documentos-ambientais"],
  acceptance: [
   "Cada role renderiza o painel correto",
   "Dados mockados substituidos por service/API",
   "Cliente/representante/consultor recebem apenas dados em escopo",
   "Mobile tem atalhos equivalentes ao legado",
  ],
  features: [
   {
    name: "Painel admin/supervisor",
    legacyRoute: "/",
    targetModule: "dashboard",
    frontScope: "Hub documentos, agenda, tarefas, aniversarios, financeiro, CRM e ambiental.",
    apiScope: "GET /dashboard/admin com agregacoes por role.",
    validations: "Loading, vazio, erro, links de detalhe e responsividade.",
    status: "in_progress",
   },
   {
    name: "Painel financeiro",
    legacyRoute: "/",
    targetModule: "dashboard",
    frontScope: "Agenda, aniversarios, financeiro e CRM.",
    apiScope: "GET /dashboard/financial, /dashboard/agenda, /dashboard/crm.",
    validations: "Nao duplicar ROI no DRE; valores BRL e filtros por periodo.",
    status: "pending",
   },
   {
    name: "Painel cliente/representante/consultor",
    legacyRoute: "/",
    targetModule: "dashboard",
    frontScope: "Resumo do titular, onboarding, documentos e gestao ambiental filtrada.",
    apiScope: "GET /dashboard/client com escopo por titular, empreendedor ou carteira.",
    validations: "Nunca carregar colecoes completas para portal.",
    status: "pending",
   },
   {
    name: "Painel fauna",
    legacyRoute: "/",
    targetModule: "dashboard",
    frontScope: "KPIs de estudos de fauna e recentes.",
    apiScope: "GET /dashboard/fauna.",
    validations: "Diretor de fauna deve cair no dashboard dedicado.",
    status: "pending",
   },
  ],
 },
 {
  name: "Agenda",
  priority: 2,
  folder: "new/src/modules/agenda",
  objective: "Migrar calendario e widget de eventos.",
  dependencies: ["auth", "dashboard"],
  acceptance: [
   "Eventos internos e externos seguem a regra do legado",
   "Proximos 30 dias no dashboard",
   "Tela completa em /app/calendar",
  ],
  features: [
   {
    name: "Agenda",
    legacyRoute: "/calendar",
    targetModule: "agenda",
    frontScope: "Calendario, proximos eventos e filtros.",
    apiScope: "GET /agenda, POST/PUT/DELETE /agenda quando permitido.",
    validations: "Internos veem tudo; portal ve eventos publicos nao financeiros e proprios.",
    status: "pending",
   },
  ],
 },
 {
  name: "Cadastro",
  priority: 3,
  folder: "new/src/modules/cadastro",
  objective: "Migrar entidades-base usadas por quase todos os modulos.",
  dependencies: ["auth"],
  acceptance: [
   "Cliente gestao fica read-only",
   "Cliente autonomo escreve seus cadastros",
   "Consultor usa carteira aprovada",
  ],
  features: [
   {
    name: "Usuarios",
    legacyRoute: "/users",
    targetModule: "cadastro",
    frontScope: "Listagem, edicao propria e administracao.",
    apiScope: "GET /users, POST/PUT conforme role.",
    validations: "Email, perfil, status e edicao limitada por canEditUserInUsersList.",
    status: "pending",
   },
   {
    name: "Empreendedores",
    legacyRoute: "/empreendedores",
    targetModule: "cadastro",
    frontScope: "CRUD, busca e vinculos.",
    apiScope: "GET/POST/PUT /empreendedores.",
    validations: "CPF/CNPJ, ownership, escopo portal e auditoria.",
    status: "pending",
   },
   {
    name: "Empreendimentos",
    legacyRoute: "/projects",
    targetModule: "cadastro",
    frontScope: "CRUD, dados ambientais e vinculos CAR/licencas.",
    apiScope: "GET/POST/PUT /projects.",
    validations: "Vinculo com empreendedor, pacote, coordenadas e anexos.",
    status: "pending",
   },
   {
    name: "Empresas",
    legacyRoute: "/responsible-company",
    targetModule: "cadastro",
    frontScope: "Cadastro de empresas responsaveis.",
    apiScope: "GET/POST/PUT /responsible-company.",
    validations: "CNPJ, responsavel tecnico e permissao de escrita.",
    status: "pending",
   },
  ],
 },
 {
  name: "Documentos Ambientais",
  priority: 4,
  folder: "new/src/modules/documentos-ambientais",
  objective: "Migrar documentos operacionais que alimentam o painel ambiental.",
  dependencies: ["cadastro", "storage"],
  acceptance: [
   "Uploads passam por API/service",
   "Portal recebe dados filtrados",
   "Datas e status alimentam dashboard",
  ],
  features: [
   { name: "CAR", legacyRoute: "/car", targetModule: "documentos-ambientais/car", frontScope: "Listagem, vinculo e upload.", apiScope: "GET/POST/PUT /car e uploads.", validations: "Recibo, geometria, ownership e permissao de escrita.", status: "pending" },
   { name: "Condicionantes", legacyRoute: "/compliance", targetModule: "documentos-ambientais/condicionantes", frontScope: "Prazos, status e anexos.", apiScope: "GET/POST/PUT /condicionantes.", validations: "Vencimento, cumprimento, referencia e escopo.", status: "pending" },
   { name: "CTF/IBAMA", legacyRoute: "/ctf-ibama", targetModule: "documentos-ambientais/ctf-ibama", frontScope: "Cartao e certificado.", apiScope: "GET/POST uploads CTF.", validations: "Documento, validade e permissao canManageCtfIbamaDocs.", status: "pending" },
   { name: "DAIA's", legacyRoute: "/intervencoes", targetModule: "documentos-ambientais/intervencoes", frontScope: "Intervencoes ambientais.", apiScope: "GET/POST/PUT /intervencoes.", validations: "Validade, area, empreendimento e anexos.", status: "pending" },
   { name: "Fauna", legacyRoute: "/fauna", targetModule: "documentos-ambientais/fauna", frontScope: "Documentos e estudos vinculados.", apiScope: "GET/POST/PUT /fauna.", validations: "Diretor fauna, anexos e escopo tecnico.", status: "pending" },
   { name: "Licencas", legacyRoute: "/licenses", targetModule: "documentos-ambientais/licencas", frontScope: "Listagem, criacao, edicao e alertas.", apiScope: "GET/POST/PUT /licenses.", validations: "Tipo, validade, status, empreendimento e upload.", status: "pending" },
   { name: "TAC", legacyRoute: "/tacs", targetModule: "documentos-ambientais/tacs", frontScope: "Termos e prazos.", apiScope: "GET/POST/PUT /tacs.", validations: "Partes, prazos, anexos e escopo.", status: "pending" },
   { name: "MTR-Declaracao", legacyRoute: "/mtr-declaracao", targetModule: "documentos-ambientais/mtr", frontScope: "Declaracoes e sincronizacao.", apiScope: "GET/POST /mtr e proxy MTR.", validations: "Token, declaracao, periodo e erros externos.", status: "pending" },
   { name: "Pasta do cliente", legacyRoute: "/documentos-ambientais/pasta-cliente", targetModule: "documentos-ambientais/pasta-cliente", frontScope: "Arquivos por cliente.", apiScope: "GET/POST arquivos.", validations: "Storage seguro, cliente e permissao.", status: "pending" },
   { name: "Monitoramento manual", legacyRoute: "/monitoring/manual", targetModule: "documentos-ambientais/monitoramento", frontScope: "Lancamentos manuais.", apiScope: "GET/POST/PUT /monitoring/manual.", validations: "canPerformManualMonitoringWrite e medidas obrigatorias.", status: "pending" },
   { name: "Telemetria", legacyRoute: "/monitoring/telemetric", targetModule: "documentos-ambientais/monitoramento", frontScope: "Leitura e graficos telemetricos.", apiScope: "GET /monitoring/telemetric.", validations: "Fonte, periodo e fallback sem dados.", status: "pending" },
   { name: "Outorgas", legacyRoute: "/outorgas", targetModule: "documentos-ambientais/outorgas", frontScope: "Outorgas ativas e vencimentos.", apiScope: "GET/POST/PUT /outorgas.", validations: "Uso, vazao, validade, empreendimento.", status: "pending" },
   { name: "Usos Insignificantes", legacyRoute: "/usos-insignificantes", targetModule: "documentos-ambientais/usos-insignificantes", frontScope: "Listagem e controle.", apiScope: "GET/POST/PUT /usos-insignificantes.", validations: "Tipo, validade e anexos.", status: "pending" },
  ],
 },
 {
  name: "Gestao de Projetos e Processos",
  priority: 5,
  folder: "new/src/modules/gestao-processos",
  objective: "Migrar fluxo operacional, tarefas e indicadores.",
  dependencies: ["cadastro", "agenda"],
  acceptance: [
   "Portal ve projetos/fluxo filtrados",
   "Tarefas internas respeitam participantes",
   "Indicadores apenas admin/gestor",
  ],
  features: [
   { name: "Projetos", legacyRoute: "/gestao-processos/projetos", targetModule: "gestao-processos/projetos", frontScope: "Lista e detalhe do projeto.", apiScope: "GET/POST/PUT /gestao-processos/projetos.", validations: "Escopo, status, responsavel e prazo.", status: "pending" },
   { name: "Fluxo de Processos", legacyRoute: "/gestao-processos/fluxo", targetModule: "gestao-processos/fluxo", frontScope: "Kanban/fluxo e detalhe por processo.", apiScope: "GET/POST/PUT /gestao-processos/fluxo.", validations: "Status, transicoes e permissao de escrita.", status: "pending" },
   { name: "Tarefas", legacyRoute: "/gestao-processos/tarefas", targetModule: "gestao-processos/tarefas", frontScope: "Tarefas avulsas e do escritorio.", apiScope: "GET/POST/PUT /office-tasks.", validations: "canAccessOfficeTasks e participantes.", status: "pending" },
   { name: "Indicadores de Prazos", legacyRoute: "/gestao-processos/indicadores", targetModule: "gestao-processos/indicadores", frontScope: "Resumo e graficos.", apiScope: "GET /gestao-processos/indicadores.", validations: "Apenas admin/gestor e filtros por periodo.", status: "pending" },
  ],
 },
 {
  name: "Financeiro",
  priority: 6,
  folder: "new/src/modules/financeiro",
  objective: "Migrar contratos, faturas, caixa, propostas e indicadores financeiros.",
  dependencies: ["cadastro", "crm"],
  acceptance: [
   "Sales tem acesso comercial restrito",
   "Portal acessa contratos/faturas/propostas proprias",
   "Aprovacoes ficam em admin/financial",
  ],
  features: [
   { name: "Acesso Bancario", legacyRoute: "/bank-access", targetModule: "financeiro/bank-access", frontScope: "Credenciais e acessos.", apiScope: "GET/POST /bank-access.", validations: "Somente admin/financial.", status: "pending" },
   { name: "Clientes", legacyRoute: "/clients", targetModule: "financeiro/clientes", frontScope: "Clientes comerciais.", apiScope: "GET/POST/PUT /clients.", validations: "admin/sales/financial.", status: "pending" },
   { name: "Contratos", legacyRoute: "/contracts", targetModule: "financeiro/contratos", frontScope: "Contratos, assinatura e aprovacao.", apiScope: "GET/POST/PUT /contracts.", validations: "canWriteContractsCommercial e canApproveContracts.", status: "pending" },
   { name: "Contratos Plataforma", legacyRoute: "/financial/platform-subscription-contracts", targetModule: "financeiro/contratos-plataforma", frontScope: "Assinaturas plataforma.", apiScope: "GET/PUT /platform-subscription-contracts.", validations: "admin/financial.", status: "pending" },
   { name: "Contratos-Fornecedores", legacyRoute: "/contracts-suppliers", targetModule: "financeiro/fornecedores-contratos", frontScope: "Contratos de fornecedores.", apiScope: "GET/POST/PUT /contracts-suppliers.", validations: "admin/financial/sales conforme legado.", status: "pending" },
   { name: "Faturas", legacyRoute: "/invoices", targetModule: "financeiro/faturas", frontScope: "Faturas, parcelas e pagamentos.", apiScope: "GET/POST/PUT /invoices.", validations: "Portal ve proprias; financeiro escreve.", status: "pending" },
   { name: "Caixa", legacyRoute: "/cash-flow", targetModule: "financeiro/caixa", frontScope: "Lancamentos de caixa.", apiScope: "GET/POST/PUT /cash-flow.", validations: "admin/financial e valores BRL.", status: "pending" },
   { name: "Fornecedores", legacyRoute: "/suppliers", targetModule: "financeiro/fornecedores", frontScope: "Cadastro financeiro de fornecedores.", apiScope: "GET/POST/PUT /suppliers.", validations: "admin/financial.", status: "pending" },
   { name: "Propostas Comerciais", legacyRoute: "/commercial-proposals", targetModule: "financeiro/propostas", frontScope: "Orcamentos, propostas e aceite.", apiScope: "GET/POST/PUT /commercial-proposals.", validations: "canAcceptRejectCommercialProposals.", status: "pending" },
   { name: "Painel Financeiro", legacyRoute: "/financial/painel", targetModule: "financeiro/painel", frontScope: "KPIs e graficos.", apiScope: "GET /financial/dashboard.", validations: "Nao duplicar ROI e tratar vazios.", status: "pending" },
   { name: "Projetos & ROI", legacyRoute: "/financial/projetos-roi", targetModule: "financeiro/projetos-roi", frontScope: "Casos ROI.", apiScope: "GET/POST/PUT /project-roi.", validations: "Sales read-only sem custos detalhados.", status: "pending" },
   { name: "DRE/ABC/Conciliacao/Orcamento/Exportacao", legacyRoute: "/financial/*", targetModule: "financeiro/relatorios", frontScope: "Relatorios financeiros.", apiScope: "GET /financial/reports.", validations: "admin/financial, periodo e consistencia contabil.", status: "pending" },
  ],
 },
 {
  name: "CRM",
  priority: 7,
  folder: "new/src/modules/crm",
  objective: "Migrar vendas, pipeline e relatorios comerciais.",
  dependencies: ["financeiro"],
  acceptance: [
   "Acesso admin/sales/supervisor/financial",
   "Escrita admin/sales/supervisor",
   "Dashboard comercial alimenta painel",
  ],
  features: [
   { name: "Painel de Vendas", legacyRoute: "/crm", targetModule: "crm/dashboard", frontScope: "KPIs e funil.", apiScope: "GET /crm/dashboard.", validations: "Metricas por periodo e responsavel.", status: "pending" },
   { name: "Oportunidades", legacyRoute: "/crm/opportunities", targetModule: "crm/oportunidades", frontScope: "Pipeline/Kanban.", apiScope: "GET/POST/PUT /crm/opportunities.", validations: "Estagio, valor, responsavel e permissao.", status: "pending" },
   { name: "Clientes CRM", legacyRoute: "/crm/clients", targetModule: "crm/clientes", frontScope: "Clientes comerciais CRM.", apiScope: "GET/POST/PUT /crm/clients.", validations: "Duplicidade, contato e responsavel.", status: "pending" },
   { name: "Equipe, alertas, configuracoes e relatorios", legacyRoute: "/crm/*", targetModule: "crm/admin", frontScope: "Administracao CRM.", apiScope: "GET/POST/PUT /crm/*.", validations: "Roles CRM e regras de escrita.", status: "pending" },
   { name: "Midias Sociais", legacyRoute: "/social-media", targetModule: "crm/social-media", frontScope: "Calendario/conteudos sociais.", apiScope: "GET/POST/PUT /social-media.", validations: "Permissoes CRM.", status: "pending" },
  ],
 },
 {
  name: "Estudos Tecnicos",
  priority: 8,
  folder: "new/src/modules/estudos-tecnicos",
  objective: "Migrar estudos, submodulos, listagens A-H e exportacoes.",
  dependencies: ["cadastro", "documentos-ambientais", "storage"],
  acceptance: [
   "Cada estudo tem pasta/submodulo proprio",
   "Schemas e validacoes por tipo",
   "Exportacao DOCX/PDF preservada",
  ],
  features: [
   { name: "PEA/Acao emergencial/EIA-RIMA/Cavidades", legacyRoute: "/studies/*", targetModule: "estudos-tecnicos/ambientais", frontScope: "Listagem, novo, editar e exportar.", apiScope: "GET/POST/PUT /studies/*.", validations: "Campos obrigatorios, anexos e status.", status: "pending" },
   { name: "PCA listagens A-H", legacyRoute: "/studies/pca", targetModule: "estudos-tecnicos/pca", frontScope: "Lista e formularios A-H.", apiScope: "GET/POST/PUT /studies/pca.", validations: "Parametro listagem, schema e exportacao.", status: "pending" },
   { name: "RCA listagens A-H", legacyRoute: "/studies/rca", targetModule: "estudos-tecnicos/rca", frontScope: "Lista e formularios A-H.", apiScope: "GET/POST/PUT /studies/rca.", validations: "Parametro listagem, schema e exportacao.", status: "pending" },
   { name: "Fauna estudos", legacyRoute: "/studies/fauna", targetModule: "estudos-tecnicos/fauna", frontScope: "Inventario, monitoramento, resgate e relatorios.", apiScope: "GET/POST/PUT /faunaStudies.", validations: "Diretor fauna, projeto vinculado e relatorios.", status: "pending" },
   { name: "Barragens/PIA/PRADA/PTRF/Compensacao/Relatorios", legacyRoute: "/studies/*", targetModule: "estudos-tecnicos/especializados", frontScope: "Formularios especificos e exportacoes.", apiScope: "GET/POST/PUT /studies/* e export-docx.", validations: "Schemas, anexos, PDF/DOCX e permissao interna.", status: "pending" },
  ],
 },
 {
  name: "IA e Fiscal Ambiental Digital",
  priority: 9,
  folder: "new/src/modules/ia",
  objective: "Migrar assistentes, analises e workspace FAD.",
  dependencies: ["storage", "external-services"],
  acceptance: [
   "Cliente autonomo bloqueado nos prefixos definidos",
   "Jobs long-running mostram status",
   "FAD preserva abas e workspace",
  ],
  features: [
   { name: "Assistentes IA", legacyRoute: "/studies/assistant", targetModule: "ia/assistentes", frontScope: "Tipos mira, mcp, geral, rag, financeiro.", apiScope: "POST /ai/*.", validations: "Tipo, prompt, anexos e rate limit.", status: "pending" },
   { name: "Analise Geoespacial/Socioambiental", legacyRoute: "/analise-ambiental", targetModule: "ia/analises", frontScope: "Entrada espacial e relatorios.", apiScope: "POST /geospatial/analyze e /geo-analyses.", validations: "Arquivo, area, timeout e erros externos.", status: "pending" },
   { name: "Fiscal Ambiental Digital", legacyRoute: "/ia/fiscal-ambiental-digital", targetModule: "fiscal-ambiental-digital", frontScope: "Dashboard, acervo, biblioteca, timeline, evidencias, relatorios e workspace.", apiScope: "GET/POST /fiscal-ambiental/*.", validations: "Workspace, ownership, arquivos, jobs e permissoes.", status: "pending" },
   { name: "RAG/Cloud library/MCP", legacyRoute: "/ai-lab/*", targetModule: "ia/rag", frontScope: "Fontes, biblioteca, MCP e automacoes.", apiScope: "GET/POST /cloud-rag, /mcp-rag, /onedrive.", validations: "Admin, tokens, indice e status de sync.", status: "pending" },
  ],
 },
 {
  name: "Georeferenciamento",
  priority: 10,
  folder: "new/src/modules/georeferenciamento",
  objective: "Migrar hub geotecnico, processos e validacoes espaciais.",
  dependencies: ["cadastro", "storage", "geo-services"],
  acceptance: [
   "Rotas apenas admin/gestor/supervisor/diretor_fauna/advogado",
   "Uploads espaciais validados",
   "Memorial exporta DOCX/PDF",
  ],
  features: [
   { name: "Painel e processos", legacyRoute: "/georeferenciamento", targetModule: "georeferenciamento/dashboard", frontScope: "Hub e tramites fundiarios.", apiScope: "GET/POST /georeferenciamento/processos.", validations: "Status, responsavel e escopo.", status: "pending" },
   { name: "Rural/Urbano/Ambiental", legacyRoute: "/georeferenciamento/rural", targetModule: "georeferenciamento/cadastros", frontScope: "SIGEF/INCRA, cartorio e CAR/SICAR.", apiScope: "GET/POST /georeferenciamento/*.", validations: "Sistema de referencia, area e anexos.", status: "pending" },
   { name: "Campo/documentos/memorial/validacoes", legacyRoute: "/georeferenciamento/memorial-descritivo", targetModule: "georeferenciamento/documentos", frontScope: "KML/SHP, memorial e validacoes.", apiScope: "POST /study-maps, /uploads, /memorial.", validations: "Coordenadas, fechamento, area e upload seguro.", status: "pending" },
  ],
 },
 {
  name: "Multas, Vistoria, Oficios, Governo e Sistema",
  priority: 11,
  folder: "new/src/modules/{multas-defesas,vistoria-tecnica,oficios,external,sistema}",
  objective: "Migrar fluxos administrativos, legais, links externos e ferramentas internas.",
  dependencies: ["auth", "storage", "templates"],
  acceptance: [
   "External usa allowlist",
   "Oficios respeitam leitura portal e escrita interna",
   "Sistema separa settings, templates, auditoria e integracoes",
  ],
  features: [
   { name: "Multas e Defesas", legacyRoute: "/multas-defesas", targetModule: "multas-defesas", frontScope: "Lista, novo, detalhe e documentos.", apiScope: "GET/POST/PUT /multas-defesas.", validations: "canManageAutoInfracaoDefesa, prazos e anexos.", status: "pending" },
   { name: "Vistoria Tecnica", legacyRoute: "/inspections", targetModule: "vistoria-tecnica", frontScope: "Listagem, nova vistoria e relatorios.", apiScope: "GET/POST/PUT /inspections.", validations: "Equipe interna, checklist e anexos.", status: "pending" },
   { name: "Oficios", legacyRoute: "/oficios", targetModule: "oficios", frontScope: "Lista, novo, editar, aprovar e numerar.", apiScope: "GET/POST/PUT /oficios.", validations: "isOficioReadOnlyRole, canApproveOficio e contador.", status: "pending" },
   { name: "Acessos Governamentais", legacyRoute: "/external", targetModule: "external", frontScope: "Embed/nova aba de links oficiais.", apiScope: "GET /external-embed-check.", validations: "Allowlist, fallback e permissao por item.", status: "mapped" },
   { name: "Ferramentas do Sistema", legacyRoute: "/settings", targetModule: "sistema", frontScope: "Empresa, aparencia, templates, laudos, consultas, RAG, auditoria e canais.", apiScope: "GET/POST/PUT /settings, /templates, /laudos, /audit-log.", validations: "Admin/supervisor/gestor conforme subrota.", status: "pending" },
  ],
 },
];

export const migrationSummary = {
 totalModules: migrationModules.length,
 totalFeatures: migrationModules.reduce((sum, module) => sum + module.features.length, 0),
 mappedFeatures: migrationModules.reduce(
  (sum, module) => sum + module.features.filter((feature) => feature.status === "mapped").length,
  0,
 ),
 inProgressFeatures: migrationModules.reduce(
  (sum, module) => sum + module.features.filter((feature) => feature.status === "in_progress").length,
  0,
 ),
};
