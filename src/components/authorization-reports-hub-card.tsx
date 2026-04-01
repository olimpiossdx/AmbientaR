"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { allNavItems } from "@/lib/navigation-config";
import type { AppUser, NavItem } from "@/lib/types";

type HubLink = {
  href: string;
  label: string;
  icon?: NavItem["icon"];
};

function flattenLinks(items: NavItem[], role: AppUser["role"], parentLabel?: string): HubLink[] {
  const links: HubLink[] = [];

  for (const item of items) {
    if (!item.roles?.includes(role)) continue;

    if (item.href) {
      links.push({
        href: item.href,
        label: parentLabel ? `${parentLabel} · ${item.label}` : item.label,
        icon: item.icon,
      });
    }

    if (item.subItems?.length) {
      links.push(...flattenLinks(item.subItems, role, item.href ? undefined : item.label));
    }
  }

  return links;
}

export function AuthorizationReportsHubCard({ role }: { role: AppUser["role"] }) {
  const authGroup = allNavItems.find((item) => item.label === "Autorizações/Relatórios");
  if (!authGroup?.subItems) return null;

  const links = flattenLinks(authGroup.subItems, role).sort((a, b) =>
    a.label.localeCompare(b.label, "pt-BR", { sensitivity: "base" }),
  );
  if (links.length === 0) return null;

  return (
    <Card className="md:hidden border-0 shadow-none bg-transparent">
      <CardContent className="p-0">
        <div className="grid grid-cols-2 gap-2">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.href}
                asChild
                variant="outline"
                className="h-auto min-h-[96px] overflow-visible py-3 px-2 whitespace-normal rounded-lg border-2 border-border/90 shadow-sm"
              >
                <Link
                  href={item.href}
                  className="flex flex-col items-center justify-center gap-2 w-full overflow-visible text-center"
                >
                  {Icon ? (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-visible">
                      <Icon
                        className="h-11 w-11 shrink-0 origin-center scale-[1.50] text-primary"
                        aria-hidden
                      />
                    </span>
                  ) : null}
                  <span className="text-[13px] sm:text-sm leading-tight text-center line-clamp-3 text-foreground/90">
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

