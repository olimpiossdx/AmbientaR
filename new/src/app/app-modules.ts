import { projectsModule } from "../modules/projects/projects.module";
import { entrepreneursModule } from "../modules/entrepreneurs/entrepreneurs.module";
import { organizationModule } from "../modules/organization/organization.module";
import { agendaModule } from "../modules/agenda/agenda.module";
import { examplesModule } from "../modules/examples/examples.module";
import { homeModule } from "../modules/home/home.module";
import { legacyFeatureModule } from "../modules/legacy-feature/legacy-feature.module";
import { migrationPlanModule } from "../modules/migration-plan/migration-plan.module";
import { usersModule } from "../modules/users/users.module";
import { defineAppModules, getModuleRouteTrees } from "./define-app-modules";

export const appModules = defineAppModules(
 homeModule,
 organizationModule,
 migrationPlanModule,
 usersModule,
 entrepreneursModule,
 projectsModule,
 agendaModule,
 legacyFeatureModule,
 examplesModule,
);

export const appModuleRoutes = getModuleRouteTrees(appModules);
