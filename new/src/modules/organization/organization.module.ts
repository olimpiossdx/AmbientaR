import type { AppModule } from "../../app/app.types";
import { organizationRouteTree } from "./organization.routes";
export const organizationModule = {
 id: "organization", order: 25, routeTree: organizationRouteTree,
 navigation: [],
} satisfies AppModule;
