import {
  LICENCIAMENTO_MENU_LABEL,
  LICENCIAMENTO_REQUESTS_PATH,
} from "@/lib/licenciamento-menu";
import type { NavSubItem, UserRole } from "@/lib/types";
import {
  ClipboardList,
  FileSpreadsheet,
  FolderClock,
  FolderOpen,
  List,
  PlusSquare,
} from "lucide-react";

export const GESTAO_PROCESSOS_MENU_LABEL = "Gestão de Processos";
export const GESTAO_PROCESSOS_PATH = "/gestao-processos";
export const GESTAO_PROCESSOS_PLANILHA_PATH = `${GESTAO_PROCESSOS_PATH}/planilha`;

export const GESTAO_PROCESSOS_VISAO_LABEL = "Todos os processos";
export const GESTAO_PROCESSOS_ELABORACAO_LABEL = "Em elaboração";
export const GESTAO_PROCESSOS_PROTOCOLADOS_LABEL = "Protocolados (SEI/SLA)";
export const GESTAO_PROCESSOS_PLANILHA_LABEL = "Planilha Excel";

/** Equipa interna com leitura ampla. */
export const GESTAO_PROCESSOS_INTERNAL_READ_ROLES: UserRole[] = [
  "admin",
  "technical",
  "gestor",
  "supervisor",
  "advogado",
  "diretor_fauna",
];

/** Portal: somente consulta (escopo por empreendedor na app). */
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
  return `${GESTAO_PROCESSOS_PATH}?processo=${encodeURIComponent(id)}`;
}

export function buildGestaoProcessosNavSubItems(): NavSubItem[] {
  return [
    {
      label: "Processos",
      icon: FolderOpen,
      subItems: [
        {
          href: GESTAO_PROCESSOS_PATH,
          label: GESTAO_PROCESSOS_VISAO_LABEL,
          icon: FolderOpen,
          roles: GESTAO_PROCESSOS_MENU_ROLES,
        },
        {
          href: `${GESTAO_PROCESSOS_PATH}?fase=elaboracao`,
          label: GESTAO_PROCESSOS_ELABORACAO_LABEL,
          icon: FolderClock,
          roles: GESTAO_PROCESSOS_MENU_ROLES,
        },
        {
          href: `${GESTAO_PROCESSOS_PATH}?fase=protocolado`,
          label: GESTAO_PROCESSOS_PROTOCOLADOS_LABEL,
          icon: List,
          roles: GESTAO_PROCESSOS_MENU_ROLES,
        },
      ],
    },
    {
      label: LICENCIAMENTO_MENU_LABEL,
      icon: ClipboardList,
      roles: [
        "admin",
        "technical",
        "gestor",
        "supervisor",
        "advogado",
        "client",
        "representative",
        "consultor_representante",
      ],
      subItems: [
        {
          href: LICENCIAMENTO_REQUESTS_PATH,
          label: "Trâmites",
          icon: List,
          roles: [
            "admin",
            "technical",
            "gestor",
            "supervisor",
            "advogado",
            "client",
            "representative",
            "consultor_representante",
          ],
        },
        {
          href: `${LICENCIAMENTO_REQUESTS_PATH}/new`,
          label: "Novo Processo",
          icon: PlusSquare,
          roles: ["admin", "technical", "gestor", "supervisor", "advogado"],
        },
      ],
    },
    {
      label: "Dados",
      icon: FileSpreadsheet,
      subItems: [
        {
          href: GESTAO_PROCESSOS_PLANILHA_PATH,
          label: GESTAO_PROCESSOS_PLANILHA_LABEL,
          icon: FileSpreadsheet,
          roles: GESTAO_PROCESSOS_WRITE_ROLES,
        },
      ],
    },
  ];
}
