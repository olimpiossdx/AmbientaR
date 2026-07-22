import { examplesModule } from "../modules/examples/examples.module";
import { homeModule } from "../modules/home/home.module";
import { legacyFeatureModule } from "../modules/legacy-feature/legacy-feature.module";
import { migrationPlanModule } from "../modules/migration-plan/migration-plan.module";
import { defineAppModules, getModuleRouteTrees } from "./define-app-modules";

export const appModules = defineAppModules(
 homeModule,
 migrationPlanModule,
 legacyFeatureModule,
 examplesModule,
);

export const appModuleRoutes = getModuleRouteTrees(appModules);
