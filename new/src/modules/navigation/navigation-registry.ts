import {
 AlertTriangle,
 BarChart2,
 BarChart3,
 Bell,
 Book,
 BookMarked,
 BookOpen,
 BookOpenCheck,
 BookText,
 Bot,
 Briefcase,
 Bug,
 Building,
 Building2,
 Calendar,
 ClipboardCheck,
 ClipboardList,
 ClipboardPenLine,
 Contact,
 Crosshair,
 DatabaseZap,
 Droplets,
 FileArchive,
 FileCheck,
 FileDown,
 FileQuestion,
 FileSearch,
 FileSignature,
 FileSpreadsheet,
 FileText,
 Folder,
 FolderKanban,
 Globe,
 HardHat,
 History,
 Landmark,
 LayoutDashboard,
 LayoutGrid,
 Leaf,
 LineChart,
 Link as LinkIcon,
 List,
 ListTodo,
 ListTree,
 Mail,
 Map,
 MapPinned,
 MessagesSquare,
 Mountain,
 NotebookText,
 Palette,
 PlusSquare,
 Recycle,
 Scale,
 SearchCheck,
 Send,
 Settings,
 Shield,
 ShieldCheck,
 ShoppingCart,
 Signal,
 Smartphone,
 Sparkles,
 Trees,
 TrendingUp,
 Truck,
 UserCog,
 Users,
 Waves,
 Workflow,
 GitBranch,
 Share2,
} from "lucide-react";
import type { NavigationItem } from "../../app/navigation/navigation.types";

function legacyHrefToAppPath(legacyHref?: string): string | undefined {
 if (!legacyHref) return undefined;
 if (legacyHref.startsWith("http")) return legacyHref;
 const [pathPart, queryPart] = legacyHref.split("?", 2);
 const [pathname, hashPart] = (pathPart ?? "").split("#", 2);
 const normalizedPathname = pathname === "/" ? "" : pathname;
 const search = queryPart ? `?${queryPart}` : "";
 const hash = hashPart ? `#${hashPart}` : "";
 return `/app${normalizedPathname}${search}${hash}`;
}

function legacyItem(item: Omit<NavigationItem, "disabled">): NavigationItem {
 return { ...item, to: item.to ?? legacyHrefToAppPath(item.legacyHref), disabled: false };
}

function externalHref(url: string, title: string, newTab = false): string {
 const params = new URLSearchParams({ url, title });
 if (newTab) params.set("newTab", "true");
 return `/external?${params.toString()}`;
}

function listagemItems(kind: "pca" | "rca"): NavigationItem[] {
 const base = kind === "pca" ? "/studies/pca/new" : "/studies/rca/new";
 return [
  ["A", "Atividades minerárias"],
  ["B", "Indústria metalúrgica e afins"],
  ["C", "Indústria química e afins"],
  ["D", "Indústria alimentícia"],
  ["E", "Infraestrutura"],
  ["F", "Resíduos e serviços"],
  ["G", "Agrossilvipastoris"],
  ["H", "Outras atividades"],
 ].map(([code, label]) => legacyItem({
  legacyHref: `${base}?listagem=${code}`,
  label: `Listagem ${code} - ${label}`,
  icon: BookMarked,
 }));
}

