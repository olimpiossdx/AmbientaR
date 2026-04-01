import type { UserRole } from "@/lib/types";

/**
 * Perfil dedicado ao módulo Financeiro (único `UserRole` exclusivo dessa área).
 * Use em guards e labels para não confundir com admin/gestor.
 */
export type PerfilFinanceiro = Extract<UserRole, "financial">;

/**
 * Papéis que enxergam o grupo de menu Financeiro (espelha `navigation-config`).
 * Cliente/representante têm subconjuntos específicos por item.
 */
export type PapelComMenuFinanceiro = Extract<
  UserRole,
  "admin" | "financial" | "supervisor" | "sales"
>;

export function isPerfilFinanceiro(role: UserRole): role is PerfilFinanceiro {
  return role === "financial";
}

export function temMenuFinanceiro(role: UserRole): role is PapelComMenuFinanceiro {
  return (
    role === "admin" ||
    role === "financial" ||
    role === "supervisor" ||
    role === "sales"
  );
}
