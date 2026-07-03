"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GEOREF_TRAMITES_SUBMENU_LABEL } from "@/lib/licenciamento-menu";
import { cn } from "@/lib/utils";

const LINKS: { href: string; label: string; exact?: boolean }[] = [
  { href: "/georeferenciamento", label: "Painel", exact: true },
  { href: "/georeferenciamento/processos", label: GEOREF_TRAMITES_SUBMENU_LABEL },
  { href: "/georeferenciamento/rural", label: "Rural (SIGEF)" },
  { href: "/georeferenciamento/urbano", label: "Urbano" },
  { href: "/georeferenciamento/ambiental", label: "CAR" },
  { href: "/georeferenciamento/campo", label: "Campo" },
  { href: "/georeferenciamento/documentos", label: "Documentos" },
  { href: "/georeferenciamento/memorial-descritivo", label: "Memorial" },
  { href: "/georeferenciamento/validacoes", label: "Validações" },
  { href: "/georeferenciamento/registro", label: "Cartório" },
  { href: "/georeferenciamento/referencias", label: "Referências" },
] as const;

export function GeorefSubnav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex gap-1 overflow-x-auto border-b bg-muted/30 px-4 md:px-6"
      aria-label="Georeferenciamento"
    >
      {LINKS.map((link) => {
        const active = link.exact
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
    </nav>
  );
}
