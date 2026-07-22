import type { AppModule } from "../../app/app.types";
import { homeRouteTree } from "./home.routes";

export const homeModule = {
 id: "home",
 order: 10,
 routeTree: homeRouteTree,
} satisfies AppModule;
