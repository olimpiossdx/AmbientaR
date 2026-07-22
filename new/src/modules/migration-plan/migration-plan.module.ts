import type { AppModule } from "../../app/app.types";
import { migrationPlanRouteTree } from "./migration-plan.routes";

export const migrationPlanModule = {
 id: "migration-plan",
 order: 20,
 routeTree: migrationPlanRouteTree,
} satisfies AppModule;
