import { createRoute } from "@tanstack/react-router";
import { authenticatedRoute } from "../../app/router/authenticated-route";
import { createAuthGuard } from "../../app/router/auth-guards";
import HomePage from "../../pages/home-page";
import { DASHBOARD_VIEW_CLAIM } from "../../pages/dashboard/dashboard.types";

export const homeRouteTree = createRoute({
 getParentRoute: () => authenticatedRoute,
 path: "/",
 beforeLoad: createAuthGuard(DASHBOARD_VIEW_CLAIM),
 component: HomePage,
});
