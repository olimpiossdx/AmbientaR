import {
 AlertTriangle,
 BarChart3,
 CalendarDays,
 CheckCircle2,
 Clock3,
 CreditCard,
 FileSearch,
 FolderKanban,
 LineChart,
 Recycle,
 ShieldCheck,
 TrendingUp,
 UsersRound,
 WalletCards,
 Waves,
} from "lucide-react";
import type { HubGridItem, MetricGridItem, ProcessTableRow, TaskListItem } from "../../componentes";

export const environmentalMetrics: MetricGridItem[] = [
 {
  label: "Licencas validas",
  value: "128",
  detail: "de 146 registros ativos",
  tone: "emerald",
  icon: CheckCircle2,
 },
 {
  label: "Condicionantes pendentes",
  value: "23",
  detail: "7 atrasadas",
  tone: "amber",
  icon: AlertTriangle,
 },
 {
  label: "Outorgas ativas",
  value: "41",
  detail: "12 vencem em 180 dias",
  tone: "blue",
  icon: Waves,
 },
 {
  label: "Intervencoes ambientais",
  value: "18",
  detail: "autorizacoes cadastradas",
  tone: "slate",
  icon: Recycle,
 },
];

export const expiryMetrics: MetricGridItem[] = [
 {
  label: "Vencem em 30 dias",
  value: "5",
  detail: "acao imediata necessaria",
  tone: "red",
  icon: Clock3,
 },
 {
  label: "Vencem em 60 dias",
  value: "9",
  detail: "planejar renovacao",
  tone: "amber",
  icon: Clock3,
 },
 {
  label: "Vencem em 180 dias",
  value: "18",
  detail: "requerem acompanhamento",
  tone: "blue",
  icon: Clock3,
 },
 {
  label: "Vencidas",
  value: "3",
  detail: "regularizacao pendente",
  tone: "red",
  icon: AlertTriangle,
 },
];

export const financialMetrics: MetricGridItem[] = [
 {
  label: "Receita prevista",
  value: "R$ 284 mil",
  detail: "contratos e parcelas abertas",
  tone: "emerald",
  icon: WalletCards,
 },
 {
  label: "Vencimentos do mes",
  value: "36",
  detail: "12 aguardam confirmacao",
  tone: "amber",
  icon: CreditCard,
 },
 {
  label: "Inadimplencia",
  value: "4,8%",
  detail: "queda de 1,2 p.p.",
  tone: "blue",
  icon: TrendingUp,
 },
];

export const crmMetrics: MetricGridItem[] = [
 {
  label: "Oportunidades abertas",
  value: "54",
  detail: "pipeline comercial",
  tone: "blue",
  icon: LineChart,
 },
 {
  label: "Novos leads",
  value: "17",
  detail: "ultimos 7 dias",
  tone: "emerald",
  icon: UsersRound,
 },
 {
  label: "Propostas em analise",
  value: "11",
  detail: "aguardando retorno",
  tone: "amber",
  icon: FileSearch,
 },
];

export const officeTasks: TaskListItem[] = [
 {
  title: "Renovar licenca Fazenda Santa Clara",
  detail: "Preparar protocolo com comprovantes e condicionantes cumpridas.",
  status: "Hoje",
 },
 {
  title: "Validar documentos de outorga",
  detail: "Conferir pendencias antes do envio ao orgao ambiental.",
  status: "Em andamento",
 },
 {
  title: "Revisar contratos financeiros",
  detail: "Parcelas de consultoria com vencimento nos proximos 10 dias.",
  status: "Semana",
 },
];

export const agendaItems: TaskListItem[] = [
 {
  title: "Reuniao tecnica com cliente",
  detail: "Hoje, 14:00 - Licenciamento corretivo",
  status: "Hoje",
 },
 {
  title: "Vistoria de campo",
  detail: "Amanha, 08:30 - Area de intervencao",
  status: "Semana",
 },
 {
  title: "Entrega de relatorio",
  detail: "Sexta-feira - Educacao ambiental",
  status: "Semana",
 },
];

export const birthdayItems: TaskListItem[] = [
 {
  title: "Marina Albuquerque",
  detail: "Cliente - aniversario hoje",
  status: "Hoje",
 },
 {
  title: "Rafael Martins",
  detail: "Contato comercial - aniversario nesta semana",
  status: "Semana",
 },
 {
  title: "Helena Costa",
  detail: "Responsavel tecnico - enviar felicitacao",
  status: "Mes",
 },
];

export const recentRows: ProcessTableRow[] = [
 {
  process: "SEMAD 0412/2026",
  subject: "Renovacao de licenca operacional",
  status: "Em renovacao",
  dueDate: "18/07/2026",
  tone: "amber",
 },
 {
  process: "SUPRAM 8871/2026",
  subject: "Outorga de captacao subterranea",
  status: "Valida",
  dueDate: "02/12/2026",
  tone: "emerald",
 },
 {
  process: "IEF 3320/2026",
  subject: "Intervencao em area rural consolidada",
  status: "Em andamento",
  dueDate: "29/08/2026",
  tone: "blue",
 },
 {
  process: "FEAM 1908/2025",
  subject: "Condicionante de monitoramento",
  status: "Atrasada",
  dueDate: "24/06/2026",
  tone: "red",
 },
];

export const adminHubItems: HubGridItem[] = [
 {
  label: "Documentos ambientais",
  detail: "Licencas, outorgas, condicionantes e intervencoes.",
  icon: FileSearch,
 },
 {
  label: "Gestao de processos",
  detail: "Projetos ativos, prazos e responsaveis tecnicos.",
  icon: FolderKanban,
 },
 {
  label: "Financeiro",
  detail: "Contratos, faturas, recebimentos e inadimplencia.",
  icon: BarChart3,
 },
 {
  label: "Agenda",
  detail: "Compromissos tecnicos, vistorias e entregas.",
  icon: CalendarDays,
 },
 {
  label: "Acessos governamentais",
  detail: "SEI, SLA, CTF/IBAMA e consultas oficiais.",
  icon: ShieldCheck,
 },
 {
  label: "Estudos tecnicos",
  detail: "PCA, RCA, PIA, PRADA, barragens e relatorios.",
  icon: FileSearch,
 },
 {
  label: "Georeferenciamento",
  detail: "CAR, SIGEF/INCRA, memorial e validacoes.",
  icon: Waves,
 },
 {
  label: "Ferramentas do sistema",
  detail: "Templates, laudos, auditoria, RAG e integracoes.",
  icon: BarChart3,
 },
];
