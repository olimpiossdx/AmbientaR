/** Rotas e prefixos do submenu Financeiro (`navigation-config.ts`). */
export const FINANCEIRO_MENU_PATHS = [
  "/bank-access",
  "/clients",
  "/contracts",
  "/contracts-suppliers",
  "/suppliers",
  "/invoices",
  "/commercial-proposals",
  "/services",
  "/cash-flow",
  "/financial/platform-subscription-contracts",
  "/financial/abc-curve",
  "/financial/bens-patrimonio",
  "/financial/dre-contabil",
  "/financial/painel",
  "/financial/projetos-roi",
  "/financial/fluxo-projetado",
  "/financial/conciliacao",
  "/financial/billing-debug",
  "/financial/abc-servicos",
  "/financial/abc-fornecedores",
  "/financial/orcamento",
  "/financial/export-contabil",
  "/studies/assistant",
] as const;

export function normalizeFinanceiroMenuPath(href: string): string {
  let path = href.split("?")[0]?.split("#")[0] ?? href;
  if (!path.startsWith("/")) path = `/${path}`;
  return path;
}

/** Indica se o href pertence ao menu Financeiro (subitens ou rotas internas). */
export function isFinanceiroMenuPath(href: string | undefined): boolean {
  if (!href) return false;
  const path = normalizeFinanceiroMenuPath(href);
  return FINANCEIRO_MENU_PATHS.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );
}

/** @deprecated Use FINANCEIRO_MENU_PATHS — mantido para debug legado. */
export const FINANCIAL_ROUTES = FINANCEIRO_MENU_PATHS;

export function isFinancialRoute(pathname: string): boolean {
  return isFinanceiroMenuPath(pathname);
}
