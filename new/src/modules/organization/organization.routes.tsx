import { createRoute } from "@tanstack/react-router";
import { authenticatedRoute } from "../../app/router/authenticated-route";
import { createAuthGuard } from "../../app/router/auth-guards";
import { OrganizationPage } from "./organization-page";
export const organizationRouteTree = createRoute({
 getParentRoute: () => authenticatedRoute,
 path: "/organization",
 beforeLoad: createAuthGuard(),
 component: OrganizationPage,
});
