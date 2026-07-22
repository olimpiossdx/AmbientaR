import type { AnyRoute } from "@tanstack/react-router";
import type { AppModule } from "./app.types";
import type { NavigationItem } from "./navigation/navigation.types";

export function defineAppModules<const TModules extends readonly AppModule[]>(
 ...modules: TModules
): TModules {
 return modules;
}

type ModuleRouteTrees<TModules extends readonly AppModule[]> = {
 readonly [TIndex in keyof TModules]: TModules[TIndex] extends AppModule<infer TRoute>
  ? TRoute
  : never;
};

export function getModuleRouteTrees<const TModules extends readonly AppModule[]>(
 modules: TModules,
): ModuleRouteTrees<TModules> {
 return modules.map((module) => module.routeTree) as ModuleRouteTrees<TModules>;
}

export function getModuleNavigation(
 modules: readonly AppModule<AnyRoute>[],
): NavigationItem[] {
 return modules
  .flatMap((module) => module.navigation ?? [])
  .sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
}
