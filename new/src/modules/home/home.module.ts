import { LayoutDashboard } from "lucide-react";
import type { AppModule } from "../../app/app.types";
import { DASHBOARD_VIEW_CLAIM } from "../../pages/dashboard/dashboard.types";
import { homeRouteTree } from "./home.routes";

export const homeModule = {
 id: "home",
 order: 10,
 routeTree: homeRouteTree,
 navigation: [{
  to: "/app",
  legacyHref: "/",
  label: "Painel",
  order: 10,
  icon: LayoutDashboard,
  claim: DASHBOARD_VIEW_CLAIM,
 }],
} satisfies AppModule;
