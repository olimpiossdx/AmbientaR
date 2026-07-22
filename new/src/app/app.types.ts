import type { AnyRoute } from "@tanstack/react-router";
import type { NavigationItem } from "./navigation/navigation.types";

export type AppModule<TRoute extends AnyRoute = AnyRoute> = {
 id: string;
 order?: number;
 routeTree: TRoute;
 navigation?: readonly NavigationItem[];
};
