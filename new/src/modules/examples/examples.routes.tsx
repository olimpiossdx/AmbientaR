import { createRoute } from "@tanstack/react-router";
import { authenticatedRoute } from "../../app/router/authenticated-route";
import { createAuthGuard } from "../../app/router/auth-guards";

export const examplesRouteTree = createRoute({
 getParentRoute: () => authenticatedRoute,
 path: "/exemplos",
 beforeLoad: createAuthGuard({
  claimType: "recurso.claim",
  claimValue: "visualizar",
 }),
 component: () => <>ola</>,
});
