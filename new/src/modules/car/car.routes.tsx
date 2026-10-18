import { createRoute, lazyRouteComponent, Outlet } from "@tanstack/react-router";
import { authenticatedRoute } from "../../app/router/authenticated-route";
import { createAuthGuard } from "../../app/router/auth-guards";
import { CAR_CLAIMS } from "./car.types";
const root = createRoute({ getParentRoute: () => authenticatedRoute, path: "/car", beforeLoad: createAuthGuard(), component: Outlet });
const list = createRoute({
  getParentRoute: () => root, path: "/",
  beforeLoad: createAuthGuard(CAR_CLAIMS.view),
  validateSearch: (search: Record<string, unknown>) => ({ q: typeof search.q === "string" ? search.q.slice(0, 200) : "", page: Number.isSafeInteger(Number(search.page)) && Number(search.page) > 0 ? Math.min(100000, Number(search.page)) : 1 }),
  component: lazyRouteComponent(() => import("./car-page"), "CarPage"),
});
const create = createRoute({ getParentRoute: () => root, path: "/new", beforeLoad: async options => { await createAuthGuard(CAR_CLAIMS.view)(options); await createAuthGuard(CAR_CLAIMS.create)(options); }, component: lazyRouteComponent(() => import("./car-form-page"), "NewCarPage") });
const edit = createRoute({ getParentRoute: () => root, path: "/$id/edit", beforeLoad: async options => { await createAuthGuard(CAR_CLAIMS.view)(options); await createAuthGuard(CAR_CLAIMS.edit)(options); }, component: lazyRouteComponent(() => import("./car-form-page"), "EditCarPage") });
export const carRouteTree = root.addChildren([list, create, edit]);
