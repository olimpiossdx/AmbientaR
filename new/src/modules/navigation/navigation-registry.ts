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
import type { AppShellNavItem } from "../../componentes";
import {
 allRoles,
 environmentalDocumentRoles,
 financialRoles,
 georefRoles,
 govRoles,
 internalEnvironmentalRoles,
 pcaRcaRoles,
 processRoles,
 salesRoles,
 canAccessNavItem,
 type UserRole,
} from "../auth/permissions";

const topLevelOrder = [
 "Painel",
 "Plano de Migração",
 "Acessos Governamentais",
 "Agenda",
 "AmbBot",
 "Cadastro",
 "Comunicação interna",
 "Documentos Ambientais",
 "Estudos Técnicos",
 "Ferramentas do Sistema",
 "Financeiro",
 "Financiamento Agrário",
 "Fiscal Ambiental Digital",
 "Georeferenciamento",
 "Gestão de Projetos e Processos",
 "IA",
 "Inteligência Ambiental",
 "Minha área RH",
 "Minha Carteira",
 "Multas e Defesas",
 "Ofícios",
 "Recursos Humanos",
 "Vendas & CRM",
 "Vistoria Técnica",
 "Webmail",
 "Catálogo UI",
];

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

function legacyItem(item: Omit<AppShellNavItem, "disabled">): AppShellNavItem {
 return { ...item, to: item.to ?? legacyHrefToAppPath(item.legacyHref), disabled: false };
}

function externalHref(url: string, title: string, newTab = false): string {
 const params = new URLSearchParams({ url, title });
 if (newTab) params.set("newTab", "true");
 return `/external?${params.toString()}`;
}

function listagemItems(kind: "pca" | "rca"): AppShellNavItem[] {
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
  roles: pcaRcaRoles,
 }));
}

