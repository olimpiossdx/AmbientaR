import {
  Outlet,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { AuthenticatedLayout } from "./layouts/authenticated-layout";
import { ForgotPasswordView, LoginView, RegisterView } from "./auth";
import HomePage from "./pages/home-page";
import { LegacyFeaturePage } from "./modules/legacy-feature";
import { MigrationPlanPage } from "./modules/migration-plan";
import {
  authRouterContext,
  type AuthRouterContext,
} from "./auth/auth-router-context";
import { isRoleAllowedForPath } from "./modules/auth/route-access";

function RootLayout() {
  return <Outlet />;
}

const rootRoute = createRootRouteWithContext<{ auth: AuthRouterContext }>()({
  component: RootLayout,
});

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

const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/app",
  component: AuthenticatedLayout,
  beforeLoad: async ({ context, location }) => {
    const auth = await context.auth.ensureSession();

    if (auth.status === "anonymous") {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }

    if (auth.status === "locked") {
      context.auth.setPendingLocation(location.href);
    }

    if (
      auth.status === "authenticated" &&
      !isRoleAllowedForPath(auth.user?.role, location.pathname)
    ) {
      throw redirect({ to: "/app" });
    }
  },
});

const appIndexRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/",
  component: HomePage,
});

const examplesRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/exemplos",
  component: ()=>{
    return<>ola </>
  },
});

const migrationPlanRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/plano-migracao",
  component: MigrationPlanPage,
});

const legacyFeatureRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "$",
  component: LegacyFeaturePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  forgotPasswordRoute,
  registerRoute,
  authenticatedRoute.addChildren([appIndexRoute, examplesRoute, migrationPlanRoute, legacyFeatureRoute]),
]);

export const router = createRouter({
  routeTree,
  context: {
    auth: authRouterContext,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
