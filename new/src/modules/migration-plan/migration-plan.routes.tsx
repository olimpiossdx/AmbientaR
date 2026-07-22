import { createRoute } from "@tanstack/react-router";
import { authenticatedRoute } from "../../app/router/authenticated-route";
import { createAuthGuard } from "../../app/router/auth-guards";
import { MigrationPlanPage } from "./migration-plan-page";

export const migrationPlanRouteTree = createRoute({
 getParentRoute: () => authenticatedRoute,
 path: "/plano-migracao",
 beforeLoad: createAuthGuard({
  claimType: "recurso.claim",
  claimValue: "visualizar",
 }),
 component: MigrationPlanPage,
});