export const adminNavigationItems: NavigationItem[] = [
 { to: "/app", legacyHref: "/", label: "Painel", icon: LayoutDashboard},
 {
  to: "/app/plano-migracao",
  legacyHref: "/plano-migracao",
  label: "Plano de Migração",
  icon: ClipboardList,
  claim: { claimType: "recurso.claim", claimValue: "visualizar" },
 },
 legacyItem({ legacyHref: "/carteira", label: "Minha Carteira", icon: Briefcase }),
 legacyItem({ legacyHref: "/analise-ambiental", label: "AmbBot", icon: Bot }),
 legacyItem({ legacyHref: "/comunicacao-interna", label: "Comunicação interna", icon: MessagesSquare }),
 legacyItem({ legacyHref: "/financiamento-agrario", label: "Financiamento Agrário", icon: Leaf }),
 {
  label: "IA",
  icon: Bot,
  children: [
   legacyItem({ legacyHref: "/studies/assistant?tipo=mira", label: "Águas / MIRA-IGAM", icon: Droplets}),
   legacyItem({ legacyHref: "/ia/fiscal-ambiental-digital", label: "Fiscal Ambiental Digital", icon: Globe}),
   legacyItem({ legacyHref: "/analise-ambiental", label: "Análise Geoespacial (IA)", icon: Globe}),
   legacyItem({ legacyHref: "/studies/analise-socioambiental", label: "Análise Socioambiental", icon: FileText}),
   legacyItem({ legacyHref: "/studies/assistant?tipo=mcp", label: "Cruzamento de dados", icon: Workflow}),
   legacyItem({ legacyHref: "/studies/assistant?tipo=geral", label: "Legislação e estudos", icon: BookOpenCheck}),
   legacyItem({ legacyHref: "/reporting", label: "Relatórios de IA", icon: Recycle }),
   legacyItem({ legacyHref: "/studies/assistant?tipo=rag", label: "Síntese de texto", icon: FileArchive}),
   legacyItem({ legacyHref: "/ai-lab/automations", label: "Automações IA", icon: Bot }),
  ],
 },
 {
  label: "Fiscal Ambiental Digital",
  icon: Globe,
  children: [
   legacyItem({ legacyHref: "/ia/fiscal-ambiental-digital/dashboard", label: "Início", icon: LayoutDashboard}),
   legacyItem({ legacyHref: "/ia/fiscal-ambiental-digital/montar-acervo", label: "Montar acervo", icon: Folder}),
   legacyItem({ legacyHref: "/ia/fiscal-ambiental-digital/biblioteca", label: "Biblioteca", icon: BookOpen}),
   legacyItem({ legacyHref: "/ia/fiscal-ambiental-digital/linha-do-tempo", label: "Linha do tempo", icon: History}),
   legacyItem({ legacyHref: "/ia/fiscal-ambiental-digital/comparador", label: "Comparar", icon: BarChart2}),
   legacyItem({ legacyHref: "/ia/fiscal-ambiental-digital/evidencias", label: "Evidências", icon: FileCheck}),
   legacyItem({ legacyHref: "/ia/fiscal-ambiental-digital/inteligencia", label: "Inteligência", icon: Sparkles}),
   legacyItem({ legacyHref: "/ia/fiscal-ambiental-digital/fiscalizacao", label: "Fiscalização", icon: SearchCheck}),
   legacyItem({ legacyHref: "/ia/fiscal-ambiental-digital/relatorios", label: "Relatórios", icon: FileText}),
   legacyItem({ legacyHref: "/ia/fiscal-ambiental-digital/monitoramento", label: "Monitoramento", icon: Signal}),
   legacyItem({ legacyHref: "/ia/fiscal-ambiental-digital/esg", label: "Auditoria ESG", icon: ShieldCheck}),
   legacyItem({ legacyHref: "/ia/fiscal-ambiental-digital/configuracoes", label: "Configurações", icon: Settings}),
  ],
 },
 legacyItem({ legacyHref: "/studies/assistant?tipo=geral", label: "Inteligência Ambiental", icon: Sparkles }),
 legacyItem({ legacyHref: "/minha-area-rh", label: "Minha área RH", icon: UserCog}),
 {
  label: "Recursos Humanos",
  icon: Users,
  children: [
   legacyItem({ legacyHref: "/recursos-humanos", label: "Painel RH", icon: LayoutDashboard }),
   legacyItem({ legacyHref: "/recursos-humanos/colaboradores", label: "Colaboradores", icon: Users }),
   legacyItem({ legacyHref: "/recursos-humanos/solicitacoes", label: "Solicitações", icon: ClipboardList }),
  ],
 },
 {
  label: "Financeiro",
  icon: Briefcase,
  children: [
   legacyItem({ legacyHref: "/bank-access", label: "Acesso Bancário", icon: Landmark}),
   legacyItem({ legacyHref: "/clients", label: "Clientes", icon: Users }),
   legacyItem({ legacyHref: "/contracts", label: "Contratos", icon: FileSignature }),
   legacyItem({ legacyHref: "/financial/platform-subscription-contracts", label: "Contratos Plataforma", icon: FileText}),
   legacyItem({ legacyHref: "/contracts-suppliers", label: "Contratos-Fornecedores", icon: FileSignature }),
   legacyItem({ legacyHref: "/financial/abc-curve", label: "Curva ABC", icon: LineChart}),
   legacyItem({ legacyHref: "/financial/bens-patrimonio", label: "Bens e Patrimônio", icon: Building2}),
   legacyItem({ legacyHref: "/financial/dre-contabil", label: "DRE Contábil", icon: BarChart2}),
   legacyItem({ legacyHref: "/invoices", label: "Faturas", icon: FileText }),
   legacyItem({ legacyHref: "/suppliers", label: "Fornecedores", icon: Truck}),
   legacyItem({ legacyHref: "/cash-flow", label: "Lançamentos de Caixa", icon: Landmark}),
   legacyItem({ legacyHref: externalHref("https://www.nfe.fazenda.gov.br/portal/principal.aspx", "NFe Nacional", true), label: "NFe Nacional", icon: FileText}),
   legacyItem({ legacyHref: "/commercial-proposals", label: "Orçamentos e Propostas", icon: ClipboardPenLine }),
   legacyItem({ legacyHref: "/financial/painel", label: "Painel Financeiro", icon: BarChart2}),
   legacyItem({ legacyHref: "/financial/projetos-roi", label: "Projetos & ROI", icon: TrendingUp }),
   legacyItem({ legacyHref: "/financial/fluxo-projetado", label: "Fluxo de Caixa Projetado", icon: TrendingUp}),
   legacyItem({ legacyHref: "/financial/conciliacao", label: "Conciliação Bancária", icon: Landmark}),
   legacyItem({ legacyHref: "/financial/billing-debug", label: "Debug PIX Assinatura", icon: Bug }),
   legacyItem({ legacyHref: "/financial/abc-servicos", label: "Curva ABC Serviços", icon: BarChart2}),
   legacyItem({ legacyHref: "/financial/abc-fornecedores", label: "Curva ABC Fornecedores", icon: BarChart2}),
   legacyItem({ legacyHref: "/financial/orcamento", label: "Orçamento Anual", icon: FileSpreadsheet}),
   legacyItem({ legacyHref: "/financial/export-contabil", label: "Exportação Contábil", icon: FileDown}),
   legacyItem({ legacyHref: "/studies/assistant?tipo=financeiro", label: "Assistente Financeiro (IA)", icon: Sparkles}),
   legacyItem({ legacyHref: "/services", label: "Tabela de Serviços", icon: List}),
  ],
 },
 {
  label: "Cadastro",
  icon: Book,
  children: [
   legacyItem({
    legacyHref: "/users",
    label: "Usuários",
    icon: UserCog,
    claim: { claimType: "recurso.usuario", claimValue: "visualizar" },
   }),
   legacyItem({ legacyHref: "/empreendedores", label: "Empreendedores", icon: Contact}),
   legacyItem({ legacyHref: "/projects", label: "Empreendimentos", icon: Building}),
   legacyItem({ legacyHref: "/responsible-company", label: "Empresas", icon: Building2}),
  ],
 },
 {
  label: "Documentos Ambientais",
  icon: Recycle,
  children: [
   legacyItem({ legacyHref: "/car", label: "CAR", icon: FileText}),
   legacyItem({ legacyHref: "/compliance", label: "Condicionantes", icon: ClipboardCheck}),
   legacyItem({ legacyHref: "/ctf-ibama", label: "CTF/IBAMA", icon: ShieldCheck}),
   legacyItem({ legacyHref: "/intervencoes", label: "DAIA's", icon: Trees}),
   legacyItem({ legacyHref: "/fauna", label: "Fauna", icon: Leaf }),
   legacyItem({ legacyHref: "/licenses", label: "Licenças", icon: FileCheck}),
   legacyItem({ legacyHref: "/tacs", label: "TAC - Termo de Ajust. de Conduta", icon: Scale}),
   legacyItem({ legacyHref: "/mtr-declaracao", label: "MTR-Declaração", icon: Truck}),
   legacyItem({ legacyHref: "/documentos-ambientais/pasta-cliente", label: "Pasta do cliente", icon: Folder }),
   {
    label: "Monitoramento de Outorga",
    icon: BookMarked,
    children: [
     legacyItem({ legacyHref: "/monitoring/manual", label: "Lançamento Manual", icon: ClipboardList}),
     legacyItem({ legacyHref: "/monitoring/telemetric", label: "Telemetria (Real-time)", icon: Signal}),
    ],
   },
   legacyItem({ legacyHref: "/outorgas", label: "Outorgas", icon: Droplets}),
   legacyItem({ legacyHref: "/usos-insignificantes", label: "Usos Insignificantes", icon: Waves}),
  ],
 },
 {
  label: "Multas e Defesas",
  icon: Scale,
  children: [
   legacyItem({ legacyHref: "/multas-defesas", label: "Consultar multas e defesas", icon: List }),
   legacyItem({ legacyHref: "/multas-defesas/nova", label: "Nova multa / processo", icon: PlusSquare }),
  ],
 },
 {
  label: "Vistoria Técnica",
  icon: SearchCheck,
  children: [
   legacyItem({ legacyHref: "/inspections", label: "Consultar vistorias", icon: List }),
   legacyItem({ legacyHref: "/inspections/new", label: "Nova vistoria", icon: PlusSquare }),
   legacyItem({ legacyHref: "/inspections/reports", label: "Relatórios de Campo", icon: FileText }),
  ],
 },
 {
  label: "Gestão de Projetos e Processos",
  icon: FolderKanban,
  children: [
   legacyItem({ legacyHref: "/gestao-processos/projetos", label: "Projetos", icon: FolderKanban}),
   legacyItem({ legacyHref: "/gestao-processos/fluxo", label: "Fluxo de Processos", icon: GitBranch}),
   legacyItem({ legacyHref: "/gestao-processos/tarefas", label: "Tarefas", icon: ListTodo}),
   {
    label: "Indicadores de Prazos",
    icon: BarChart3,
    children: [
     legacyItem({ legacyHref: "/gestao-processos/indicadores", label: "Resumo", icon: LayoutDashboard }),
     legacyItem({ legacyHref: "/gestao-processos/indicadores/analise", label: "Gráfico de Análise", icon: LineChart }),
    ],
   },
  ],
 },
 {
  label: "Estudos Técnicos",
  icon: BookText,
  children: [
   legacyItem({ legacyHref: "/studies/educacao-ambiental", label: "Programa de Educação Ambiental", icon: BookOpenCheck}),
   legacyItem({ legacyHref: "/studies/acao-emergencial", label: "Programa de Ação Emergencial", icon: AlertTriangle}),
   legacyItem({ legacyHref: "/studies/eia-rima", label: "EIA/RIMA", icon: FileQuestion}),
   legacyItem({ legacyHref: "/studies/cavidades", label: "Estudo de Cavidades", icon: Mountain}),
   legacyItem({ legacyHref: "/studies/fauna", label: "Estudos de Fauna", icon: Leaf}),
   legacyItem({ legacyHref: "/studies/ide-sisemanet", label: "IDE-SisemaNet", icon: MapPinned}),
   {
    label: "Inventário Florestal",
    icon: ListTree,
    children: [
     legacyItem({ legacyHref: "/studies/inventario", label: "Inventário Florestal", icon: ListTree}),
     legacyItem({ legacyHref: "/coleta-campo", label: "Coleta de campo", icon: Smartphone }),
    ],
   },
   legacyItem({ legacyHref: "/studies/las-ras", label: "LAS-RAS", icon: FileSignature}),
   legacyItem({ legacyHref: "/studies/reanalise", label: "Reanálise", icon: FileSignature}),
   legacyItem({ legacyHref: "/studies/procuracao", label: "Procuração", icon: FileSignature}),
   legacyItem({ legacyHref: "/studies/mapas", label: "Mapas", icon: Map}),
   legacyItem({ legacyHref: "/studies/memorial-descritivo", label: "Memorial Descritivo", icon: FileText}),
   {
    label: "Outorgas (processos)",
    icon: Droplets,
    children: [
     legacyItem({ legacyHref: "/studies/outorgas", label: "Processos", icon: ClipboardList}),
     legacyItem({ legacyHref: "/studies/outorgas/new", label: "Nova outorga", icon: PlusSquare}),
    ],
   },
   { label: "PCA", icon: BookMarked, children: [legacyItem({ legacyHref: "/studies/pca", label: "Lista de PCAs", icon: List}), ...listagemItems("pca")] },
   legacyItem({ legacyHref: "/studies/pia", label: "PIA", icon: FileCheck}),
   legacyItem({ legacyHref: "/studies/prada", label: "PRADA", icon: Leaf}),
   {
    label: "Projetos e Segurança de Barragens",
    icon: Building2,
    children: [
     legacyItem({ legacyHref: "/studies/barragens", label: "Visão geral", icon: LayoutGrid}),
     legacyItem({ legacyHref: "/studies/barragem", label: "Projeto técnico", icon: FileText}),
     legacyItem({ legacyHref: "/studies/seguranca-barragens", label: "Segurança e emergência", icon: Shield}),
     legacyItem({ legacyHref: "/studies/piscinao-off-stream", label: "Piscinão (off-stream)", icon: Waves}),
    ],
   },
   legacyItem({ legacyHref: "/studies/ptrf", label: "PTRF", icon: Trees}),
   { label: "RCA", icon: NotebookText, children: [legacyItem({ legacyHref: "/studies/rca", label: "Lista de RCAs", icon: List}), ...listagemItems("rca")] },
   {
    label: "Relatórios Diversos",
    icon: FileArchive,
    children: [
     legacyItem({ legacyHref: "/studies/relatorios-diversos", label: "Visão geral", icon: FileArchive}),
     legacyItem({ legacyHref: "/studies/relatorios-diversos/carvao-vegetal", label: "Carvão vegetal", icon: FileText}),
     legacyItem({ legacyHref: "/studies/relatorios-diversos/ptrf-prad", label: "PTRF / PRAD", icon: Trees}),
     legacyItem({ legacyHref: "/studies/relatorios-diversos/transporte-residuos", label: "Transporte de resíduos", icon: Truck}),
    ],
   },
   legacyItem({ legacyHref: "/studies/mtr", label: "MTR-MG (resíduos)", icon: Recycle}),
   {
    label: "Compensação Ambiental",
    icon: Scale,
    children: [
     legacyItem({ legacyHref: "/studies/compensacao-ambiental", label: "Visão geral", icon: Scale}),
     legacyItem({ legacyHref: "/studies/compensacao-ambiental/especies", label: "Espécies protegidas", icon: Trees}),
     legacyItem({ legacyHref: "/studies/compensacao-ambiental/snuc", label: "SNUC", icon: Scale}),
     legacyItem({ legacyHref: "/studies/compensacao-ambiental/mata-atlantica", label: "Mata Atlântica", icon: Leaf}),
     legacyItem({ legacyHref: "/studies/compensacao-ambiental/mineraria", label: "Minerária", icon: Building2}),
     legacyItem({ legacyHref: "/studies/compensacao-ambiental/app", label: "Intervenção em APP", icon: Droplets}),
    ],
   },
   legacyItem({ legacyHref: "/studies/reserva-legal", label: "Reserva Legal", icon: ShieldCheck}),
  ],
 },
 {
  label: "Georeferenciamento",
  icon: Crosshair,
  children: [
   legacyItem({ legacyHref: "/georeferenciamento", label: "Painel", icon: LayoutDashboard}),
   legacyItem({ legacyHref: "/georeferenciamento/processos", label: "Trâmites fundiários", icon: FolderKanban}),
   legacyItem({ legacyHref: "/georeferenciamento/rural", label: "Rural (SIGEF/INCRA)", icon: Trees}),
   legacyItem({ legacyHref: "/georeferenciamento/urbano", label: "Urbano (cartório)", icon: Building2}),
   legacyItem({ legacyHref: "/georeferenciamento/ambiental", label: "CAR / SICAR", icon: Leaf}),
   legacyItem({ legacyHref: "/georeferenciamento/historico-car", label: "Histórico CAR", icon: History}),
   legacyItem({ legacyHref: "/georeferenciamento/campo", label: "Campo e levantamento", icon: Crosshair}),
   legacyItem({ legacyHref: "/georeferenciamento/documentos", label: "Documentação técnica", icon: FileSpreadsheet}),
   legacyItem({ legacyHref: "/georeferenciamento/memorial-descritivo", label: "Memorial descritivo", icon: FileText}),
   legacyItem({ legacyHref: "/georeferenciamento/validacoes", label: "Validações", icon: Scale}),
   legacyItem({ legacyHref: "/georeferenciamento/registro", label: "Cartório e registro", icon: BookOpen}),
   legacyItem({ legacyHref: "/georeferenciamento/referencias", label: "Referências normativas", icon: BookOpenCheck}),
  ],
 },
 {
  label: "Vendas & CRM",
  icon: ShoppingCart,
  children: [
   legacyItem({ legacyHref: "/crm/alerts", label: "Alertas & Notificações", icon: Bell}),
   legacyItem({ legacyHref: "/crm/settings", label: "Configurações CRM", icon: Settings}),
   legacyItem({ legacyHref: "/crm/team", label: "Equipe & Desempenho", icon: Users}),
   legacyItem({ legacyHref: "/crm/clients", label: "Gestão de Clientes", icon: Users}),
   legacyItem({ legacyHref: "/social-media", label: "Mídias Sociais", icon: Share2}),
   legacyItem({ legacyHref: "/crm/opportunities", label: "Oportunidades & Pipeline", icon: FolderKanban}),
   legacyItem({ legacyHref: "/crm", label: "Painel de Vendas", icon: LayoutDashboard}),
   legacyItem({ legacyHref: "/crm/reports", label: "Relatórios & Análises", icon: BarChart2}),
   legacyItem({ legacyHref: "/crm/proposals", label: "Vendas & Propostas", icon: FileText}),
  ],
 },
 legacyItem({ legacyHref: "/external?url=https%3A%2F%2Fconsultoriapimenta.com.br%3A2096%2F&title=Webmail", label: "Webmail", icon: Send }),
 legacyItem({ legacyHref: "/oficios", label: "Ofícios", icon: Mail }),
 {
  label: "Acessos Governamentais",
  icon: LinkIcon,
  children: [
   legacyItem({ legacyHref: externalHref("https://sistemas.meioambiente.mg.gov.br/consulta-intervencao/site/listar-decisoes", "Consulta Intervenção Ambiental"), label: "Consulta Intervenção Ambiental", icon: BookText}),
   legacyItem({ legacyHref: externalHref("https://sistemas.meioambiente.mg.gov.br/licenciamento/site/consulta-licenca", "Consulta de Licenças"), label: "Consulta Licenciamento", icon: BookText}),
   legacyItem({ legacyHref: externalHref("https://sistemas.meioambiente.mg.gov.br/licenciamento/site/lista-outorgas", "Consulta de Outorgas"), label: "Consulta Outorgas", icon: BookText}),
   legacyItem({ legacyHref: externalHref("https://servicos.ibama.gov.br/ctf/", "CTF/IBAMA", true), label: "CTF/IBAMA", icon: LinkIcon}),
   legacyItem({ legacyHref: externalHref("https://visualizador.idesisema.meioambiente.mg.gov.br/", "IDE-SisemaNet-MG"), label: "IDE-SisemaNet-MG", icon: Globe}),
   legacyItem({ legacyHref: externalHref("https://sei.ibama.gov.br/controlador_externo.php?acao=usuario_externo_logar&id_orgao_acesso_externo=0", "SEI-IBAMA", true), label: "SEI-IBAMA", icon: LinkIcon}),
   legacyItem({ legacyHref: externalHref("https://www.sei.mg.gov.br/sei/controlador_externo.php?acao=usuario_externo_logar&id_orgao_acesso_externo=0", "SEI-MG", true), label: "SEI-MG", icon: LinkIcon}),
   legacyItem({ legacyHref: externalHref("https://ecosistemas.meioambiente.mg.gov.br/portalseguranca/login", "SLA-Ecossistemas-MG", true), label: "SLA-Ecossistemas/MG", icon: LinkIcon}),
  ],
 },
 {
  label: "Ferramentas do Sistema",
  icon: Settings,
  children: [
   {
    label: "Empresa e Aparência",
    icon: Building,
    children: [
     legacyItem({ legacyHref: "/settings/company", label: "Informações da Empresa", icon: Building }),
     legacyItem({ legacyHref: "/technical-responsible", label: "Responsáveis Técnicos", icon: HardHat }),
     legacyItem({ legacyHref: "/settings#identidade-visual", label: "Identidade Visual", icon: Palette }),
     legacyItem({ legacyHref: "/settings/appearance", label: "Aparência", icon: Palette}),
    ],
   },
   {
    label: "Documentos e Modelos",
    icon: FileText,
    children: [
     legacyItem({ legacyHref: "/settings/templates", label: "Templates", icon: FileText }),
     legacyItem({ legacyHref: "/laudos", label: "Laudos", icon: BookOpenCheck }),
     legacyItem({ legacyHref: "/consultas", label: "Consultas Técnicas", icon: FileQuestion }),
    ],
   },
   {
    label: "IA, RAG e Integrações",
    icon: Bot,
    children: [
     legacyItem({ legacyHref: "/configuracoes/mcp-rag", label: "MCP + RAG / Inteligência do Sistema", icon: DatabaseZap }),
     legacyItem({ legacyHref: "/knowledge-sources", label: "Fontes de Conhecimento (RAG)", icon: BookMarked }),
     legacyItem({ legacyHref: "/ai-lab/cloud-library", label: "Biblioteca IA (OneDrive)", icon: Folder }),
     legacyItem({ legacyHref: "/settings/onedrive-integration", label: "Integração OneDrive", icon: LinkIcon }),
     legacyItem({ legacyHref: "/ai-lab/mcp", label: "Ferramentas MCP (lab)", icon: Workflow }),
     legacyItem({ legacyHref: "/ai-lab/rag", label: "Laboratório RAG", icon: BookMarked }),
     legacyItem({ legacyHref: "/settings/ai-local-source", label: "Importação IA (legado local)", icon: DatabaseZap }),
    ],
   },
   {
    label: "Administração e Auditoria",
    icon: ShieldCheck,
    children: [
     legacyItem({ legacyHref: "/settings/deleted-backups", label: "Backup de Dados Apagados", icon: History }),
     legacyItem({ legacyHref: "/settings/files", label: "Explorador de Arquivos", icon: Folder }),
     legacyItem({ legacyHref: "/audit-log", label: "Log de Auditoria", icon: History }),
     legacyItem({ legacyHref: "/canais", label: "Canais (WhatsApp/IG)", icon: MessagesSquare }),
    ],
   },
  ],
 },
 legacyItem({ legacyHref: "/calendar", label: "Agenda", icon: Calendar }),
 {
  to: "/app/exemplos",
  label: "Catálogo UI",
  icon: FileSearch,
  claim: { claimType: "recurso.claim", claimValue: "visualizar" },
 },
];

