import type { NavSubItem, UserRole } from "@/lib/types";
import {
  BarChart3,
  FolderKanban,
  GitBranch,
  LayoutDashboard,
  LineChart,
  ListTodo,
} from "lucide-react";

export const GESTAO_PROCESSOS_MENU_LABEL = "Gestão de Projetos e Processos";
export const GESTAO_PROCESSOS_PATH = "/gestao-processos";
export const GESTAO_PROCESSOS_PROJETOS_PATH = `${GESTAO_PROCESSOS_PATH}/projetos`;
export const GESTAO_PROCESSOS_FLUXO_PATH = `${GESTAO_PROCESSOS_PATH}/fluxo`;
export const GESTAO_PROCESSOS_PLANILHA_PATH = `${GESTAO_PROCESSOS_PATH}/planilha`;
export const GESTAO_PROCESSOS_NOVO_PATH = `${GESTAO_PROCESSOS_FLUXO_PATH}?novo=1`;

export const GESTAO_PROCESSOS_PROJETOS_LABEL = "Projetos";
export const GESTAO_PROCESSOS_FLUXO_LABEL = "Fluxo de Processos";
export const GESTAO_PROCESSOS_TAREFAS_LABEL = "Tarefas";
export const GESTAO_PROCESSOS_TAREFAS_PATH = `${GESTAO_PROCESSOS_PATH}/tarefas`;
export const GESTAO_PROCESSOS_INDICADORES_LABEL = "Indicadores de Prazos";
export const GESTAO_PROCESSOS_INDICADORES_PATH = `${GESTAO_PROCESSOS_PATH}/indicadores`;
export const GESTAO_PROCESSOS_INDICADORES_RESUMO_LABEL = "Resumo";
export const GESTAO_PROCESSOS_INDICADORES_ANALISE_LABEL = "Gráfico de Análise";
export const GESTAO_PROCESSOS_INDICADORES_ANALISE_PATH = `${GESTAO_PROCESSOS_INDICADORES_PATH}/analise`;

/** Indicadores de prazos — administrador e gestor ambiental. */
export const GESTAO_PROCESSOS_INDICADORES_ROLES: UserRole[] = ["admin", "gestor"];

/** @deprecated Use GESTAO_PROCESSOS_FLUXO_LABEL */
export const GESTAO_PROCESSOS_VISAO_LABEL = GESTAO_PROCESSOS_FLUXO_LABEL;

/** Equipa interna com leitura ampla (inclui Fluxo de Processos). */
export const GESTAO_PROCESSOS_INTERNAL_READ_ROLES: UserRole[] = [
  "admin",
  "technical",
  "gestor",
  "supervisor",
  "advogado",
  "diretor_fauna",
];

/** Portal: Projetos + Fluxo (consulta filtrada por empreendedor). */
export const GESTAO_PROCESSOS_PORTAL_READ_ROLES: UserRole[] = [
  "client",
  "cliente_autonomo",
  "representative",
  "consultor_representante",
];

export const GESTAO_PROCESSOS_MENU_ROLES: UserRole[] = [
  ...GESTAO_PROCESSOS_INTERNAL_READ_ROLES,
  ...GESTAO_PROCESSOS_PORTAL_READ_ROLES,
];

/** Elaboração: criar, editar, importar planilha. */
export const GESTAO_PROCESSOS_WRITE_ROLES: UserRole[] = [
  "admin",
  "technical",
  "gestor",
];

export function gestaoProcessosDetailPath(id: string): string {
  return `${GESTAO_PROCESSOS_FLUXO_PATH}?processo=${encodeURIComponent(id)}`;
}

export function gestaoProcessosProjetoDetailPath(id: string): string {
  return `${GESTAO_PROCESSOS_PROJETOS_PATH}/${encodeURIComponent(id)}`;
}

export function buildGestaoProcessosNavSubItems(): NavSubItem[] {
  return [
    {
      href: GESTAO_PROCESSOS_PROJETOS_PATH,
      label: GESTAO_PROCESSOS_PROJETOS_LABEL,
      icon: FolderKanban,
      roles: GESTAO_PROCESSOS_MENU_ROLES,
    },
    {
      href: GESTAO_PROCESSOS_FLUXO_PATH,
      label: GESTAO_PROCESSOS_FLUXO_LABEL,
      icon: GitBranch,
      roles: GESTAO_PROCESSOS_MENU_ROLES,
    },
    {
      href: GESTAO_PROCESSOS_TAREFAS_PATH,
      label: GESTAO_PROCESSOS_TAREFAS_LABEL,
      icon: ListTodo,
      roles: GESTAO_PROCESSOS_INTERNAL_READ_ROLES,
    },
    {
      label: GESTAO_PROCESSOS_INDICADORES_LABEL,
      icon: BarChart3,
      roles: GESTAO_PROCESSOS_INDICADORES_ROLES,
      subItems: [
        {
          href: GESTAO_PROCESSOS_INDICADORES_PATH,
          label: GESTAO_PROCESSOS_INDICADORES_RESUMO_LABEL,
          icon: LayoutDashboard,
          roles: GESTAO_PROCESSOS_INDICADORES_ROLES,
        },
        {
          href: GESTAO_PROCESSOS_INDICADORES_ANALISE_PATH,
          label: GESTAO_PROCESSOS_INDICADORES_ANALISE_LABEL,
          icon: LineChart,
          roles: GESTAO_PROCESSOS_INDICADORES_ROLES,
        },
      ],
    },
  ];
}
