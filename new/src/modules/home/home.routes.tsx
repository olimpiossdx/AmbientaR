import { createRoute, redirect } from "@tanstack/react-router";
import { authenticatedRoute } from "../../app/router/authenticated-route";
import { createAuthGuard } from "../../app/router/auth-guards";
import HomePage from "../../pages/home-page";
import { DASHBOARD_VIEW_CLAIM } from "../../pages/dashboard/dashboard.types";

export const homeRouteTree = createRoute({
 getParentRoute: () => authenticatedRoute,
 path: "/",
 beforeLoad: async (options) => {
  await createAuthGuard()(options);
  if (!options.context.authorization.satisfies(DASHBOARD_VIEW_CLAIM)) {
   const snapshot = options.context.auth.getSnapshot();
   if (snapshot.registrationMode || snapshot.onboarding) {
    throw redirect({ to: "/app/primeiros-passos" as never });
   }
   throw redirect({ to: "/app/acesso-negado" as never });
  }
 },
 component: HomePage,
});
