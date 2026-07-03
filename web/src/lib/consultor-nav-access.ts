import { isFinanceiroMenuPath } from "@/lib/financeiro-menu-paths";
import type { UserRole } from "@/lib/types";

/** Rotas exclusivas do consultor (não existem para representante). */
export const CONSULTOR_EXTRA_PATH_PREFIXES: readonly string[] = [
  "/carteira",
];

export function normalizeConsultorNavPath(href: string): string {
  let path = href.split("?")[0]?.split("#")[0] ?? href;
  if (!path.startsWith("/")) path = `/${path}`;
  return path;
}

export function isConsultorExtraPath(href: string): boolean {
  const path = normalizeConsultorNavPath(href);
  return CONSULTOR_EXTRA_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

/**
 * Consultor-representante espelha o representante (itens com `representative` no menu),
 * mais rotas extras (ex.: carteira). **Não** vê o menu Financeiro nem herda
 * gestor/técnico/supervisor.
 */
export function canConsultorAccessNavItem(
  allowedRoles: UserRole[] | undefined | null,
  href?: string,
): boolean {
  if (href && isConsultorExtraPath(href)) return true;
  if (isFinanceiroMenuPath(href)) return false;
  if (!allowedRoles?.length) return false;
  if (allowedRoles.includes("consultor_representante")) return true;
  return allowedRoles.includes("representative");
}
