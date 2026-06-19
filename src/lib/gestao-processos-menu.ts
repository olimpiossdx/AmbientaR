import type { NavSubItem, UserRole } from "@/lib/types";
import { FolderOpen, PlusSquare } from "lucide-react";

export const GESTAO_PROCESSOS_MENU_LABEL = "Gestão de Processos";
export const GESTAO_PROCESSOS_PATH = "/gestao-processos";
export const GESTAO_PROCESSOS_PLANILHA_PATH = `${GESTAO_PROCESSOS_PATH}/planilha`;
export const GESTAO_PROCESSOS_NOVO_PATH = `${GESTAO_PROCESSOS_PATH}?novo=1`;

export const GESTAO_PROCESSOS_VISAO_LABEL = "Todos os processos";

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
      href: GESTAO_PROCESSOS_PATH,
      label: GESTAO_PROCESSOS_VISAO_LABEL,
      icon: FolderOpen,
      roles: GESTAO_PROCESSOS_MENU_ROLES,
    },
    {
      href: GESTAO_PROCESSOS_NOVO_PATH,
      label: "Novo processo",
      icon: PlusSquare,
      roles: GESTAO_PROCESSOS_WRITE_ROLES,
    },
  ];
}
