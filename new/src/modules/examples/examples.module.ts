import type { AppModule } from "../../app/app.types";
import { examplesRouteTree } from "./examples.routes";

export const examplesModule = {
 id: "examples",
 order: 90,
 routeTree: examplesRouteTree,
} satisfies AppModule;
