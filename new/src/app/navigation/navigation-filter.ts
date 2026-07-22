import type { AuthorizationService } from "../authorization/authorization-service";
import type { NavigationItem } from "./navigation.types";

export function filterNavigationByClaims( items: readonly NavigationItem[],authorization: AuthorizationService): NavigationItem[] {
  const visible: NavigationItem[] = [];

  for (const item of items) {
    if (item.claim && !authorization.satisfies(item.claim)) {
      continue;
    }

    const children = item.children
      ? filterNavigationByClaims(item.children, authorization)
      : undefined;

    if (item.children && children?.length === 0) {
      continue;
    }

    visible.push({ ...item, children });
  }

  return visible.sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
}