function labelToString(label: NavigationItem["label"]): string {
 if (typeof label === "string") return label;
 if (typeof label === "number") return String(label);
 return "Painel";
}

function stripAppPath(pathname: string): string {
 if (pathname === "/app") return "/";
 if (pathname.startsWith("/app/")) return pathname.slice("/app".length);
 return pathname;
}

function normalizeComparablePath(pathname: string): string {
 const [base] = pathname.split("?", 1);
 const normalized = base || "/";
 return normalized.endsWith("/") && normalized.length > 1 ? normalized.slice(0, -1) : normalized;
}

type NavigationMatch = {
 item: NavigationItem;
 module: NavigationItem;
 requirements: readonly NonNullable<NavigationItem["claim"]>[];
 title: string;
 moduleTitle: string;
 legacyHref?: string;
};

function flattenNavigationMatches(
 items: NavigationItem[],
 module?: NavigationItem,
 out: NavigationMatch[] = [],
 inheritedRequirements: readonly NonNullable<NavigationItem["claim"]>[] = [],
): NavigationMatch[] {
 for (const item of items) {
  const currentModule = module ?? item;
  const requirements = item.claim
   ? [...inheritedRequirements, item.claim]
   : inheritedRequirements;
  const target = item.legacyHref ?? item.to;
  if (target?.startsWith("/")) {
   out.push({
    item,
    module: currentModule,
    requirements,
    title: labelToString(item.label),
    moduleTitle: labelToString(currentModule.label),
    legacyHref: item.legacyHref,
   });
  }
  if (item.children?.length) {
   flattenNavigationMatches(item.children, currentModule, out, requirements);
  }
 }
 return out;
}

export function getNavigationRequirementsForPath(
 pathname: string,
): readonly NonNullable<NavigationItem["claim"]>[] {
 return getNavigationMatchForPath(pathname)?.requirements ?? [];
}

const navigationMatches = flattenNavigationMatches(adminNavigationItems);

export function getNavigationMatchForPath(pathname: string): NavigationMatch | null {
 const legacyPath = normalizeComparablePath(stripAppPath(pathname));
 let best: NavigationMatch | null = null;
 let bestLength = -1;

 for (const match of navigationMatches) {
  const target = normalizeComparablePath(match.legacyHref ?? match.item.to ?? "");
  if (!target) continue;
  const isMatch = target === "/" ? legacyPath === "/" : legacyPath === target || legacyPath.startsWith(`${target}/`);
  if (isMatch && target.length > bestLength) {
   best = match;
   bestLength = target.length;
  }
 }

 return best;
}
