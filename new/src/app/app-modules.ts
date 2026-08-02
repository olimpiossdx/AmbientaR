import { agendaModule } from "../modules/agenda/agenda.module";
import { examplesModule } from "../modules/examples/examples.module";
import { homeModule } from "../modules/home/home.module";
import { legacyFeatureModule } from "../modules/legacy-feature/legacy-feature.module";
import { migrationPlanModule } from "../modules/migration-plan/migration-plan.module";
import { usersModule } from "../modules/users/users.module";
import { defineAppModules, getModuleRouteTrees } from "./define-app-modules";

export const appModules = defineAppModules(
 homeModule,
 migrationPlanModule,
 usersModule,
 agendaModule,
 legacyFeatureModule,
 examplesModule,
);

export const appModuleRoutes = getModuleRouteTrees(appModules);
