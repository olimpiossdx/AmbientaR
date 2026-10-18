import { createRoute, lazyRouteComponent, Outlet } from "@tanstack/react-router";
import { authenticatedRoute } from "../../app/router/authenticated-route";
import { createAuthGuard } from "../../app/router/auth-guards";
import { PROJECT_CLAIMS } from "./projects.types";
const root = createRoute({ getParentRoute: () => authenticatedRoute, path: "/projects", beforeLoad: createAuthGuard(), component: Outlet });
const list = createRoute({ getParentRoute: () => root, path: "/", beforeLoad: createAuthGuard(PROJECT_CLAIMS.view), validateSearch: (search: Record<string,unknown>) => ({ q: typeof search.q === "string" ? search.q.slice(0,200) : "", page: Number.isSafeInteger(Number(search.page)) && Number(search.page)>0 ? Math.min(100000,Number(search.page)):1, status: search.status === "andamento" || search.status === "concluido" ? search.status : "" }), component: lazyRouteComponent(() => import("./projects-page"), "ProjectsPage") });
const create = createRoute({ getParentRoute: () => root, path: "/new", beforeLoad: createAuthGuard(PROJECT_CLAIMS.create), component: lazyRouteComponent(() => import("./project-form-page"), "NewProjectPage") });
const edit = createRoute({ getParentRoute: () => root, path: "/$id/edit", beforeLoad: async options => { await createAuthGuard(PROJECT_CLAIMS.view)(options); await createAuthGuard(PROJECT_CLAIMS.edit)(options); }, component: lazyRouteComponent(() => import("./project-form-page"), "EditProjectPage") });
export const projectsRouteTree = root.addChildren([list,create,edit]);
