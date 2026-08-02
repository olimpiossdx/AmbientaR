import { ClipboardList } from "lucide-react";
import type { AppModule } from "../../app/app.types";
import { migrationPlanRouteTree } from "./migration-plan.routes";

export const migrationPlanModule = {
 id: "migration-plan",
 order: 20,
 routeTree: migrationPlanRouteTree,
 navigation: [{
  to: "/app/plano-migracao",
  legacyHref: "/plano-migracao",
  label: "Plano de Migração",
  order: 20,
  icon: ClipboardList,
  claim: { claimType: "recurso.claim", claimValue: "visualizar" },
 }],
} satisfies AppModule;