export const adminNavigationItems: AppShellNavItem[] = [
 { to: "/app", legacyHref: "/", label: "Painel", icon: LayoutDashboard, roles: allRoles },
 { to: "/app/plano-migracao", legacyHref: "/plano-migracao", label: "Plano de Migração", icon: ClipboardList, roles: ["admin"] },
 legacyItem({ legacyHref: "/carteira", label: "Minha Carteira", icon: Briefcase, roles: ["consultor_representante", "client", "cliente_autonomo", "admin"] }),
 legacyItem({ legacyHref: "/analise-ambiental", label: "AmbBot", icon: Bot, roles: ["admin", "client", "cliente_autonomo", "representative", "technical", "gestor", "supervisor"] }),
 legacyItem({ legacyHref: "/comunicacao-interna", label: "Comunicação interna", icon: MessagesSquare, roles: ["admin", "technical", "sales", "financial", "gestor", "supervisor", "diretor_fauna", "advogado"] }),
 legacyItem({ legacyHref: "/financiamento-agrario", label: "Financiamento Agrário", icon: Leaf, roles: ["admin", "technical", "gestor", "supervisor", "financial"] }),
 {
  label: "IA",
  icon: Bot,
  roles: ["admin", "technical", "gestor", "supervisor", "diretor_fauna", "advogado"],
  children: [
   legacyItem({ legacyHref: "/studies/assistant?tipo=mira", label: "Águas / MIRA-IGAM", icon: Droplets, roles: internalEnvironmentalRoles }),
   legacyItem({ legacyHref: "/ia/fiscal-ambiental-digital", label: "Fiscal Ambiental Digital", icon: Globe, roles: internalEnvironmentalRoles }),
   legacyItem({ legacyHref: "/analise-ambiental", label: "Análise Geoespacial (IA)", icon: Globe, roles: internalEnvironmentalRoles }),
   legacyItem({ legacyHref: "/studies/analise-socioambiental", label: "Análise Socioambiental", icon: FileText, roles: internalEnvironmentalRoles }),
   legacyItem({ legacyHref: "/studies/assistant?tipo=mcp", label: "Cruzamento de dados", icon: Workflow, roles: internalEnvironmentalRoles }),
   legacyItem({ legacyHref: "/studies/assistant?tipo=geral", label: "Legislação e estudos", icon: BookOpenCheck, roles: internalEnvironmentalRoles }),
   legacyItem({ legacyHref: "/reporting", label: "Relatórios de IA", icon: Recycle, roles: ["admin", "financial"] }),
   legacyItem({ legacyHref: "/studies/assistant?tipo=rag", label: "Síntese de texto", icon: FileArchive, roles: internalEnvironmentalRoles }),
   legacyItem({ legacyHref: "/ai-lab/automations", label: "Automações IA", icon: Bot, roles: ["admin"] }),
  ],
 },
 {
  label: "Fiscal Ambiental Digital",
  icon: Globe,
  roles: internalEnvironmentalRoles,
  children: [
   legacyItem({ legacyHref: "/ia/fiscal-ambiental-digital/dashboard", label: "Início", icon: LayoutDashboard, roles: internalEnvironmentalRoles }),
   legacyItem({ legacyHref: "/ia/fiscal-ambiental-digital/montar-acervo", label: "Montar acervo", icon: Folder, roles: internalEnvironmentalRoles }),
   legacyItem({ legacyHref: "/ia/fiscal-ambiental-digital/biblioteca", label: "Biblioteca", icon: BookOpen, roles: internalEnvironmentalRoles }),
   legacyItem({ legacyHref: "/ia/fiscal-ambiental-digital/linha-do-tempo", label: "Linha do tempo", icon: History, roles: internalEnvironmentalRoles }),
   legacyItem({ legacyHref: "/ia/fiscal-ambiental-digital/comparador", label: "Comparar", icon: BarChart2, roles: internalEnvironmentalRoles }),
   legacyItem({ legacyHref: "/ia/fiscal-ambiental-digital/evidencias", label: "Evidências", icon: FileCheck, roles: internalEnvironmentalRoles }),
   legacyItem({ legacyHref: "/ia/fiscal-ambiental-digital/inteligencia", label: "Inteligência", icon: Sparkles, roles: internalEnvironmentalRoles }),
   legacyItem({ legacyHref: "/ia/fiscal-ambiental-digital/fiscalizacao", label: "Fiscalização", icon: SearchCheck, roles: internalEnvironmentalRoles }),
   legacyItem({ legacyHref: "/ia/fiscal-ambiental-digital/relatorios", label: "Relatórios", icon: FileText, roles: internalEnvironmentalRoles }),
   legacyItem({ legacyHref: "/ia/fiscal-ambiental-digital/monitoramento", label: "Monitoramento", icon: Signal, roles: internalEnvironmentalRoles }),
   legacyItem({ legacyHref: "/ia/fiscal-ambiental-digital/esg", label: "Auditoria ESG", icon: ShieldCheck, roles: internalEnvironmentalRoles }),
   legacyItem({ legacyHref: "/ia/fiscal-ambiental-digital/configuracoes", label: "Configurações", icon: Settings, roles: internalEnvironmentalRoles }),
  ],
 },
 legacyItem({ legacyHref: "/studies/assistant?tipo=geral", label: "Inteligência Ambiental", icon: Sparkles, roles: ["admin", "financial", "technical", "gestor", "supervisor", "diretor_fauna", "advogado"] }),
 legacyItem({ legacyHref: "/minha-area-rh", label: "Minha área RH", icon: UserCog, roles: allRoles }),
 {
  label: "Recursos Humanos",
  icon: Users,
  roles: ["admin", "supervisor"],
  children: [
   legacyItem({ legacyHref: "/recursos-humanos", label: "Painel RH", icon: LayoutDashboard, roles: ["admin", "supervisor"] }),
   legacyItem({ legacyHref: "/recursos-humanos/colaboradores", label: "Colaboradores", icon: Users, roles: ["admin", "supervisor"] }),
   legacyItem({ legacyHref: "/recursos-humanos/solicitacoes", label: "Solicitações", icon: ClipboardList, roles: ["admin", "supervisor"] }),
  ],
 },
 {
  label: "Financeiro",
  icon: Briefcase,
  roles: ["admin", "financial", "sales", "client", "representative"],
  children: [
   legacyItem({ legacyHref: "/bank-access", label: "Acesso Bancário", icon: Landmark, roles: financialRoles }),
   legacyItem({ legacyHref: "/clients", label: "Clientes", icon: Users, roles: ["admin", "sales", "financial"] }),
   legacyItem({ legacyHref: "/contracts", label: "Contratos", icon: FileSignature, roles: ["admin", "financial", "sales", "client", "representative"] }),
   legacyItem({ legacyHref: "/financial/platform-subscription-contracts", label: "Contratos Plataforma", icon: FileText, roles: financialRoles }),
   legacyItem({ legacyHref: "/contracts-suppliers", label: "Contratos-Fornecedores", icon: FileSignature, roles: ["admin", "financial", "sales"] }),
   legacyItem({ legacyHref: "/financial/abc-curve", label: "Curva ABC", icon: LineChart, roles: financialRoles }),
   legacyItem({ legacyHref: "/financial/bens-patrimonio", label: "Bens e Patrimônio", icon: Building2, roles: financialRoles }),
   legacyItem({ legacyHref: "/financial/dre-contabil", label: "DRE Contábil", icon: BarChart2, roles: financialRoles }),
   legacyItem({ legacyHref: "/invoices", label: "Faturas", icon: FileText, roles: ["admin", "financial", "client", "representative"] }),
   legacyItem({ legacyHref: "/suppliers", label: "Fornecedores", icon: Truck, roles: financialRoles }),
   legacyItem({ legacyHref: "/cash-flow", label: "Lançamentos de Caixa", icon: Landmark, roles: financialRoles }),
   legacyItem({ legacyHref: externalHref("https://www.nfe.fazenda.gov.br/portal/principal.aspx", "NFe Nacional", true), label: "NFe Nacional", icon: FileText, roles: financialRoles }),
   legacyItem({ legacyHref: "/commercial-proposals", label: "Orçamentos e Propostas", icon: ClipboardPenLine, roles: ["admin", "financial", "sales", "client", "cliente_autonomo", "representative"] }),
   legacyItem({ legacyHref: "/financial/painel", label: "Painel Financeiro", icon: BarChart2, roles: financialRoles }),
   legacyItem({ legacyHref: "/financial/projetos-roi", label: "Projetos & ROI", icon: TrendingUp, roles: ["admin", "financial", "sales"] }),
   legacyItem({ legacyHref: "/financial/fluxo-projetado", label: "Fluxo de Caixa Projetado", icon: TrendingUp, roles: financialRoles }),
   legacyItem({ legacyHref: "/financial/conciliacao", label: "Conciliação Bancária", icon: Landmark, roles: financialRoles }),
   legacyItem({ legacyHref: "/financial/billing-debug", label: "Debug PIX Assinatura", icon: Bug, roles: ["admin", "financial", "supervisor"] }),
   legacyItem({ legacyHref: "/financial/abc-servicos", label: "Curva ABC Serviços", icon: BarChart2, roles: financialRoles }),
   legacyItem({ legacyHref: "/financial/abc-fornecedores", label: "Curva ABC Fornecedores", icon: BarChart2, roles: financialRoles }),
   legacyItem({ legacyHref: "/financial/orcamento", label: "Orçamento Anual", icon: FileSpreadsheet, roles: financialRoles }),
   legacyItem({ legacyHref: "/financial/export-contabil", label: "Exportação Contábil", icon: FileDown, roles: financialRoles }),
   legacyItem({ legacyHref: "/studies/assistant?tipo=financeiro", label: "Assistente Financeiro (IA)", icon: Sparkles, roles: financialRoles }),
   legacyItem({ legacyHref: "/services", label: "Tabela de Serviços", icon: List, roles: financialRoles }),
  ],
 },
 {
  label: "Cadastro",
  icon: Book,
  roles: allRoles.filter((role) => role !== "consultor_representante"),
  children: [
   legacyItem({ legacyHref: "/users", label: "Usuários", icon: UserCog, roles: allRoles.filter((role) => role !== "consultor_representante") }),
   legacyItem({ legacyHref: "/empreendedores", label: "Empreendedores", icon: Contact, roles: allRoles.filter((role) => role !== "consultor_representante") }),
   legacyItem({ legacyHref: "/projects", label: "Empreendimentos", icon: Building, roles: allRoles.filter((role) => role !== "consultor_representante") }),
   legacyItem({ legacyHref: "/responsible-company", label: "Empresas", icon: Building2, roles: allRoles.filter((role) => role !== "consultor_representante") }),
  ],
 },
 {
  label: "Documentos Ambientais",
  icon: Recycle,
  roles: ["admin", "client", "cliente_autonomo", "representative", "technical", "gestor", "supervisor", "diretor_fauna", "advogado"],
  children: [
   legacyItem({ legacyHref: "/car", label: "CAR", icon: FileText, roles: environmentalDocumentRoles }),
   legacyItem({ legacyHref: "/compliance", label: "Condicionantes", icon: ClipboardCheck, roles: environmentalDocumentRoles }),
   legacyItem({ legacyHref: "/ctf-ibama", label: "CTF/IBAMA", icon: ShieldCheck, roles: environmentalDocumentRoles }),
   legacyItem({ legacyHref: "/intervencoes", label: "DAIA's", icon: Trees, roles: environmentalDocumentRoles }),
   legacyItem({ legacyHref: "/fauna", label: "Fauna", icon: Leaf, roles: [...environmentalDocumentRoles, "diretor_fauna"] }),
   legacyItem({ legacyHref: "/licenses", label: "Licenças", icon: FileCheck, roles: environmentalDocumentRoles }),
   legacyItem({ legacyHref: "/tacs", label: "TAC - Termo de Ajust. de Conduta", icon: Scale, roles: environmentalDocumentRoles }),
   legacyItem({ legacyHref: "/mtr-declaracao", label: "MTR-Declaração", icon: Truck, roles: environmentalDocumentRoles }),
   legacyItem({ legacyHref: "/documentos-ambientais/pasta-cliente", label: "Pasta do cliente", icon: Folder, roles: ["admin", "technical", "gestor", "supervisor", "financial"] }),
   {
    label: "Monitoramento de Outorga",
    icon: BookMarked,
    roles: environmentalDocumentRoles,
    children: [
     legacyItem({ legacyHref: "/monitoring/manual", label: "Lançamento Manual", icon: ClipboardList, roles: environmentalDocumentRoles }),
     legacyItem({ legacyHref: "/monitoring/telemetric", label: "Telemetria (Real-time)", icon: Signal, roles: environmentalDocumentRoles }),
    ],
   },
   legacyItem({ legacyHref: "/outorgas", label: "Outorgas", icon: Droplets, roles: environmentalDocumentRoles }),
   legacyItem({ legacyHref: "/usos-insignificantes", label: "Usos Insignificantes", icon: Waves, roles: environmentalDocumentRoles }),
  ],
 },
 {
  label: "Multas e Defesas",
  icon: Scale,
  roles: ["admin", "advogado", "technical", "gestor", "supervisor"],
  children: [
   legacyItem({ legacyHref: "/multas-defesas", label: "Consultar multas e defesas", icon: List, roles: ["admin", "advogado", "technical", "gestor", "supervisor"] }),
   legacyItem({ legacyHref: "/multas-defesas/nova", label: "Nova multa / processo", icon: PlusSquare, roles: ["admin", "advogado", "technical", "gestor", "supervisor"] }),
  ],
 },
 {
  label: "Vistoria Técnica",
  icon: SearchCheck,
  roles: ["admin", "technical", "gestor", "supervisor", "advogado"],
  children: [
   legacyItem({ legacyHref: "/inspections", label: "Consultar vistorias", icon: List, roles: ["admin", "technical", "gestor", "supervisor", "advogado"] }),
   legacyItem({ legacyHref: "/inspections/new", label: "Nova vistoria", icon: PlusSquare, roles: ["admin", "technical", "gestor", "supervisor", "advogado"] }),
   legacyItem({ legacyHref: "/inspections/reports", label: "Relatórios de Campo", icon: FileText, roles: ["admin", "technical", "gestor", "supervisor", "advogado"] }),
  ],
 },
 {
  label: "Gestão de Projetos e Processos",
  icon: FolderKanban,
  roles: processRoles,
  children: [
   legacyItem({ legacyHref: "/gestao-processos/projetos", label: "Projetos", icon: FolderKanban, roles: processRoles }),
   legacyItem({ legacyHref: "/gestao-processos/fluxo", label: "Fluxo de Processos", icon: GitBranch, roles: processRoles }),
   legacyItem({ legacyHref: "/gestao-processos/tarefas", label: "Tarefas", icon: ListTodo, roles: internalEnvironmentalRoles }),
   {
    label: "Indicadores de Prazos",
    icon: BarChart3,
    roles: ["admin", "gestor"],
    children: [
     legacyItem({ legacyHref: "/gestao-processos/indicadores", label: "Resumo", icon: LayoutDashboard, roles: ["admin", "gestor"] }),
     legacyItem({ legacyHref: "/gestao-processos/indicadores/analise", label: "Gráfico de Análise", icon: LineChart, roles: ["admin", "gestor"] }),
    ],
   },
  ],
 },
 {
  label: "Estudos Técnicos",
  icon: BookText,
  roles: internalEnvironmentalRoles,
  children: [
   legacyItem({ legacyHref: "/studies/educacao-ambiental", label: "Programa de Educação Ambiental", icon: BookOpenCheck, roles: internalEnvironmentalRoles }),
   legacyItem({ legacyHref: "/studies/acao-emergencial", label: "Programa de Ação Emergencial", icon: AlertTriangle, roles: internalEnvironmentalRoles }),
   legacyItem({ legacyHref: "/studies/eia-rima", label: "EIA/RIMA", icon: FileQuestion, roles: pcaRcaRoles }),
   legacyItem({ legacyHref: "/studies/cavidades", label: "Estudo de Cavidades", icon: Mountain, roles: internalEnvironmentalRoles }),
   legacyItem({ legacyHref: "/studies/fauna", label: "Estudos de Fauna", icon: Leaf, roles: internalEnvironmentalRoles }),
   legacyItem({ legacyHref: "/studies/ide-sisemanet", label: "IDE-SisemaNet", icon: MapPinned, roles: pcaRcaRoles }),
   {
    label: "Inventário Florestal",
    icon: ListTree,
    roles: pcaRcaRoles,
    children: [
     legacyItem({ legacyHref: "/studies/inventario", label: "Inventário Florestal", icon: ListTree, roles: pcaRcaRoles }),
     legacyItem({ legacyHref: "/coleta-campo", label: "Coleta de campo", icon: Smartphone, roles: ["admin", "technical", "gestor", "supervisor", "diretor_fauna"] }),
    ],
   },
   legacyItem({ legacyHref: "/studies/las-ras", label: "LAS-RAS", icon: FileSignature, roles: pcaRcaRoles }),
   legacyItem({ legacyHref: "/studies/reanalise", label: "Reanálise", icon: FileSignature, roles: pcaRcaRoles }),
   legacyItem({ legacyHref: "/studies/procuracao", label: "Procuração", icon: FileSignature, roles: pcaRcaRoles }),
   legacyItem({ legacyHref: "/studies/mapas", label: "Mapas", icon: Map, roles: pcaRcaRoles }),
   legacyItem({ legacyHref: "/studies/memorial-descritivo", label: "Memorial Descritivo", icon: FileText, roles: internalEnvironmentalRoles }),
   {
    label: "Outorgas (processos)",
    icon: Droplets,
    roles: pcaRcaRoles,
    children: [
     legacyItem({ legacyHref: "/studies/outorgas", label: "Processos", icon: ClipboardList, roles: pcaRcaRoles }),
     legacyItem({ legacyHref: "/studies/outorgas/new", label: "Nova outorga", icon: PlusSquare, roles: pcaRcaRoles }),
    ],
   },
   { label: "PCA", icon: BookMarked, roles: pcaRcaRoles, children: [legacyItem({ legacyHref: "/studies/pca", label: "Lista de PCAs", icon: List, roles: pcaRcaRoles }), ...listagemItems("pca")] },
   legacyItem({ legacyHref: "/studies/pia", label: "PIA", icon: FileCheck, roles: pcaRcaRoles }),
   legacyItem({ legacyHref: "/studies/prada", label: "PRADA", icon: Leaf, roles: pcaRcaRoles }),
   {
    label: "Projetos e Segurança de Barragens",
    icon: Building2,
    roles: pcaRcaRoles,
    children: [
     legacyItem({ legacyHref: "/studies/barragens", label: "Visão geral", icon: LayoutGrid, roles: pcaRcaRoles }),
     legacyItem({ legacyHref: "/studies/barragem", label: "Projeto técnico", icon: FileText, roles: pcaRcaRoles }),
     legacyItem({ legacyHref: "/studies/seguranca-barragens", label: "Segurança e emergência", icon: Shield, roles: pcaRcaRoles }),
     legacyItem({ legacyHref: "/studies/piscinao-off-stream", label: "Piscinão (off-stream)", icon: Waves, roles: pcaRcaRoles }),
    ],
   },
   legacyItem({ legacyHref: "/studies/ptrf", label: "PTRF", icon: Trees, roles: pcaRcaRoles }),
   { label: "RCA", icon: NotebookText, roles: pcaRcaRoles, children: [legacyItem({ legacyHref: "/studies/rca", label: "Lista de RCAs", icon: List, roles: pcaRcaRoles }), ...listagemItems("rca")] },
   {
    label: "Relatórios Diversos",
    icon: FileArchive,
    roles: internalEnvironmentalRoles,
    children: [
     legacyItem({ legacyHref: "/studies/relatorios-diversos", label: "Visão geral", icon: FileArchive, roles: internalEnvironmentalRoles }),
     legacyItem({ legacyHref: "/studies/relatorios-diversos/carvao-vegetal", label: "Carvão vegetal", icon: FileText, roles: internalEnvironmentalRoles }),
     legacyItem({ legacyHref: "/studies/relatorios-diversos/ptrf-prad", label: "PTRF / PRAD", icon: Trees, roles: internalEnvironmentalRoles }),
     legacyItem({ legacyHref: "/studies/relatorios-diversos/transporte-residuos", label: "Transporte de resíduos", icon: Truck, roles: internalEnvironmentalRoles }),
    ],
   },
   legacyItem({ legacyHref: "/studies/mtr", label: "MTR-MG (resíduos)", icon: Recycle, roles: pcaRcaRoles }),
   {
    label: "Compensação Ambiental",
    icon: Scale,
    roles: pcaRcaRoles,
    children: [
     legacyItem({ legacyHref: "/studies/compensacao-ambiental", label: "Visão geral", icon: Scale, roles: pcaRcaRoles }),
     legacyItem({ legacyHref: "/studies/compensacao-ambiental/especies", label: "Espécies protegidas", icon: Trees, roles: pcaRcaRoles }),
     legacyItem({ legacyHref: "/studies/compensacao-ambiental/snuc", label: "SNUC", icon: Scale, roles: pcaRcaRoles }),
     legacyItem({ legacyHref: "/studies/compensacao-ambiental/mata-atlantica", label: "Mata Atlântica", icon: Leaf, roles: pcaRcaRoles }),
     legacyItem({ legacyHref: "/studies/compensacao-ambiental/mineraria", label: "Minerária", icon: Building2, roles: pcaRcaRoles }),
     legacyItem({ legacyHref: "/studies/compensacao-ambiental/app", label: "Intervenção em APP", icon: Droplets, roles: pcaRcaRoles }),
    ],
   },
   legacyItem({ legacyHref: "/studies/reserva-legal", label: "Reserva Legal", icon: ShieldCheck, roles: pcaRcaRoles }),
  ],
 },
 {
  label: "Georeferenciamento",
  icon: Crosshair,
  roles: georefRoles,
  children: [
   legacyItem({ legacyHref: "/georeferenciamento", label: "Painel", icon: LayoutDashboard, roles: georefRoles }),
   legacyItem({ legacyHref: "/georeferenciamento/processos", label: "Trâmites fundiários", icon: FolderKanban, roles: georefRoles }),
   legacyItem({ legacyHref: "/georeferenciamento/rural", label: "Rural (SIGEF/INCRA)", icon: Trees, roles: georefRoles }),
   legacyItem({ legacyHref: "/georeferenciamento/urbano", label: "Urbano (cartório)", icon: Building2, roles: georefRoles }),
   legacyItem({ legacyHref: "/georeferenciamento/ambiental", label: "CAR / SICAR", icon: Leaf, roles: georefRoles }),
   legacyItem({ legacyHref: "/georeferenciamento/historico-car", label: "Histórico CAR", icon: History, roles: georefRoles }),
   legacyItem({ legacyHref: "/georeferenciamento/campo", label: "Campo e levantamento", icon: Crosshair, roles: georefRoles }),
   legacyItem({ legacyHref: "/georeferenciamento/documentos", label: "Documentação técnica", icon: FileSpreadsheet, roles: georefRoles }),
   legacyItem({ legacyHref: "/georeferenciamento/memorial-descritivo", label: "Memorial descritivo", icon: FileText, roles: georefRoles }),
   legacyItem({ legacyHref: "/georeferenciamento/validacoes", label: "Validações", icon: Scale, roles: georefRoles }),
   legacyItem({ legacyHref: "/georeferenciamento/registro", label: "Cartório e registro", icon: BookOpen, roles: georefRoles }),
   legacyItem({ legacyHref: "/georeferenciamento/referencias", label: "Referências normativas", icon: BookOpenCheck, roles: georefRoles }),
  ],
 },
 {
  label: "Vendas & CRM",
  icon: ShoppingCart,
  roles: salesRoles,
  children: [
   legacyItem({ legacyHref: "/crm/alerts", label: "Alertas & Notificações", icon: Bell, roles: salesRoles }),
   legacyItem({ legacyHref: "/crm/settings", label: "Configurações CRM", icon: Settings, roles: salesRoles }),
   legacyItem({ legacyHref: "/crm/team", label: "Equipe & Desempenho", icon: Users, roles: salesRoles }),
   legacyItem({ legacyHref: "/crm/clients", label: "Gestão de Clientes", icon: Users, roles: salesRoles }),
   legacyItem({ legacyHref: "/social-media", label: "Mídias Sociais", icon: Share2, roles: salesRoles }),
   legacyItem({ legacyHref: "/crm/opportunities", label: "Oportunidades & Pipeline", icon: FolderKanban, roles: salesRoles }),
   legacyItem({ legacyHref: "/crm", label: "Painel de Vendas", icon: LayoutDashboard, roles: salesRoles }),
   legacyItem({ legacyHref: "/crm/reports", label: "Relatórios & Análises", icon: BarChart2, roles: salesRoles }),
   legacyItem({ legacyHref: "/crm/proposals", label: "Vendas & Propostas", icon: FileText, roles: salesRoles }),
  ],
 },
 legacyItem({ legacyHref: "/external?url=https%3A%2F%2Fconsultoriapimenta.com.br%3A2096%2F&title=Webmail", label: "Webmail", icon: Send, roles: ["admin", "technical", "sales", "financial", "gestor", "supervisor", "diretor_fauna", "advogado"] }),
 legacyItem({ legacyHref: "/oficios", label: "Ofícios", icon: Mail, roles: ["admin", "client", "cliente_autonomo", "technical", "sales", "financial", "gestor", "supervisor", "diretor_fauna", "advogado"] }),
 {
  label: "Acessos Governamentais",
  icon: LinkIcon,
  roles: govRoles,
  children: [
   legacyItem({ legacyHref: externalHref("https://sistemas.meioambiente.mg.gov.br/consulta-intervencao/site/listar-decisoes", "Consulta Intervenção Ambiental"), label: "Consulta Intervenção Ambiental", icon: BookText, roles: govRoles }),
   legacyItem({ legacyHref: externalHref("https://sistemas.meioambiente.mg.gov.br/licenciamento/site/consulta-licenca", "Consulta de Licenças"), label: "Consulta Licenciamento", icon: BookText, roles: govRoles }),
   legacyItem({ legacyHref: externalHref("https://sistemas.meioambiente.mg.gov.br/licenciamento/site/lista-outorgas", "Consulta de Outorgas"), label: "Consulta Outorgas", icon: BookText, roles: govRoles }),
   legacyItem({ legacyHref: externalHref("https://servicos.ibama.gov.br/ctf/", "CTF/IBAMA", true), label: "CTF/IBAMA", icon: LinkIcon, roles: govRoles }),
   legacyItem({ legacyHref: externalHref("https://visualizador.idesisema.meioambiente.mg.gov.br/", "IDE-SisemaNet-MG"), label: "IDE-SisemaNet-MG", icon: Globe, roles: govRoles }),
   legacyItem({ legacyHref: externalHref("https://sei.ibama.gov.br/controlador_externo.php?acao=usuario_externo_logar&id_orgao_acesso_externo=0", "SEI-IBAMA", true), label: "SEI-IBAMA", icon: LinkIcon, roles: govRoles }),
   legacyItem({ legacyHref: externalHref("https://www.sei.mg.gov.br/sei/controlador_externo.php?acao=usuario_externo_logar&id_orgao_acesso_externo=0", "SEI-MG", true), label: "SEI-MG", icon: LinkIcon, roles: govRoles }),
   legacyItem({ legacyHref: externalHref("https://ecosistemas.meioambiente.mg.gov.br/portalseguranca/login", "SLA-Ecossistemas-MG", true), label: "SLA-Ecossistemas/MG", icon: LinkIcon, roles: govRoles }),
  ],
 },
 {
  label: "Ferramentas do Sistema",
  icon: Settings,
  roles: allRoles.filter((role) => role !== "consultor_representante"),
  children: [
   {
    label: "Empresa e Aparência",
    icon: Building,
    children: [
     legacyItem({ legacyHref: "/settings/company", label: "Informações da Empresa", icon: Building, roles: ["admin"] }),
     legacyItem({ legacyHref: "/technical-responsible", label: "Responsáveis Técnicos", icon: HardHat, roles: ["admin", "supervisor", "gestor"] }),
     legacyItem({ legacyHref: "/settings#identidade-visual", label: "Identidade Visual", icon: Palette, roles: ["admin"] }),
     legacyItem({ legacyHref: "/settings/appearance", label: "Aparência", icon: Palette, roles: allRoles.filter((role) => role !== "consultor_representante") }),
    ],
   },
   {
    label: "Documentos e Modelos",
    icon: FileText,
    children: [
     legacyItem({ legacyHref: "/settings/templates", label: "Templates", icon: FileText, roles: ["admin"] }),
     legacyItem({ legacyHref: "/laudos", label: "Laudos", icon: BookOpenCheck, roles: ["admin", "technical", "gestor", "supervisor"] }),
     legacyItem({ legacyHref: "/consultas", label: "Consultas Técnicas", icon: FileQuestion, roles: ["admin", "technical", "gestor", "supervisor", "financial"] }),
    ],
   },
   {
    label: "IA, RAG e Integrações",
    icon: Bot,
    children: [
     legacyItem({ legacyHref: "/configuracoes/mcp-rag", label: "MCP + RAG / Inteligência do Sistema", icon: DatabaseZap, roles: ["admin"] }),
     legacyItem({ legacyHref: "/knowledge-sources", label: "Fontes de Conhecimento (RAG)", icon: BookMarked, roles: ["admin"] }),
     legacyItem({ legacyHref: "/ai-lab/cloud-library", label: "Biblioteca IA (OneDrive)", icon: Folder, roles: ["admin"] }),
     legacyItem({ legacyHref: "/settings/onedrive-integration", label: "Integração OneDrive", icon: LinkIcon, roles: ["admin"] }),
     legacyItem({ legacyHref: "/ai-lab/mcp", label: "Ferramentas MCP (lab)", icon: Workflow, roles: ["admin"] }),
     legacyItem({ legacyHref: "/ai-lab/rag", label: "Laboratório RAG", icon: BookMarked, roles: ["admin"] }),
     legacyItem({ legacyHref: "/settings/ai-local-source", label: "Importação IA (legado local)", icon: DatabaseZap, roles: ["admin"] }),
    ],
   },
   {
    label: "Administração e Auditoria",
    icon: ShieldCheck,
    children: [
     legacyItem({ legacyHref: "/settings/deleted-backups", label: "Backup de Dados Apagados", icon: History, roles: ["admin", "supervisor"] }),
     legacyItem({ legacyHref: "/settings/files", label: "Explorador de Arquivos", icon: Folder, roles: ["admin"] }),
     legacyItem({ legacyHref: "/audit-log", label: "Log de Auditoria", icon: History, roles: ["admin", "supervisor"] }),
     legacyItem({ legacyHref: "/canais", label: "Canais (WhatsApp/IG)", icon: MessagesSquare, roles: ["admin"] }),
    ],
   },
  ],
 },
 legacyItem({ legacyHref: "/calendar", label: "Agenda", icon: Calendar, roles: ["admin", "technical", "financial", "gestor", "client", "cliente_autonomo", "representative", "supervisor", "sales", "diretor_fauna", "advogado"] }),
 { to: "/app/exemplos", label: "Catálogo UI", icon: FileSearch, roles: ["admin"] },
];

