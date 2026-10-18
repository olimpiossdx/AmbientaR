import { createRoute, lazyRouteComponent, Outlet } from "@tanstack/react-router";
import { authenticatedRoute } from "../../app/router/authenticated-route";
import { createAuthGuard } from "../../app/router/auth-guards";
import { COMPANY_CLAIMS } from "./companies.types";

const root = createRoute({ getParentRoute: () => authenticatedRoute, path: "/responsible-company", beforeLoad: createAuthGuard(), component: Outlet });
const list = createRoute({
  getParentRoute: () => root, path: "/",
  beforeLoad: createAuthGuard(COMPANY_CLAIMS.view),
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q.slice(0, 200) : "",
    page: Number.isSafeInteger(Number(search.page)) && Number(search.page) > 0 ? Math.min(100000, Number(search.page)) : 1,
  }),
  component: lazyRouteComponent(() => import("./companies-page"), "CompaniesPage"),
});
const create = createRoute({ getParentRoute: () => root, path: "/new", beforeLoad: createAuthGuard(COMPANY_CLAIMS.create), component: lazyRouteComponent(() => import("./company-form-page"), "NewCompanyPage") });
const edit = createRoute({
  getParentRoute: () => root, path: "/$id/edit",
  beforeLoad: async options => { await createAuthGuard(COMPANY_CLAIMS.view)(options); await createAuthGuard(COMPANY_CLAIMS.edit)(options); },
  component: lazyRouteComponent(() => import("./company-form-page"), "EditCompanyPage"),
});
export const companiesRouteTree = root.addChildren([list, create, edit]);
