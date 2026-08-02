import { createRoute, createRouter, redirect } from "@tanstack/react-router";
import { appModuleRoutes } from "./app/app-modules";
import { authorizationService } from "./app/authorization/authorization-service";
import { createAuthGuard } from "./app/router/auth-guards";
import { authenticatedRoute } from "./app/router/authenticated-route";
import { rootRoute } from "./app/router/root-route";
import { authRouterContext } from "./auth/auth-router-context";
import { ForgotPasswordView, LoginView, RegisterView } from "./auth";
import { AccessDeniedPage } from "./pages/access-denied-page";
import { OfflinePage } from "./pages/offline-page";
import { PrivacyPolicyPage } from "./pages/privacy-policy-page";

const indexRoute = createRoute({
 getParentRoute: () => rootRoute,
 path: "/",
 beforeLoad: () => {
  throw redirect({ to: "/app" });
 },
});

const loginRoute = createRoute({
 getParentRoute: () => rootRoute,
 path: "/login",
 component: LoginView,
});

const forgotPasswordRoute = createRoute({
 getParentRoute: () => rootRoute,
 path: "/forgot-password",
 component: ForgotPasswordView,
});

const registerRoute = createRoute({
 getParentRoute: () => rootRoute,
 path: "/register",
 component: RegisterView,
});

const privacyPolicyRoute = createRoute({
 getParentRoute: () => rootRoute,
 path: "/politica-privacidade",
 component: PrivacyPolicyPage,
});

const offlineRoute = createRoute({
 getParentRoute: () => rootRoute,
 path: "/offline",
 component: OfflinePage,
});

const accessDeniedRoute = createRoute({
 getParentRoute: () => authenticatedRoute,
 path: "/acesso-negado",
 beforeLoad: createAuthGuard(),
 component: AccessDeniedPage,
});

const sessionLockedRoute = createRoute({
 getParentRoute: () => authenticatedRoute,
 path: "/sessao-bloqueada",
 beforeLoad: createAuthGuard(),
 component: () => null,
});

const routeTree = rootRoute.addChildren([
 indexRoute,
 loginRoute,
 forgotPasswordRoute,
 registerRoute,
 privacyPolicyRoute,
 offlineRoute,
 authenticatedRoute.addChildren([
  accessDeniedRoute,
  sessionLockedRoute,
  ...appModuleRoutes,
 ]),
]);

export const router = createRouter({
 routeTree,
 context: {
  auth: authRouterContext,
  authorization: authorizationService,
 },
});

declare module "@tanstack/react-router" {
 interface Register {
  router: typeof router;
 }
}
