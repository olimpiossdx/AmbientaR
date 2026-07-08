import type { AppShellNavItem } from "../../componentes";

export type UserRole =
 | "admin"
 | "client"
 | "cliente_autonomo"
 | "representative"
 | "consultor_representante"
 | "technical"
 | "sales"
 | "financial"
 | "gestor"
 | "supervisor"
 | "diretor_fauna"
 | "advogado";

export const allRoles: UserRole[] = [
 "admin",
 "client",
 "cliente_autonomo",
 "representative",
 "consultor_representante",
 "technical",
 "sales",
 "financial",
 "gestor",
 "supervisor",
 "diretor_fauna",
 "advogado",
];

export const internalEnvironmentalRoles: UserRole[] = [
 "admin",
 "technical",
 "gestor",
 "supervisor",
 "diretor_fauna",
 "advogado",
];

export const environmentalDocumentRoles: UserRole[] = [
 "admin",
 "client",
 "cliente_autonomo",
 "representative",
 "gestor",
 "supervisor",
 "technical",
 "advogado",
];

export const financialRoles: UserRole[] = ["admin", "financial"];
export const salesRoles: UserRole[] = ["admin", "sales", "supervisor", "financial"];
export const pcaRcaRoles: UserRole[] = ["admin", "technical", "gestor", "supervisor", "advogado"];
export const georefRoles: UserRole[] = ["admin", "gestor", "supervisor", "diretor_fauna", "advogado"];
export const govRoles: UserRole[] = [
 "admin",
 "technical",
 "gestor",
 "financial",
 "sales",
 "supervisor",
 "diretor_fauna",
 "advogado",
];
export const processRoles: UserRole[] = [
 ...internalEnvironmentalRoles,
 "client",
 "cliente_autonomo",
 "representative",
 "consultor_representante",
];

export const roleLabels: Record<UserRole, string> = {
 admin: "Administrador",
 supervisor: "Supervisor",
 gestor: "Gestao ambiental",
 financial: "Financeiro",
 sales: "Vendas",
 technical: "Tecnico",
 diretor_fauna: "Diretor de fauna",
 advogado: "Advogado",
 client: "Cliente",
 cliente_autonomo: "Cliente autonomo",
 representative: "Representante",
 consultor_representante: "Consultor-Representante",
};

const clienteAutonomoDeniedPrefixes = [
 "/ai-lab",
 "/studies",
 "/georeferenciamento",
 "/analise-ambiental",
 "/ia/fiscal-ambiental-digital",
 "/requests",
] as const;

const consultorExtraPrefixes = ["/carteira"] as const;

export function isUserRole(role?: string | null): role is UserRole {
 return Boolean(role && (allRoles as string[]).includes(role));
}

export function getRoleLabel(role?: string | null): string | null {
 if (!role) return null;
 return isUserRole(role) ? roleLabels[role] : role;
}

export function isAdminRole(role?: string | null): boolean {
 return role === "admin";
}

export function isClientePortalRole(role?: string | null): boolean {
 return role === "client" || role === "cliente_autonomo";
}

export function isConsultorRepresentante(role?: string | null): boolean {
 return role === "consultor_representante";
}

function normalizePath(path?: string): string {
 if (!path) return "";
 const base = path.split("?")[0]?.split("#")[0] ?? path;
 return base.startsWith("/") ? base : `/${base}`;
}

function matchesAnyPrefix(path: string, prefixes: readonly string[]): boolean {
 return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function isFinanceiroPath(path?: string): boolean {
 const normalized = normalizePath(path);
 return (
  normalized === "/bank-access" ||
  normalized === "/clients" ||
  normalized === "/contracts" ||
  normalized === "/contracts-suppliers" ||
  normalized === "/invoices" ||
  normalized === "/suppliers" ||
  normalized === "/cash-flow" ||
  normalized === "/commercial-proposals" ||
  normalized === "/services" ||
  normalized.startsWith("/financial")
 );
}

export function canConsultorAccessRoles(roles?: string[], path?: string): boolean {
 const normalized = normalizePath(path);
 if (matchesAnyPrefix(normalized, consultorExtraPrefixes)) return true;
 if (isFinanceiroPath(normalized)) return false;
 if (!roles?.length) return false;
 return roles.includes("consultor_representante") || roles.includes("representative");
}

export function canAccessByRole(role?: string | null, roles?: string[], path?: string): boolean {
 if (isAdminRole(role)) return true;
 if (isConsultorRepresentante(role)) return canConsultorAccessRoles(roles, path);
 if (!roles?.length) return true;
 return Boolean(role && roles.includes(role));
}

export function canAccessNavItem(item: Pick<AppShellNavItem, "roles" | "to" | "legacyHref">, role?: string | null): boolean {
 return canAccessByRole(role, item.roles, item.legacyHref ?? item.to);
}

export function isRoleDeniedByPrefix(role: string | undefined | null, path: string): boolean {
 if (role !== "cliente_autonomo") return false;
 return matchesAnyPrefix(normalizePath(path), clienteAutonomoDeniedPrefixes);
}
