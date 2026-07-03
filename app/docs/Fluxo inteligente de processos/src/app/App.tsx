import { useState, useMemo } from "react";
import {
  Search, Plus, X, Clock, MapPin, Calendar,
  CheckCircle2, BarChart3, ClipboardList,
  Home, Settings, Bell, Building2,
  Paperclip, MessageSquare, Download,
  AlertCircle, ChevronRight, Droplets, Shield,
  ArrowRight, List, LayoutGrid, TreePine,
  Activity, GitBranch, FolderOpen, Leaf,
  AlertTriangle, Eye, RefreshCw, ChevronDown,
  ChevronLeft, Tag, User, Hash, Layers,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

type StageId =
  | "entrada" | "analise_doc" | "analise_tec"
  | "vistoria" | "parecer" | "aprovacao" | "concluido";

type Priority = "Alta" | "Média" | "Baixa";
type ProcessGroup = "outorga" | "licenciamento" | "intervencao";
type ProjectStatus = "ativo" | "suspenso" | "concluido" | "cancelado";
type AppSection = "projetos" | "fluxo";

interface HistoryEntry {
  date: string;
  action: string;
  user: string;
  note?: string;
}

interface ProcessItem {
  id: string;
  number: string;
  typeCode: string;
  requester: string;
  municipality: string;
  responsible: string;
  responsibleUnit: string;
  stage: StageId;
  priority: Priority;
  deadline: string;
  openedAt: string;
  description: string;
  documents: number;
  comments: number;
  area?: string;
  projectId?: string;
  group?: ProcessGroup;
  history: HistoryEntry[];
}

interface Project {
  id: string;
  code: string;
  name: string;
  empreendedor: string;
  cnpj?: string;
  municipality: string;
  type: string;
  status: ProjectStatus;
  createdAt: string;
  manager: string;
  description: string;
  area?: string;
  processIds: { outorga: string[]; licenciamento: string[]; intervencao: string[] };
}

// ─── Stage & Type config ────────────────────────────────────────────────────

const STAGES: { id: StageId; label: string; short: string; color: string; bg: string }[] = [
  { id: "entrada",     label: "Entrada / Protocolo",      short: "Entrada",    color: "#3B82F6", bg: "#EFF6FF" },
  { id: "analise_doc", label: "Análise Documental",        short: "Anál. Doc.", color: "#8B5CF6", bg: "#F5F3FF" },
  { id: "analise_tec", label: "Análise Técnica",           short: "Anál. Téc.", color: "#EC4899", bg: "#FDF2F8" },
  { id: "vistoria",    label: "Vistoria de Campo",         short: "Vistoria",   color: "#F97316", bg: "#FFF7ED" },
  { id: "parecer",     label: "Parecer Técnico",           short: "Parecer",    color: "#EAB308", bg: "#FEFCE8" },
  { id: "aprovacao",   label: "Aprovação / Despacho",      short: "Aprovação",  color: "#10B981", bg: "#ECFDF5" },
  { id: "concluido",   label: "Concluído / Arquivado",     short: "Concluído",  color: "#6B7280", bg: "#F9FAFB" },
];

const PROCESS_TYPES: Record<string, { label: string; color: string; bg: string }> = {
  LAP: { label: "Lic. Ambiental Prévia",         color: "#166534", bg: "#DCFCE7" },
  LAI: { label: "Lic. Ambiental Instalação",      color: "#14532D", bg: "#BBF7D0" },
  LAO: { label: "Lic. Ambiental Operação",        color: "#15803D", bg: "#D1FAE5" },
  ASV: { label: "Autoriz. Supressão Vegetal",     color: "#92400E", bg: "#FEF3C7" },
  OUA: { label: "Outorga de Uso de Água",         color: "#1E40AF", bg: "#DBEAFE" },
  LAS: { label: "Lic. Ambiental Simplificada",    color: "#5B21B6", bg: "#EDE9FE" },
  AIA: { label: "Aval. de Impacto Ambiental",     color: "#9F1239", bg: "#FFE4E6" },
  AI:  { label: "Auto de Infração",               color: "#7F1D1D", bg: "#FECACA" },
  INT: { label: "Intervenção em APP",             color: "#B45309", bg: "#FEF9C3" },
};

const PROCESS_GROUPS: Record<ProcessGroup, { label: string; icon: typeof Droplets; color: string; bg: string; border: string; types: string[] }> = {
  outorga: {
    label: "Outorga de Recursos Hídricos",
    icon: Droplets,
    color: "#1E40AF",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    types: ["OUA"],
  },
  licenciamento: {
    label: "Licenciamento / Dispensa Ambiental",
    icon: Leaf,
    color: "#166534",
    bg: "#F0FDF4",
    border: "#BBF7D0",
    types: ["LAP", "LAI", "LAO", "LAS", "AIA"],
  },
  intervencao: {
    label: "Intervenção Ambiental (APP/ASV)",
    icon: TreePine,
    color: "#92400E",
    bg: "#FFFBEB",
    border: "#FDE68A",
    types: ["ASV", "INT", "AI"],
  },
};

const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bg: string; dot: string }> = {
  ativo:     { label: "Ativo",     color: "#166534", bg: "#DCFCE7", dot: "bg-emerald-500" },
  suspenso:  { label: "Suspenso",  color: "#92400E", bg: "#FEF3C7", dot: "bg-amber-500"   },
  concluido: { label: "Concluído", color: "#374151", bg: "#F3F4F6", dot: "bg-gray-400"    },
  cancelado: { label: "Cancelado", color: "#7F1D1D", bg: "#FEE2E2", dot: "bg-red-400"     },
};

// ─── Utilities ──────────────────────────────────────────────────────────────

const formatDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

const daysUntil = (d: string) =>
  Math.ceil((new Date(d + "T00:00:00").getTime() - Date.now()) / 86400000);

const isOverdue = (deadline: string, stage: StageId) =>
  stage !== "concluido" && new Date(deadline + "T00:00:00") < new Date();

