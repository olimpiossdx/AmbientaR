import { createRoute } from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import { ensureAuthenticatedShell } from "./auth-guards";
import { rootRoute } from "./root-route";

const LazyAuthenticatedLayout = lazy(async () => {
 const module = await import("../../layouts/authenticated-layout");
 return { default: module.AuthenticatedLayout };
});

function AuthenticatedRouteLayout() {
 return (
  <Suspense fallback={null}>
   <LazyAuthenticatedLayout />
  </Suspense>
 );
}

export const authenticatedRoute = createRoute({
 getParentRoute: () => rootRoute,
 path: "/app",
 component: AuthenticatedRouteLayout,
 beforeLoad: ensureAuthenticatedShell,
});
