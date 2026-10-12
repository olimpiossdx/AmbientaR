import { Building2 } from "lucide-react";
import type { AppModule } from "../../app/app.types";
import { organizationRouteTree } from "./organization.routes";
export const organizationModule = {
 id: "organization", order: 25, routeTree: organizationRouteTree,
 navigation: [{ to: "/app/organization", label: "Minha empresa", icon: Building2, order: 25 }],
} satisfies AppModule;