function isAllowedForRole(item: AppShellNavItem, role?: string) {
 return canAccessNavItem(item, role);
}

function labelToString(label: AppShellNavItem["label"]): string {
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
 item: AppShellNavItem;
 module: AppShellNavItem;
 title: string;
 moduleTitle: string;
 legacyHref?: string;
};

function flattenNavigationMatches(
 items: AppShellNavItem[],
 module?: AppShellNavItem,
 out: NavigationMatch[] = [],
): NavigationMatch[] {
 for (const item of items) {
  const currentModule = module ?? item;
  const target = item.legacyHref ?? item.to;
  if (target?.startsWith("/")) {
   out.push({
    item,
    module: currentModule,
    title: labelToString(item.label),
    moduleTitle: labelToString(currentModule.label),
    legacyHref: item.legacyHref,
   });
  }
  if (item.children?.length) flattenNavigationMatches(item.children, currentModule, out);
 }
 return out;
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

export function getNavigationItemsForRole(role?: UserRole | string): AppShellNavItem[] {
 const filterItems = (items: AppShellNavItem[]): AppShellNavItem[] => items
  .filter((item) => isAllowedForRole(item, role))
  .map((item) => {
   const children = item.children ? filterItems(item.children) : undefined;
   return { ...item, children };
  })
  .filter((item) => !item.children || item.children.length > 0);

 return filterItems(adminNavigationItems).sort((left, right) => {
  const leftIndex = topLevelOrder.indexOf(String(left.label));
  const rightIndex = topLevelOrder.indexOf(String(right.label));
  const normalizedLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
  const normalizedRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;
  return normalizedLeft - normalizedRight;
 });
}