const priorityConfig = (p: Priority) => ({
  Alta:  { dot: "bg-red-500",   text: "text-red-700",   bg: "bg-red-50",   border: "border-red-200"   },
  Média: { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  Baixa: { dot: "bg-blue-400",  text: "text-blue-600",  bg: "bg-blue-50",  border: "border-blue-200"  },
}[p]);

// ─── Data ───────────────────────────────────────────────────────────────────

const INITIAL_PROCESSES: ProcessItem[] = [
  {
    id: "1", number: "SEMAD-2024-LAP-001547", typeCode: "LAP",
    requester: "Vale do Rio Doce Mineração S.A.", municipality: "Mariana",
    responsible: "Dra. Beatriz Carvalho", responsibleUnit: "SUPRAM Leste",
    stage: "analise_tec", priority: "Alta", deadline: "2025-03-15", openedAt: "2024-09-10",
    description: "LP para nova área de disposição de rejeitos de mineração, incluindo análise de impactos cumulativos na bacia do Rio Doce.",
    documents: 47, comments: 12, area: "2.450 ha", projectId: "proj-3", group: "licenciamento",
    history: [
      { date: "2025-01-15", action: "Encaminhado para Análise Técnica", user: "Ana Lima", note: "Documentação completa verificada" },
      { date: "2024-12-01", action: "Análise Documental concluída", user: "Carlos Souza" },
      { date: "2024-09-10", action: "Protocolo registrado", user: "Sistema SEMAD" },
    ],
  },
  {
    id: "2", number: "SEMAD-2024-ASV-003221", typeCode: "ASV",
    requester: "Fazenda Santa Rita Agropecuária Ltda", municipality: "Uberlândia",
    responsible: "Eng. Roberto Almeida", responsibleUnit: "SUPRAM Triângulo",
    stage: "vistoria", priority: "Média", deadline: "2025-02-20", openedAt: "2024-10-05",
    description: "Autorização de supressão vegetal para implantação de pastagem tecnificada em remanescente de Cerrado. Compensação ambiental prevista.",
    documents: 23, comments: 5, area: "85 ha", projectId: "proj-6", group: "intervencao",
    history: [
      { date: "2025-01-20", action: "Vistoria agendada para 10/02/2025", user: "Roberto Almeida" },
      { date: "2024-11-30", action: "Análise Técnica aprovada", user: "Fernanda Costa" },
      { date: "2024-10-05", action: "Protocolo registrado", user: "Sistema SEMAD" },
    ],
  },
  {
    id: "3", number: "SEMAD-2025-LAO-000089", typeCode: "LAO",
    requester: "Cimentos Minas Gerais S.A.", municipality: "Contagem",
    responsible: "Dra. Mariana Santos", responsibleUnit: "SUPRAM Central",
    stage: "parecer", priority: "Alta", deadline: "2025-04-10", openedAt: "2025-01-08",
    description: "Renovação de LO para planta cimenteira com capacidade de 3,2 Mt/ano. Análise de emissões atmosféricas e revisão de condicionantes.",
    documents: 31, comments: 8, area: "180 ha", projectId: "proj-5", group: "licenciamento",
    history: [
      { date: "2025-02-01", action: "Parecer técnico em elaboração", user: "Mariana Santos" },
      { date: "2025-01-25", action: "Vistoria de campo realizada", user: "Paulo Mendes", note: "Conformidade verificada" },
      { date: "2025-01-08", action: "Protocolo registrado", user: "Sistema SEMAD" },
    ],
  },
  {
    id: "4", number: "SEMAD-2025-OUA-000234", typeCode: "OUA",
    requester: "Prefeitura Municipal de Patos de Minas", municipality: "Patos de Minas",
    responsible: "Eng. Tiago Ferreira", responsibleUnit: "IGAM / SUPRAM Noroeste",
    stage: "entrada", priority: "Baixa", deadline: "2025-06-30", openedAt: "2025-02-03",
    description: "Outorga de uso de recursos hídricos — captação no Rio Paranaíba para abastecimento público municipal. Vazão solicitada: 350 L/s.",
    documents: 12, comments: 2,
    history: [{ date: "2025-02-03", action: "Protocolo registrado", user: "Sistema SEMAD" }],
  },
  {
    id: "5", number: "SEMAD-2024-LAI-002876", typeCode: "LAI",
    requester: "UHE Araguari Energia S.A.", municipality: "Araguari",
    responsible: "Dra. Camila Rodrigues", responsibleUnit: "SUPRAM Triângulo",
    stage: "aprovacao", priority: "Alta", deadline: "2025-03-05", openedAt: "2024-07-22",
    description: "LI para usina hidrelétrica de 78 MW. Inclui plano de usos múltiplos do reservatório e programas de compensação ambiental.",
    documents: 89, comments: 21, area: "4.200 ha", projectId: "proj-2", group: "licenciamento",
    history: [
      { date: "2025-02-10", action: "Aprovação em análise pelo Secretário", user: "Dir. Heitor Prado" },
      { date: "2025-01-28", action: "Parecer técnico favorável emitido", user: "Camila Rodrigues", note: "Com condicionantes" },
      { date: "2024-07-22", action: "Protocolo registrado", user: "Sistema SEMAD" },
    ],
  },
  {
    id: "6", number: "SEMAD-2025-LAS-000567", typeCode: "LAS",
    requester: "Auto Posto Estrela do Sul Ltda", municipality: "Varginha",
    responsible: "Téc. Ana Oliveira", responsibleUnit: "SUPRAM Sul",
    stage: "analise_doc", priority: "Baixa", deadline: "2025-05-15", openedAt: "2025-01-20",
    description: "Licença ambiental simplificada para posto de combustível com área de lavagem e troca de óleo. Empreendimento Classe 2.",
    documents: 8, comments: 1,
    history: [
      { date: "2025-01-25", action: "Análise documental iniciada", user: "Ana Oliveira" },
      { date: "2025-01-20", action: "Protocolo registrado", user: "Sistema SEMAD" },
    ],
  },
  {
    id: "7", number: "SEMAD-2024-ASV-003890", typeCode: "ASV",
    requester: "Cooperativa Agrop. Triângulo Mineiro", municipality: "Uberaba",
    responsible: "Eng. Lucas Pereira", responsibleUnit: "SUPRAM Triângulo",
    stage: "concluido", priority: "Média", deadline: "2025-01-10", openedAt: "2024-08-15",
    description: "Autorização de supressão vegetal para expansão de área agrícola. ASV concedida com condicionantes de recomposição de APP.",
    documents: 19, comments: 7, area: "120 ha",
    history: [
      { date: "2025-01-08", action: "ASV expedida e arquivada", user: "Lucas Pereira", note: "Publicada no MG Ambiental" },
      { date: "2024-12-20", action: "Aprovação pelo diretor", user: "Dir. Heitor Prado" },
      { date: "2024-08-15", action: "Protocolo registrado", user: "Sistema SEMAD" },
    ],
  },
  {
    id: "8", number: "SEMAD-2025-AIA-000012", typeCode: "AIA",
    requester: "Ferrovia Centro-Atlântica S.A.", municipality: "BH / Regional",
    responsible: "Dr. Fernando Gomes", responsibleUnit: "COPAM / SEMAD Central",
    stage: "analise_tec", priority: "Alta", deadline: "2025-08-25", openedAt: "2025-01-15",
    description: "EIA/RIMA para duplicação de ramal ferroviário de 340 km entre BH e Vitória. Processo prioritário PAC Ferroviário.",
    documents: 124, comments: 34, area: "340 km", projectId: "proj-4", group: "licenciamento",
    history: [
      { date: "2025-02-05", action: "Equipe técnica multidisciplinar formada", user: "Dr. Fernando Gomes" },
      { date: "2025-01-22", action: "Análise documental aprovada", user: "Equipe COPAM" },
      { date: "2025-01-15", action: "Protocolo registrado — processo prioritário", user: "Sistema SEMAD" },
    ],
  },
  {
    id: "9", number: "SEMAD-2025-LAP-000345", typeCode: "LAP",
    requester: "Serra Verde Energia Renovável Ltda", municipality: "Montes Claros",
    responsible: "Eng. Sofia Monteiro", responsibleUnit: "SUPRAM Norte",
    stage: "analise_doc", priority: "Média", deadline: "2025-07-10", openedAt: "2025-02-01",
    description: "LP para parque eólico com 28 aerogeradores e capacidade instalada de 112 MW no Norte de Minas Gerais.",
    documents: 38, comments: 4, area: "1.850 ha", projectId: "proj-1", group: "licenciamento",
    history: [
      { date: "2025-02-10", action: "Documentação em análise", user: "Sofia Monteiro" },
      { date: "2025-02-01", action: "Protocolo registrado", user: "Sistema SEMAD" },
    ],
  },
  {
    id: "10", number: "SEMAD-2024-AI-004521", typeCode: "AI",
    requester: "Madeireira Floresta Nativa ME", municipality: "Teófilo Otoni",
    responsible: "Fis. Rodrigo Castro", responsibleUnit: "SUPRAM Jequitinhonha",
    stage: "aprovacao", priority: "Alta", deadline: "2025-02-28", openedAt: "2024-11-10",
    description: "Auto de infração por extração ilegal de madeira em APP — 32 ha de Mata Atlântica. Multa de R$ 450.000,00.",
    documents: 15, comments: 9, area: "32 ha",
    history: [
      { date: "2025-02-08", action: "Recurso analisado — mantida a autuação", user: "Dir. Jurídico" },
      { date: "2025-01-15", action: "Defesa apresentada pelo autuado", user: "Adv. Paulo Neves" },
      { date: "2024-11-10", action: "Auto de infração lavrado", user: "Fis. Rodrigo Castro" },
    ],
  },
  {
    id: "11", number: "SEMAD-2025-OUA-000456", typeCode: "OUA",
    requester: "Fazenda Santa Rita Agropecuária Ltda", municipality: "Uberlândia",
    responsible: "Eng. Pedro Barbosa", responsibleUnit: "IGAM / SUPRAM Triângulo",
    stage: "parecer", priority: "Média", deadline: "2025-05-20", openedAt: "2025-01-10",
    description: "Outorga para irrigação de pastagem tecnificada. Captação no Ribeirão das Antas — 45 L/s.",
    documents: 17, comments: 3, projectId: "proj-6", group: "outorga",
    history: [
      { date: "2025-02-12", action: "Parecer de disponibilidade hídrica em elaboração", user: "Pedro Barbosa" },
      { date: "2025-01-30", action: "Vistoria hidrológica realizada", user: "Equipe IGAM" },
      { date: "2025-01-10", action: "Protocolo registrado", user: "Sistema SEMAD" },
    ],
  },
  {
    id: "12", number: "SEMAD-2024-OUA-001200", typeCode: "OUA",
    requester: "UHE Araguari Energia S.A.", municipality: "Araguari",
    responsible: "Dra. Camila Rodrigues", responsibleUnit: "IGAM / SUPRAM Triângulo",
    stage: "analise_tec", priority: "Alta", deadline: "2025-04-15", openedAt: "2024-08-10",
    description: "Outorga de barramento e captação para formação do reservatório da UHE Araguari. Vazão regularizada de 185 m³/s no Rio Araguari.",
    documents: 32, comments: 8, projectId: "proj-2", group: "outorga",
    history: [
      { date: "2025-01-18", action: "Análise técnica em curso", user: "Equipe IGAM" },
      { date: "2024-11-05", action: "Análise documental concluída", user: "Tiago Ferreira" },
      { date: "2024-08-10", action: "Protocolo registrado", user: "Sistema SEMAD" },
    ],
  },
  {
    id: "13", number: "SEMAD-2024-ASV-002100", typeCode: "ASV",
    requester: "UHE Araguari Energia S.A.", municipality: "Araguari",
    responsible: "Dra. Camila Rodrigues", responsibleUnit: "SUPRAM Triângulo",
    stage: "vistoria", priority: "Alta", deadline: "2025-03-20", openedAt: "2024-09-01",
    description: "ASV para formação do reservatório da UHE — supressão de mata ciliar e vegetação nativa em 840 ha. Compensação prevista em RPPN.",
    documents: 41, comments: 15, area: "840 ha", projectId: "proj-2", group: "intervencao",
    history: [
      { date: "2025-01-28", action: "Vistoria de campo agendada", user: "Camila Rodrigues" },
      { date: "2024-12-10", action: "Análise Técnica aprovada", user: "Fernanda Costa" },
      { date: "2024-09-01", action: "Protocolo registrado", user: "Sistema SEMAD" },
    ],
  },
  {
    id: "14", number: "SEMAD-2024-OUA-000890", typeCode: "OUA",
    requester: "Vale do Rio Doce Mineração S.A.", municipality: "Mariana",
    responsible: "Dra. Beatriz Carvalho", responsibleUnit: "IGAM / SUPRAM Leste",
    stage: "analise_doc", priority: "Alta", deadline: "2025-05-30", openedAt: "2024-10-01",
    description: "Outorga de captação hídrica para uso industrial na nova área de disposição de rejeitos — 120 L/s no Rio Gualaxo do Norte.",
    documents: 22, comments: 6, projectId: "proj-3", group: "outorga",
    history: [
      { date: "2024-12-15", action: "Análise documental iniciada", user: "Equipe IGAM" },
      { date: "2024-10-01", action: "Protocolo registrado", user: "Sistema SEMAD" },
    ],
  },
  {
    id: "15", number: "SEMAD-2024-INT-000310", typeCode: "INT",
    requester: "Vale do Rio Doce Mineração S.A.", municipality: "Mariana",
    responsible: "Dra. Beatriz Carvalho", responsibleUnit: "SUPRAM Leste",
    stage: "analise_tec", priority: "Alta", deadline: "2025-04-10", openedAt: "2024-10-15",
    description: "Autorização de intervenção em APP fluvial para implantação de dutos e passagem hidráulica — 1,2 km ao longo do Ribeirão Santarém.",
    documents: 28, comments: 9, area: "1,2 km", projectId: "proj-3", group: "intervencao",
    history: [
      { date: "2025-01-10", action: "Análise técnica iniciada", user: "Beatriz Carvalho" },
      { date: "2024-11-20", action: "Documentação complementar recebida", user: "Ana Lima" },
      { date: "2024-10-15", action: "Protocolo registrado", user: "Sistema SEMAD" },
    ],
  },
  {
    id: "16", number: "SEMAD-2025-OUA-000222", typeCode: "OUA",
    requester: "Ferrovia Centro-Atlântica S.A.", municipality: "BH / Regional",
    responsible: "Dr. Fernando Gomes", responsibleUnit: "IGAM / SEMAD Central",
    stage: "entrada", priority: "Alta", deadline: "2025-10-01", openedAt: "2025-01-20",
    description: "Outorgas múltiplas para captação hídrica durante obras de duplicação ferroviária — 7 pontos de captação ao longo dos 340 km.",
    documents: 19, comments: 3, projectId: "proj-4", group: "outorga",
    history: [
      { date: "2025-01-20", action: "Protocolo registrado — vinculado ao EIA/RIMA", user: "Sistema SEMAD" },
    ],
  },
  {
    id: "17", number: "SEMAD-2025-ASV-000111", typeCode: "ASV",
    requester: "Ferrovia Centro-Atlântica S.A.", municipality: "BH / Regional",
    responsible: "Dr. Fernando Gomes", responsibleUnit: "SUPRAM Central / Norte / Triângulo",
    stage: "analise_doc", priority: "Alta", deadline: "2025-09-15", openedAt: "2025-01-22",
    description: "ASV ao longo do traçado ferroviário — supressão de fragmentos de Cerrado e Mata Atlântica. Compensação via ARUC e pagamento por serviços ambientais.",
    documents: 56, comments: 12, area: "340 km", projectId: "proj-4", group: "intervencao",
    history: [
      { date: "2025-02-01", action: "Análise documental iniciada", user: "Equipe SUPRAM" },
      { date: "2025-01-22", action: "Protocolo registrado — vinculado ao EIA/RIMA", user: "Sistema SEMAD" },
    ],
  },
  {
    id: "18", number: "SEMAD-2024-OUA-000389", typeCode: "OUA",
    requester: "Serra Verde Energia Renovável Ltda", municipality: "Montes Claros",
    responsible: "Eng. Sofia Monteiro", responsibleUnit: "IGAM / SUPRAM Norte",
    stage: "analise_doc", priority: "Média", deadline: "2025-08-10", openedAt: "2024-11-20",
    description: "Outorga de captação para uso industrial durante obras do parque eólico — controle de poeira e concreto das fundações.",
    documents: 14, comments: 2, projectId: "proj-1", group: "outorga",
    history: [
      { date: "2024-12-05", action: "Análise documental iniciada", user: "Tiago Ferreira" },
      { date: "2024-11-20", action: "Protocolo registrado", user: "Sistema SEMAD" },
    ],
  },
];

const INITIAL_PROJECTS: Project[] = [
  {
    id: "proj-1", code: "PRJ-2024-001",
    name: "Complexo Eólico Serra Verde",
    empreendedor: "Serra Verde Energia Renovável Ltda",
    cnpj: "34.521.890/0001-44",
    municipality: "Montes Claros — MG",
    type: "Geração de Energia Eólica",
    status: "ativo", createdAt: "2024-11-15",
    manager: "Eng. Sofia Monteiro",
    description: "Implantação de parque eólico com 28 aerogeradores e capacidade de 112 MW no Norte de Minas. Inclui subestação elevadora, linha de transmissão de 35 km e acessos viários.",
    area: "1.850 ha",
    processIds: { licenciamento: ["9"], outorga: ["18"], intervencao: [] },
  },
  {
    id: "proj-2", code: "PRJ-2024-002",
    name: "UHE Araguari — Implantação",
    empreendedor: "UHE Araguari Energia S.A.",
    cnpj: "12.345.678/0001-90",
    municipality: "Araguari — MG",
    type: "Geração de Energia Hidrelétrica",
    status: "ativo", createdAt: "2024-07-22",
    manager: "Dra. Camila Rodrigues",
    description: "Usina hidrelétrica de 78 MW com reservatório de 4.200 ha. Conjunto de processos vinculados: licença de instalação, outorga de barramento e ASV para formação do reservatório.",
    area: "4.200 ha",
    processIds: { licenciamento: ["5"], outorga: ["12"], intervencao: ["13"] },
  },
  {
    id: "proj-3", code: "PRJ-2024-003",
    name: "Mineração Rio Doce — Área 7",
    empreendedor: "Vale do Rio Doce Mineração S.A.",
    cnpj: "33.592.510/0001-54",
    municipality: "Mariana — MG",
    type: "Mineração de Minério de Ferro",
    status: "ativo", createdAt: "2024-09-10",
    manager: "Dra. Beatriz Carvalho",
    description: "Nova área de disposição de rejeitos de mineração. Conjunto crítico: LP, outorga de captação industrial e intervenção em APP para dutos.",
    area: "2.450 ha",
    processIds: { licenciamento: ["1"], outorga: ["14"], intervencao: ["15"] },
  },
  {
    id: "proj-4", code: "PRJ-2025-001",
    name: "Duplicação Ferroviária BH–Vitória",
    empreendedor: "Ferrovia Centro-Atlântica S.A.",
    cnpj: "25.643.935/0001-00",
    municipality: "BH / Regional — 340 km",
    type: "Infraestrutura de Transporte Ferroviário",
    status: "ativo", createdAt: "2025-01-15",
    manager: "Dr. Fernando Gomes",
    description: "Duplicação de 340 km cruzando 5 regiões. Processo prioritário PAC. Conjunto completo: EIA/RIMA, outorgas múltiplas e ASV ao longo do traçado.",
    area: "340 km",
    processIds: { licenciamento: ["8"], outorga: ["16"], intervencao: ["17"] },
  },
  {
    id: "proj-5", code: "PRJ-2025-002",
    name: "Ampliação Planta Cimenteira",
    empreendedor: "Cimentos Minas Gerais S.A.",
    cnpj: "07.811.530/0001-21",
    municipality: "Contagem — MG",
    type: "Indústria de Minerais Não Metálicos",
    status: "ativo", createdAt: "2025-01-08",
    manager: "Dra. Mariana Santos",
    description: "Renovação de LO para planta de 3,2 Mt/ano. Processo isolado de licenciamento — sem outorga ou intervenção ambiental vinculada neste ciclo.",
    area: "180 ha",
    processIds: { licenciamento: ["3"], outorga: [], intervencao: [] },
  },
  {
    id: "proj-6", code: "PRJ-2024-004",
    name: "Expansão Agrícola — Faz. Santa Rita",
    empreendedor: "Fazenda Santa Rita Agropecuária Ltda",
    cnpj: "18.990.421/0001-77",
    municipality: "Uberlândia — MG",
    type: "Agropecuária — Pastagem Tecnificada",
    status: "ativo", createdAt: "2024-10-05",
    manager: "Eng. Roberto Almeida",
    description: "Expansão de pastagem em área de Cerrado com compensação ambiental. Conjunto vinculado: outorga para irrigação e ASV da área a suprimir.",
    area: "85 ha",
    processIds: { licenciamento: [], outorga: ["11"], intervencao: ["2"] },
  },
];

// ─── App ────────────────────────────────────────────────────────────────────

export default function App() {
  const [processes, setProcesses] = useState<ProcessItem[]>(INITIAL_PROCESSES);
  const [projects] = useState<Project[]>(INITIAL_PROJECTS);
  const [section, setSection] = useState<AppSection>("projetos");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedProcess, setSelectedProcess] = useState<ProcessItem | null>(null);
  const [activeView, setActiveView] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [projectSearch, setProjectSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<ProcessGroup>>(
    new Set(["outorga", "licenciamento", "intervencao"])
  );

  const filteredProcesses = useMemo(
    () =>
      processes.filter((p) => {
        const q = searchQuery.toLowerCase();
        return (
          (!q ||
            p.number.toLowerCase().includes(q) ||
            p.requester.toLowerCase().includes(q) ||
            p.municipality.toLowerCase().includes(q) ||
            p.responsible.toLowerCase().includes(q)) &&
          (filterType === "all" || p.typeCode === filterType) &&
          (filterPriority === "all" || p.priority === filterPriority)
        );
      }),
    [processes, searchQuery, filterType, filterPriority]
  );

  const filteredProjects = useMemo(
    () =>
      projects.filter((p) => {
        const q = projectSearch.toLowerCase();
        return (
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.empreendedor.toLowerCase().includes(q) ||
          p.municipality.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q)
        );
      }),
    [projects, projectSearch]
  );

  const flowStats = useMemo(() => {
    const active = processes.filter((p) => p.stage !== "concluido");
    return {
      total: active.length,
      alta: active.filter((p) => p.priority === "Alta").length,
      atrasados: active.filter((p) => isOverdue(p.deadline, p.stage)).length,
      concluidos: processes.filter((p) => p.stage === "concluido").length,
    };
  }, [processes]);

  const projectStats = useMemo(() => ({
    total: projects.length,
    ativos: projects.filter((p) => p.status === "ativo").length,
    comConjunto: projects.filter(
      (p) => Object.values(p.processIds).filter((arr) => arr.length > 0).length > 1
    ).length,
    concluidos: projects.filter((p) => p.status === "concluido").length,
  }), [projects]);

  const advanceStage = (process: ProcessItem) => {
    const idx = STAGES.findIndex((s) => s.id === process.stage);
    if (idx < STAGES.length - 1) {
      const nextStage = STAGES[idx + 1].id;
      const updated = {
        ...process,
        stage: nextStage,
        history: [
          {
            date: new Date().toISOString().split("T")[0],
            action: `Avançado para: ${STAGES[idx + 1].label}`,
            user: "Maria Oliveira",
          },
          ...process.history,
        ],
      };
      setProcesses((prev) => prev.map((p) => (p.id === process.id ? updated : p)));
      setSelectedProcess(updated);
    }
  };

  const getProjectProcesses = (project: Project, group: ProcessGroup) =>
    project.processIds[group]
      .map((id) => processes.find((p) => p.id === id))
      .filter(Boolean) as ProcessItem[];

  const toggleGroup = (g: ProcessGroup) =>
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(g) ? next.delete(g) : next.add(g);
      return next;
    });

  // ─── Shared sub-components ───────────────────────────────────────────────

  const PriorityBadge = ({ p }: { p: Priority }) => {
    const pc = priorityConfig(p);
    return (
      <div className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${pc.bg} ${pc.border}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
        <span className={`${pc.text} font-semibold`}>{p}</span>
      </div>
    );
  };

  const TypeBadge = ({ code }: { code: string }) => {
    const t = PROCESS_TYPES[code] ?? { label: code, color: "#374151", bg: "#F3F4F6" };
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ color: t.color, background: t.bg }}>
        {code}
      </span>
    );
  };

  const StageChip = ({ stage }: { stage: StageId }) => {
    const s = STAGES.find((x) => x.id === stage)!;
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ color: s.color, background: s.bg }}>
        {s.short}
      </span>
    );
  };

  // Compact process card used in project detail
  const ProcessCard = ({ process, onClick }: { process: ProcessItem; onClick: () => void }) => {
    const overdue = isOverdue(process.deadline, process.stage);
    const days = daysUntil(process.deadline);
    const stageIdx = STAGES.findIndex((s) => s.id === process.stage);
    const stage = STAGES[stageIdx];
    return (
      <div
        onClick={onClick}
        className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:border-emerald-200 hover:shadow-md transition-all group"
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <TypeBadge code={process.typeCode} />
            <PriorityBadge p={process.priority} />
          </div>
          <StageChip stage={process.stage} />
        </div>

        <div
          className="text-[11px] text-gray-400 mb-1"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {process.number}
        </div>
        <div className="text-sm font-semibold text-gray-800 mb-1 leading-snug">{process.requester}</div>

        {/* Stage progress */}
        <div className="flex items-center gap-0.5 my-2.5">
          {STAGES.map((s, i) => (
            <div
              key={s.id}
              className="flex-1 h-1 rounded-full"
              style={{
                background: i < stageIdx ? "#6EE7B7" : i === stageIdx ? stage.color : "#E5E7EB",
              }}
            />
          ))}
        </div>

        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-1 text-gray-400">
            <MapPin size={10} />
            <span>{process.municipality}</span>
          </div>
          <div className={`flex items-center gap-1 font-medium ${overdue ? "text-red-500" : days <= 7 ? "text-amber-500" : "text-gray-400"}`}>
            <Clock size={10} />
            <span>
              {overdue ? `${Math.abs(days)}d vencido` : days === 0 ? "Vence hoje" : `${days}d`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-50 text-[10px] text-gray-300">
          <span className="flex items-center gap-1"><Paperclip size={10} /> {process.documents} docs</span>
          <span className="flex items-center gap-1"><MessageSquare size={10} /> {process.comments}</span>
          <span className="flex items-center gap-1"><User size={10} /> {process.responsible.split(" ").slice(-1)[0]}</span>
        </div>
      </div>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-[#F2F5F2]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ═══ Sidebar ═══ */}
      <aside className="w-56 flex-shrink-0 flex flex-col" style={{ background: "#0C1F12" }}>
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#1B7A36" }}>
              <TreePine size={15} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-tight">SEMAD MG</div>
              <div className="text-white/40 text-[10px]">Secretaria de Meio Ambiente</div>
            </div>
          </div>
        </div>

        <div className="px-3 py-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">MO</div>
            <div className="min-w-0">
              <div className="text-white text-xs font-medium truncate">Maria Oliveira</div>
              <div className="text-white/40 text-[10px] truncate">Analista Ambiental</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {/* Home */}
          <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-all">
            <Home size={14} className="flex-shrink-0" />
            <span>Início</span>
          </button>

          {/* Gestão — sempre expanded */}
          <div>
            <div className="flex items-center gap-2.5 px-3 py-2 text-[10px] font-bold text-white/30 uppercase tracking-widest mt-2 mb-1">
              <ClipboardList size={11} />
              <span>Gestão de Processos</span>
            </div>
            <button
              onClick={() => { setSection("projetos"); setSelectedProject(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs transition-all ${
                section === "projetos" ? "text-white font-semibold" : "text-white/45 hover:text-white/75 hover:bg-white/5"
              }`}
              style={section === "projetos" ? { background: "#1B7A36" } : {}}
            >
              <FolderOpen size={14} className="flex-shrink-0" />
              <span className="flex-1 text-left">Projetos</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500 text-white font-bold leading-none">
                {projects.filter((p) => p.status === "ativo").length}
              </span>
            </button>
            <button
              onClick={() => { setSection("fluxo"); setSelectedProject(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs transition-all ${
                section === "fluxo" ? "text-white font-semibold" : "text-white/45 hover:text-white/75 hover:bg-white/5"
              }`}
              style={section === "fluxo" ? { background: "#1B7A36" } : {}}
            >
              <GitBranch size={14} className="flex-shrink-0" />
              <span className="flex-1 text-left">Fluxo de Processos</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white/70 font-bold leading-none">
                {processes.filter((p) => p.stage !== "concluido").length}
              </span>
            </button>
          </div>

          <div className="pt-2 space-y-0.5">
            {[
              { icon: Leaf, label: "Licenciamento Ambiental" },
              { icon: Droplets, label: "Recursos Hídricos" },
              { icon: Shield, label: "Fiscalização" },
              { icon: BarChart3, label: "Relatórios e Analytics" },
            ].map((item) => (
              <button key={item.label} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs text-white/35 hover:text-white/65 hover:bg-white/5 transition-all">
                <item.icon size={14} className="flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="px-2 py-3 border-t border-white/10">
          <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs text-white/30 hover:text-white/55 hover:bg-white/5 transition-all">
            <Settings size={14} />
            <span>Configurações</span>
          </button>
        </div>
      </aside>

      {/* ═══ Main content ═══ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span>SEMAD MG</span>
            <ChevronRight size={12} />
            <span className="text-gray-500">Gestão de Processos e Projetos</span>
            <ChevronRight size={12} />
            {section === "projetos" && !selectedProject && <span className="text-[#1B5E20] font-semibold">Projetos</span>}
            {section === "projetos" && selectedProject && (
              <>
                <button onClick={() => setSelectedProject(null)} className="text-gray-500 hover:text-[#1B5E20] transition-colors">Projetos</button>
                <ChevronRight size={12} />
                <span className="text-[#1B5E20] font-semibold">{selectedProject.name}</span>
              </>
            )}
            {section === "fluxo" && <span className="text-[#1B5E20] font-semibold">Fluxo de Processos</span>}
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg hover:bg-gray-50 text-gray-400 transition-colors">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity" style={{ background: "#1B5E20" }}>
              <Plus size={14} />
              {section === "projetos" ? "Novo Projeto" : "Novo Processo"}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto">

          {/* ═══ SECTION: Projects list ═══ */}
          {section === "projetos" && !selectedProject && (
            <div className="px-5 py-4">
              <div className="mb-4">
                <h1 className="text-lg font-bold text-gray-900">Projetos</h1>
                <p className="text-xs text-gray-400 mt-0.5">Empreendimentos e seus conjuntos de processos ambientais</p>
              </div>

              {/* Project stats */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Total de Projetos", value: projectStats.total, icon: FolderOpen, iconBg: "#F0FDF4", iconColor: "#166534", valColor: "#166534" },
                  { label: "Projetos Ativos", value: projectStats.ativos, icon: Activity, iconBg: "#EFF6FF", iconColor: "#1D4ED8", valColor: "#1D4ED8" },
                  { label: "Conjuntos de Processos", value: projectStats.comConjunto, icon: Layers, iconBg: "#FFF7ED", iconColor: "#C2410C", valColor: "#C2410C" },
                  { label: "Processos em Tramitação", value: processes.filter((p) => p.stage !== "concluido").length, icon: GitBranch, iconBg: "#F5F3FF", iconColor: "#7C3AED", valColor: "#7C3AED" },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-xl p-3.5 border border-gray-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.iconBg }}>
                      <s.icon size={16} style={{ color: s.iconColor }} />
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold leading-none" style={{ color: s.valColor }}>{s.value}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Search */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type="text"
                    placeholder="Buscar por projeto, empreendedor, município ou tipo..."
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-300"
                  />
                </div>
              </div>

              {/* Project cards grid */}
              <div className="grid grid-cols-3 gap-3">
                {filteredProjects.map((project) => {
                  const sc = PROJECT_STATUS_CONFIG[project.status];
                  const totalProcs = Object.values(project.processIds).flat().length;
                  const groups = (["outorga", "licenciamento", "intervencao"] as ProcessGroup[]).filter(
                    (g) => project.processIds[g].length > 0
                  );

                  return (
                    <div
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:border-emerald-200 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="text-[10px] font-mono text-gray-400">{project.code}</span>
                        <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold`} style={{ color: sc.color, background: sc.bg }}>
                          <div className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-gray-900 mb-1 leading-snug">{project.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-0.5">
                        <Building2 size={11} className="text-gray-300 flex-shrink-0" />
                        <span className="truncate">{project.empreendedor}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-3">
                        <MapPin size={10} className="text-gray-300 flex-shrink-0" />
                        <span>{project.municipality}</span>
                      </div>

                      <div className="text-[10px] text-gray-400 mb-3 bg-gray-50 rounded-lg px-2.5 py-1.5 leading-relaxed line-clamp-2">
                        {project.description}
                      </div>

                      {/* Process group badges */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {(["outorga", "licenciamento", "intervencao"] as ProcessGroup[]).map((g) => {
                          const gc = PROCESS_GROUPS[g];
                          const count = project.processIds[g].length;
                          if (count === 0) return null;
                          return (
                            <div key={g} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ color: gc.color, background: gc.bg, border: `1px solid ${gc.border}` }}>
                              <gc.icon size={10} />
                              <span>{count} {g === "outorga" ? "Outorga" : g === "licenciamento" ? "Licenciamento" : "Intervenção"}</span>
                            </div>
                          );
                        })}
                        {groups.length === 0 && (
                          <span className="text-[10px] text-gray-300 italic">Sem processos vinculados</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t border-gray-50">
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                          <User size={10} />
                          <span>{project.manager.split(" ").slice(-2).join(" ")}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                          <span>{totalProcs} processo{totalProcs !== 1 ? "s" : ""}</span>
                          <ChevronRight size={12} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ SECTION: Project detail ═══ */}
          {section === "projetos" && selectedProject && (() => {
            const project = selectedProject;
            const sc = PROJECT_STATUS_CONFIG[project.status];
            const totalProcs = Object.values(project.processIds).flat().length;

            return (
              <div className="px-5 py-4">
                {/* Back */}
                <button
                  onClick={() => setSelectedProject(null)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#1B5E20] mb-4 transition-colors"
                >
                  <ChevronLeft size={14} />
                  Voltar para Projetos
                </button>

                {/* Project header */}
                <div className="bg-white rounded-xl border border-gray-100 p-5 mb-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono text-gray-400">{project.code}</span>
                        <div className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ color: sc.color, background: sc.bg }}>
                          <div className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </div>
                      </div>
                      <h1 className="text-xl font-bold text-gray-900 mb-1">{project.name}</h1>
                      <div className="text-sm text-gray-500 mb-3">{project.type}</div>
                      <p className="text-xs text-gray-500 leading-relaxed max-w-2xl">{project.description}</p>
                    </div>
                    <div className="bg-[#F2F5F2] rounded-xl p-4 min-w-[200px] space-y-2.5">
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Empreendedor</div>
                        <div className="text-xs font-semibold text-gray-700">{project.empreendedor}</div>
                        {project.cnpj && <div className="text-[10px] text-gray-400 font-mono mt-0.5">CNPJ: {project.cnpj}</div>}
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                        <div>
                          <div className="text-[10px] text-gray-400 mb-0.5">Município</div>
                          <div className="text-[11px] font-medium text-gray-600">{project.municipality}</div>
                        </div>
                        {project.area && (
                          <div>
                            <div className="text-[10px] text-gray-400 mb-0.5">Área</div>
                            <div className="text-[11px] font-medium text-gray-600">{project.area}</div>
                          </div>
                        )}
                        <div>
                          <div className="text-[10px] text-gray-400 mb-0.5">Abertura</div>
                          <div className="text-[11px] font-medium text-gray-600">{formatDate(project.createdAt)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-400 mb-0.5">Processos</div>
                          <div className="text-[11px] font-semibold text-emerald-700">{totalProcs} vinculado{totalProcs !== 1 ? "s" : ""}</div>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <div className="text-[10px] text-gray-400 mb-1">Gestor SEMAD</div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[9px] font-bold text-emerald-700 flex-shrink-0">
                            {project.manager.split(" ").slice(-2).map((n) => n[0]).join("")}
                          </div>
                          <span className="text-xs font-medium text-gray-700">{project.manager}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Process groups */}
                <div className="space-y-4">
                  {(["licenciamento", "outorga", "intervencao"] as ProcessGroup[]).map((group) => {
                    const gc = PROCESS_GROUPS[group];
                    const groupProcs = getProjectProcesses(project, group);
                    const expanded = expandedGroups.has(group);
                    const hasOverdue = groupProcs.some((p) => isOverdue(p.deadline, p.stage));

                    return (
                      <div key={group} className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: gc.border }}>
                        {/* Group header */}
                        <button
                          onClick={() => toggleGroup(group)}
                          className="w-full flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-gray-50/50"
                          style={{ borderLeft: `4px solid ${gc.color}` }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: gc.bg }}>
                              <gc.icon size={15} style={{ color: gc.color }} />
                            </div>
                            <div className="text-left">
                              <div className="text-sm font-bold text-gray-800">{gc.label}</div>
                              <div className="text-[10px] text-gray-400">
                                {groupProcs.length > 0
                                  ? `${groupProcs.length} processo${groupProcs.length > 1 ? "s" : ""} vinculado${groupProcs.length > 1 ? "s" : ""}`
                                  : "Nenhum processo vinculado"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {hasOverdue && (
                              <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                                <AlertTriangle size={11} /> Vencido
                              </span>
                            )}
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: groupProcs.length > 0 ? gc.color : "#D1D5DB" }}>
                              {groupProcs.length}
                            </span>
                            {expanded ? <ChevronDown size={15} className="text-gray-400" /> : <ChevronRight size={15} className="text-gray-400" />}
                          </div>
                        </button>

                        {/* Group processes */}
                        {expanded && (
                          <div className="px-5 pb-4 pt-2" style={{ background: gc.bg + "40" }}>
                            {groupProcs.length > 0 ? (
                              <div className="grid grid-cols-3 gap-3">
                                {groupProcs.map((proc) => (
                                  <ProcessCard
                                    key={proc.id}
                                    process={proc}
                                    onClick={() => setSelectedProcess(proc)}
                                  />
                                ))}
                                {/* Add process card */}
                                <button
                                  className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-xs transition-colors hover:border-opacity-60"
                                  style={{ borderColor: gc.color + "60", color: gc.color }}
                                >
                                  <Plus size={18} style={{ color: gc.color + "80" }} />
                                  <span className="font-medium" style={{ color: gc.color }}>Adicionar Processo</span>
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-8 gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: gc.bg }}>
                                  <gc.icon size={18} style={{ color: gc.color + "60" }} />
                                </div>
                                <div className="text-center">
                                  <div className="text-xs text-gray-500 font-medium">Nenhum processo de {gc.label} vinculado</div>
                                  <div className="text-[10px] text-gray-400 mt-0.5">Clique para adicionar o primeiro processo</div>
                                </div>
                                <button
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90 text-white"
                                  style={{ background: gc.color }}
                                >
                                  <Plus size={13} />
                                  Adicionar Processo
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* ═══ SECTION: Process flow (kanban / list) ═══ */}
          {section === "fluxo" && (
            <div className="px-5 py-4">
              <div className="mb-4">
                <h1 className="text-lg font-bold text-gray-900">Fluxo de Processos</h1>
                <p className="text-xs text-gray-400 mt-0.5">Acompanhamento em tempo real de todos os processos em tramitação</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Em Tramitação", value: flowStats.total, icon: Activity, ib: "#ECFDF5", ic: "#065F46", vc: "#065F46" },
                  { label: "Prioridade Alta", value: flowStats.alta, icon: AlertCircle, ib: "#FEF2F2", ic: "#991B1B", vc: "#991B1B" },
                  { label: "Prazos Vencidos", value: flowStats.atrasados, icon: AlertTriangle, ib: "#FFFBEB", ic: "#92400E", vc: "#D97706" },
                  { label: "Concluídos (2025)", value: flowStats.concluidos, icon: CheckCircle2, ib: "#F0FDF4", ic: "#15803D", vc: "#15803D" },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-xl p-3.5 border border-gray-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.ib }}>
                      <s.icon size={16} style={{ color: s.ic }} />
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold leading-none" style={{ color: s.vc }}>{s.value}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type="text"
                    placeholder="Buscar por número, requerente, município..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-300"
                  />
                </div>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-600 focus:outline-none cursor-pointer">
                  <option value="all">Todos os tipos</option>
                  {Object.entries(PROCESS_TYPES).map(([k, v]) => <option key={k} value={k}>{k} — {v.label}</option>)}
                </select>
                <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-600 focus:outline-none cursor-pointer">
                  <option value="all">Todas as prioridades</option>
                  <option value="Alta">Alta</option>
                  <option value="Média">Média</option>
                  <option value="Baixa">Baixa</option>
                </select>
                <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden text-xs">
                  {(["kanban", "list"] as const).map((v) => (
                    <button key={v} onClick={() => setActiveView(v)} className={`flex items-center gap-1.5 px-3 py-2 transition-colors ${activeView === v ? "text-white" : "text-gray-400 hover:text-gray-600"}`} style={activeView === v ? { background: "#1B5E20" } : {}}>
                      {v === "kanban" ? <LayoutGrid size={13} /> : <List size={13} />}
                      <span className="font-medium">{v === "kanban" ? "Kanban" : "Lista"}</span>
                    </button>
                  ))}
                </div>
                <button className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <RefreshCw size={13} /> Atualizar
                </button>
              </div>

              {/* Kanban */}
              {activeView === "kanban" ? (
                <div className="flex gap-2.5 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 320px)" }}>
                  {STAGES.map((stage) => {
                    const items = filteredProcesses.filter((p) => p.stage === stage.id);
                    return (
                      <div key={stage.id} className="flex-shrink-0 w-60 flex flex-col">
                        <div className="flex items-center justify-between px-3 py-2.5 rounded-t-xl" style={{ background: stage.bg, borderLeft: `3px solid ${stage.color}` }}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: stage.color }} />
                            <span className="text-xs font-semibold text-gray-700">{stage.label}</span>
                          </div>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: stage.color }}>{items.length}</span>
                        </div>
                        <div className="flex-1 bg-gray-50/70 rounded-b-xl p-2 space-y-2 border border-t-0 border-gray-100 min-h-[140px]">
                          {items.map((process) => {
                            const pc = priorityConfig(process.priority);
                            const overdue = isOverdue(process.deadline, process.stage);
                            const days = daysUntil(process.deadline);
                            const ti = PROCESS_TYPES[process.typeCode];
                            const linkedProject = process.projectId
                              ? projects.find((p) => p.id === process.projectId)
                              : null;

                            return (
                              <div key={process.id} onClick={() => setSelectedProcess(process)} className="bg-white rounded-lg p-3 cursor-pointer border border-gray-100 hover:border-emerald-300 hover:shadow-md transition-all">
                                <div className="flex items-start justify-between gap-1 mb-2">
                                  <span className="text-[10px] text-gray-400 flex-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                    {process.number.split("-").slice(-2).join("-")}
                                  </span>
                                  <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border flex-shrink-0 ${pc.bg} ${pc.border}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                                    <span className={`${pc.text} font-semibold`}>{process.priority}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ color: ti.color, background: ti.bg }}>{process.typeCode}</span>
                                  {linkedProject && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-0.5">
                                      <FolderOpen size={9} /> Projeto
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs font-semibold text-gray-800 mb-1 leading-tight line-clamp-2">{process.requester}</div>
                                <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-2.5">
                                  <MapPin size={10} />{process.municipality}
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                  <div className={`flex items-center gap-1 text-[10px] font-medium ${overdue ? "text-red-500" : days <= 7 ? "text-amber-500" : "text-gray-400"}`}>
                                    <Clock size={10} />
                                    {overdue ? `${Math.abs(days)}d vencido` : days === 0 ? "Hoje" : `${days}d`}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-gray-300">
                                    <span className="flex items-center gap-0.5"><Paperclip size={10} />{process.documents}</span>
                                    <span className="flex items-center gap-0.5"><MessageSquare size={10} />{process.comments}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {items.length === 0 && (
                            <div className="flex items-center justify-center py-8 text-[10px] text-gray-300 italic">Vazio</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* List view */
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {["Número do Processo", "Tipo", "Requerente", "Município", "Etapa", "Responsável", "Prazo", "Prioridade", ""].map((col) => (
                          <th key={col} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProcesses.map((process, i) => {
                        const pc = priorityConfig(process.priority);
                        const overdue = isOverdue(process.deadline, process.stage);
                        const ti = PROCESS_TYPES[process.typeCode];
                        const stage = STAGES.find((s) => s.id === process.stage)!;
                        return (
                          <tr key={process.id} onClick={() => setSelectedProcess(process)} className={`border-b border-gray-50 cursor-pointer hover:bg-emerald-50/40 transition-colors ${i % 2 !== 0 ? "bg-gray-50/30" : ""}`}>
                            <td className="px-4 py-3">
                              <span className="text-gray-500" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px" }}>{process.number}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-1.5 py-0.5 rounded font-bold text-[10px]" style={{ color: ti.color, background: ti.bg }}>{process.typeCode}</span>
                            </td>
                            <td className="px-4 py-3 max-w-[200px]"><span className="font-semibold text-gray-700 truncate block">{process.requester}</span></td>
                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{process.municipality}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full font-semibold text-[10px]" style={{ color: stage.color, background: stage.bg }}>{stage.short}</span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{process.responsible}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`font-semibold ${overdue ? "text-red-500" : "text-gray-600"}`}>{formatDate(process.deadline)}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${pc.bg} ${pc.border}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                                <span className={`${pc.text} font-semibold`}>{process.priority}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors"><Eye size={13} /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredProcesses.length === 0 && (
                    <div className="py-12 text-center text-xs text-gray-300 italic">Nenhum processo encontrado com os filtros aplicados.</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Process detail panel ═══ */}
      {selectedProcess && (() => {
        const process = selectedProcess;
        const pc = priorityConfig(process.priority);
        const overdue = isOverdue(process.deadline, process.stage);
        const ti = PROCESS_TYPES[process.typeCode];
        const stage = STAGES.find((s) => s.id === process.stage)!;
        const stageIdx = STAGES.findIndex((s) => s.id === process.stage);
        const canAdvance = stageIdx < STAGES.length - 1;
        const linkedProject = process.projectId ? projects.find((p) => p.id === process.projectId) : null;

        return (
          <aside className="w-[380px] flex-shrink-0 bg-white border-l border-gray-100 flex flex-col overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ color: ti.color, background: ti.bg }}>{process.typeCode}</span>
                    <div className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${pc.bg} ${pc.border}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} /><span className={`${pc.text} font-semibold`}>{process.priority}</span>
                    </div>
                    {overdue && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 font-semibold">Vencido</span>}
                  </div>
                  <div className="text-[11px] text-gray-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{process.number}</div>
                  {linkedProject && (
                    <button
                      onClick={() => { setSection("projetos"); setSelectedProject(linkedProject); setSelectedProcess(null); }}
                      className="flex items-center gap-1 mt-1.5 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5 hover:bg-emerald-100 transition-colors"
                    >
                      <FolderOpen size={10} /> {linkedProject.name}
                    </button>
                  )}
                </div>
                <button onClick={() => setSelectedProcess(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 transition-colors flex-shrink-0"><X size={15} /></button>
              </div>
            </div>

            {/* Stage progress */}
            <div className="px-4 py-3 border-b border-gray-50 flex-shrink-0">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Etapa Atual: {stage.label}</div>
              <div className="flex items-center gap-0.5">
                {STAGES.map((s, i) => (
                  <div key={s.id} className="flex-1 h-1.5 rounded-full" style={{ background: i < stageIdx ? "#6EE7B7" : i === stageIdx ? s.color : "#E5E7EB" }} />
                ))}
              </div>
              <div className="flex items-center justify-between mt-1.5 text-[10px]">
                <span className="text-gray-400">Etapa {stageIdx + 1} de {STAGES.length}</span>
                <span className="font-semibold" style={{ color: stage.color }}>{stage.label}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto text-xs">
              <div className="px-4 py-4 space-y-4">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Requerente</div>
                  <div className="flex items-start gap-2">
                    <Building2 size={13} className="text-gray-300 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-800 font-semibold leading-snug">{process.requester}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Município</div>
                    <div className="flex items-center gap-1.5 text-gray-600"><MapPin size={11} className="text-gray-300" />{process.municipality}</div>
                  </div>
                  {process.area && (
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Área</div>
                      <div className="text-gray-700 font-semibold">{process.area}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Abertura</div>
                    <div className="flex items-center gap-1.5 text-gray-600"><Calendar size={11} className="text-gray-300" />{formatDate(process.openedAt)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Prazo Legal</div>
                    <div className={`flex items-center gap-1.5 font-semibold ${overdue ? "text-red-500" : "text-gray-700"}`}>
                      <Clock size={11} className={overdue ? "text-red-400" : "text-gray-300"} />
                      {formatDate(process.deadline)}
                    </div>
                    {overdue && <div className="text-[10px] text-red-400 mt-0.5">{Math.abs(daysUntil(process.deadline))} dias vencido</div>}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Responsável Técnico</div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-[11px] font-bold text-emerald-700 flex-shrink-0">
                      {process.responsible.split(" ").slice(-2).map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{process.responsible}</div>
                      <div className="text-[10px] text-gray-400">{process.responsibleUnit}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Descrição</div>
                  <p className="text-gray-600 leading-relaxed">{process.description}</p>
                </div>

                <div className="flex items-center gap-4 py-3 border-t border-b border-gray-50">
                  <span className="flex items-center gap-2 text-gray-500"><Paperclip size={13} className="text-gray-300" />{process.documents} documentos</span>
                  <span className="flex items-center gap-2 text-gray-500"><MessageSquare size={13} className="text-gray-300" />{process.comments} comentários</span>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Histórico de Tramitação</div>
                  <div className="space-y-0">
                    {process.history.map((h, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center pt-0.5">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: i === 0 ? stage.color : "#D1D5DB" }} />
                          {i < process.history.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1 mb-1 min-h-[20px]" />}
                        </div>
                        <div className={`flex-1 ${i < process.history.length - 1 ? "pb-3" : ""}`}>
                          <div className="font-semibold text-gray-700 leading-snug">{h.action}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">{h.user} · {formatDate(h.date)}</div>
                          {h.note && <div className="text-[10px] text-gray-500 mt-1 bg-gray-50 rounded px-2 py-1.5 border border-gray-100">{h.note}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 py-3.5 border-t border-gray-100 flex gap-2 flex-shrink-0">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors font-medium">
                <Download size={13} /> Exportar
              </button>
              {canAdvance ? (
                <button onClick={() => advanceStage(process)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-white font-semibold hover:opacity-90 transition-opacity" style={{ background: "#1B5E20" }}>
                  <ArrowRight size={13} /> Avançar Etapa
                </button>
              ) : (
                <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-50 text-xs text-gray-400 border border-gray-100">
                  <CheckCircle2 size={13} /> Processo Concluído
                </div>
              )}
            </div>
          </aside>
        );
      })()}
    </div>
  );
}
