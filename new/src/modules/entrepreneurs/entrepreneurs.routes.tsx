import { createRoute, lazyRouteComponent, Outlet } from "@tanstack/react-router";
import { authenticatedRoute } from "../../app/router/authenticated-route";
import { createAuthGuard } from "../../app/router/auth-guards";
import { ENTREPRENEUR_CLAIMS, ENTREPRENEUR_MODULE_CLAIM } from "./entrepreneurs.types";
const root = createRoute({ getParentRoute: () => authenticatedRoute, path: "/empreendedores", beforeLoad: createAuthGuard(ENTREPRENEUR_MODULE_CLAIM), component: Outlet });
const list = createRoute({ getParentRoute: () => root, path: "/", beforeLoad: createAuthGuard(ENTREPRENEUR_CLAIMS.view), validateSearch: (search: Record<string, unknown>) => ({ q: typeof search.q === "string" ? search.q.slice(0, 200) : "", page: Number.isSafeInteger(Number(search.page)) && Number(search.page) > 0 ? Math.min(100000, Number(search.page)) : 1 }), component: lazyRouteComponent(() => import("./entrepreneurs-page"), "EntrepreneursPage") });
const create = createRoute({ getParentRoute: () => root, path: "/new", beforeLoad: createAuthGuard(ENTREPRENEUR_CLAIMS.create), component: lazyRouteComponent(() => import("./entrepreneur-form-page"), "NewEntrepreneurPage") });
const edit = createRoute({ getParentRoute: () => root, path: "/$id/edit", beforeLoad: async (options) => { await createAuthGuard(ENTREPRENEUR_CLAIMS.view)(options); await createAuthGuard(ENTREPRENEUR_CLAIMS.edit)(options); }, component: lazyRouteComponent(() => import("./entrepreneur-form-page"), "EditEntrepreneurPage") });
export const entrepreneursRouteTree = root.addChildren([list, create, edit]);
