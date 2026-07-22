import { createRoute, redirect } from "@tanstack/react-router";
import { authenticatedRoute } from "../../app/router/authenticated-route";
import { createAuthGuard } from "../../app/router/auth-guards";
import { LegacyFeaturePage } from "./legacy-feature-page";
import { getNavigationRequirementsForPath } from "../navigation/navigation-registry";

export const legacyFeatureRouteTree = createRoute({
 getParentRoute: () => authenticatedRoute,
 path: "$",
 beforeLoad: async (options) => {
  await createAuthGuard()(options);

  const requirements = getNavigationRequirementsForPath(options.location.pathname);
  const allowed = requirements.every((requirement) => (
   options.context.authorization.satisfies(requirement)
  ));

  if (!allowed) {
   throw redirect({ to: "/app/acesso-negado" });
  }
 },
 component: LegacyFeaturePage,
});
