import type { AppUser, UserRole } from "@/lib/types";

/** Conta bootstrap de administrador (login em `/login`, não em `/register`). */
export const ADMIN_BOOTSTRAP_EMAIL = "adm@adm.com";

export function isBootstrapAdminEmail(
  email: string | undefined | null,
): boolean {
  return (email ?? "").trim().toLowerCase() === ADMIN_BOOTSTRAP_EMAIL;
}

/** Papel efetivo no portal; e-mail bootstrap é sempre admin. */
export function resolveRoleForEmail(
  email: string,
  existingRole?: UserRole | null,
): UserRole {
  if (isBootstrapAdminEmail(email)) return "admin";
  return existingRole ?? "client";
}

/** Cadastro público não pode criar nem sobrescrever administrador. */
export function shouldBlockPublicRegistration(
  email: string,
  existingProfile?: Pick<AppUser, "role"> | null,
): boolean {
  if (isBootstrapAdminEmail(email)) return true;
  return existingProfile?.role === "admin";
}

export function resolveRegisterRole(
  email: string,
  mode:
    | "representative"
    | "consultor_representante"
    | "cliente_autonomo"
    | "client",
  existingProfile?: Pick<AppUser, "role"> | null,
): UserRole {
  if (isBootstrapAdminEmail(email) || existingProfile?.role === "admin") {
    return "admin";
  }
  if (mode === "representative") return "representative";
  if (mode === "consultor_representante") return "consultor_representante";
  if (mode === "cliente_autonomo") return "cliente_autonomo";
  return "client";
}
