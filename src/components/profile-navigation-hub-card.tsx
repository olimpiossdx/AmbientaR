"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { allNavItems } from "@/lib/navigation-config";
import type { AppUser, NavItem, NavSubItem } from "@/lib/types";

type NavigationHubLink = {
  href: string;
  label: string;
  icon?: NavItem["icon"];
};

type ProfileNavigationHubCardProps = {
  role: AppUser["role"];
  excludeGroupLabels?: string[];
};

function isAllowedForRole(
  item: NavItem | NavSubItem,
  role: AppUser["role"],
) {
  return !item.roles || item.roles.includes(role);
}

function sortByLabel<T extends { label: string }>(items: T[]): T[] {
  return [...items].sort((a, b) =>
    a.label.localeCompare(b.label, "pt-BR", { sensitivity: "base" }),
  );
}

function flattenLinks(
  items: (NavItem | NavSubItem)[],
  role: AppUser["role"],
  parentLabel?: string,
): NavigationHubLink[] {
  const links: NavigationHubLink[] = [];

  for (const item of sortByLabel(items)) {
    if (!isAllowedForRole(item, role)) continue;

    if (item.href && item.href !== "/") {
      links.push({
        href: item.href,
        label: parentLabel ? `${parentLabel} · ${item.label}` : item.label,
        icon: item.icon,
      });
    }

    if (item.subItems?.length) {
      links.push(
        ...flattenLinks(item.subItems, role, item.href ? undefined : item.label),
      );
    }
  }

  return links;
}

export function ProfileNavigationHubCard({
  role,
  excludeGroupLabels = [],
}: ProfileNavigationHubCardProps) {
  const excludedLabels = new Set(excludeGroupLabels);
  const visibleItems = allNavItems.filter(
    (item) => !excludedLabels.has(item.label) && isAllowedForRole(item, role),
  );
  const links = flattenLinks(visibleItems, role);

  if (links.length === 0) return null;

  return (
    <Card className="md:hidden border-0 shadow-none bg-transparent">
      <CardContent className="p-0">
        <div className="grid grid-cols-2 gap-2">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={`${item.href}-${item.label}`}
                asChild
                variant="outline"
                className="h-auto min-h-[96px] overflow-visible py-3 px-2 whitespace-normal rounded-lg border-2 border-border/90 shadow-sm"
              >
                <Link
                  href={item.href}
                  className="flex w-full flex-col items-center justify-center gap-2 overflow-visible text-center"
                >
                  {Icon ? (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-visible">
                      <Icon
                        className="h-11 w-11 shrink-0 origin-center scale-[1.50] text-primary"
                        aria-hidden
                      />
                    </span>
                  ) : null}
                  <span className="line-clamp-3 text-center text-[13px] leading-tight text-foreground/90 sm:text-sm">
                    {item.label}
                  </span>
                </Link>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
