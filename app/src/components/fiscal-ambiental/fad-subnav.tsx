"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FAD_ACTIVE_TABS, FAD_COMING_SOON_TABS } from "@/lib/fiscal-ambiental/fad-menu";
import { cn } from "@/lib/utils";

export function FadSubnav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex gap-1 overflow-x-auto border-b bg-muted/30 px-4 md:px-6"
      aria-label="Fiscal Ambiental Digital"
    >
      {FAD_ACTIVE_TABS.map((link) => {
        const active =
          "exact" in link && link.exact
            ? pathname === link.href
            : pathname === link.href || pathname?.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
      {FAD_COMING_SOON_TABS.map((link) => {
        const active = pathname === link.href || pathname?.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground/70 hover:text-muted-foreground",
            )}
          >
            {link.label}
            <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal uppercase tracking-wide">
              Em breve
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
