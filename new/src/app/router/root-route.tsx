import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import type { AppRouterContext } from "./router-context";

function RootLayout() {
 return <Outlet />;
}

export const rootRoute = createRootRouteWithContext<AppRouterContext>()({
 component: RootLayout,
});
