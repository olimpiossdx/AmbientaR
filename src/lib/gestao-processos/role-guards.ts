import { hasAnyRoleOrAdmin } from "@/lib/role-guards";
import type { UserRole } from "@/lib/types";
import {
  GESTAO_PROCESSOS_INTERNAL_READ_ROLES,
  GESTAO_PROCESSOS_PORTAL_READ_ROLES,
  GESTAO_PROCESSOS_WRITE_ROLES,
} from "@/lib/gestao-processos-menu";

export function canWriteGestaoProcessos(
  role: UserRole | undefined | null,
): boolean {
  return hasAnyRoleOrAdmin(role, GESTAO_PROCESSOS_WRITE_ROLES);
}

export function isGestaoProcessosPortalReadOnly(
  role: UserRole | undefined | null,
): boolean {
  if (!role) return false;
  return GESTAO_PROCESSOS_PORTAL_READ_ROLES.includes(role);
}

/** Fluxo operacional — equipa interna (escrita) ou portal (somente leitura filtrada). */
export function canAccessGestaoProcessosFluxo(
  role: UserRole | undefined | null,
): boolean {
  return (
    hasAnyRoleOrAdmin(role, GESTAO_PROCESSOS_INTERNAL_READ_ROLES) ||
    isGestaoProcessosPortalReadOnly(role)
  );
}

export function canAccessGestaoProcessosMenu(
  role: UserRole | undefined | null,
): boolean {
  return (
    canWriteGestaoProcessos(role) ||
    hasAnyRoleOrAdmin(role, [
      "supervisor",
      "advogado",
      "diretor_fauna",
    ]) ||
    isGestaoProcessosPortalReadOnly(role)
  );
}

/** Tarefas avulsas — apenas equipa interna (sem portal). */
export function canAccessOfficeTasks(
  role: UserRole | undefined | null,
): boolean {
  return hasAnyRoleOrAdmin(role, GESTAO_PROCESSOS_INTERNAL_READ_ROLES);
}
