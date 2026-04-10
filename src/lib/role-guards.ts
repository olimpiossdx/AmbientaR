import type { UserRole } from "@/lib/types";

/** Admin e supervisor: mesmas capacidades de supervisão na UI onde aplicável. */
export function isAdminOrSupervisorRole(
  role: UserRole | undefined | null,
): boolean {
  return role === "admin" || role === "supervisor";
}

/** Plano com acompanhamento supervisão/gestão/assessoria (role técnico `client`). */
export function isClienteGestao(role: UserRole | undefined | null): boolean {
  return role === "client";
}

/** Planos de acompanhamento autônomo (lançar e acompanhar próprios dados e prazos). */
export function isClienteAutonomo(role: UserRole | undefined | null): boolean {
  return role === "cliente_autonomo";
}

/** Qualquer titular do portal (Cliente Gestão ou Cliente Autônomo). */
export function isClientePortalRole(role: UserRole | undefined | null): boolean {
  return isClienteGestao(role) || isClienteAutonomo(role);
}

/** Titular e representante: apenas consultam registros de CAR, sem anexar nem salvar no projeto. */
export function canManageCarUploadsOnProject(
  role: UserRole | undefined | null,
): boolean {
  return !isClientePortalRole(role) && role !== "representative";
}
