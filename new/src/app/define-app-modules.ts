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
 const navigation = modules.flatMap((module) => module.navigation ?? []);
 return mergeNavigationItems(navigation)
  .sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
}

function labelKey(label: NavigationItem["label"]): string | undefined {
 return typeof label === "string" || typeof label === "number"
  ? String(label).trim().toLocaleLowerCase("pt-BR")
  : undefined;
}

function navigationKey(item: NavigationItem): string | undefined {
 if (item.id) return `id:${item.id}`;
 if (item.to) return `to:${item.to}`;
 if (item.legacyHref) return `legacy:${item.legacyHref}`;
 const label = labelKey(item.label);
 return label ? `label:${label}` : undefined;
}

function earliestOrder(
 left: number | undefined,
 right: number | undefined,
): number | undefined {
 if (left === undefined) return right;
 if (right === undefined) return left;
 return Math.min(left, right);
}

/**
 * Módulos podem contribuir filhos para o mesmo agrupador de menu. Isso permite
 * migrar uma FUN por vez sem manter uma segunda matriz global de navegação.
 */
export function mergeNavigationItems(
 items: readonly NavigationItem[],
): NavigationItem[] {
 const merged: NavigationItem[] = [];
 const positions = new Map<string, number>();

 for (const source of items) {
  const item: NavigationItem = {
   ...source,
   children: source.children ? mergeNavigationItems(source.children) : undefined,
  };
  const key = navigationKey(item);
  const position = key === undefined ? undefined : positions.get(key);

  if (position === undefined) {
   if (key !== undefined) positions.set(key, merged.length);
   merged.push(item);
   continue;
  }

  const current = merged[position];
  const children = mergeNavigationItems([
   ...(current.children ?? []),
   ...(item.children ?? []),
  ]);
  merged[position] = {
   ...current,
   ...item,
   order: earliestOrder(current.order, item.order),
   children: children.length > 0 ? children : undefined,
  };
 }

 return merged;
}
