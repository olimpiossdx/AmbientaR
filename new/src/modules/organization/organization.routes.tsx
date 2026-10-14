import { createRoute } from "@tanstack/react-router";
import { authenticatedRoute } from "../../app/router/authenticated-route";
import { createAuthGuard } from "../../app/router/auth-guards";
import { OrganizationPage } from "./organization-page";
import { redirect } from "@tanstack/react-router";
export const organizationRouteTree = createRoute({
 getParentRoute: () => authenticatedRoute,
 path: "/organization",
 beforeLoad: async (options) => {
  await createAuthGuard()(options);
  const snapshot = options.context.auth.getSnapshot();
  const canCreateOrganization = snapshot.onboarding?.nextAction === "create_organization" || (
   !snapshot.onboarding &&
   snapshot.registrationMode === "cliente_autonomo" &&
   !snapshot.user?.organizationId
  );
  if (!canCreateOrganization) {
   throw redirect({ to: "/app/primeiros-passos" as never });
  }
 },
 component: OrganizationPage,
});
