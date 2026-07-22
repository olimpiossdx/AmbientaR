import type { AppModule } from "../../app/app.types";
import { adminNavigationItems } from "../navigation/navigation-registry";
import { legacyFeatureRouteTree } from "./legacy-feature.routes";

export const legacyFeatureModule = {
 id: "legacy-features",
 order: 80,
 routeTree: legacyFeatureRouteTree,
 navigation: adminNavigationItems,
} satisfies AppModule;
