import type { UserRole } from "@/lib/types";
import { FAD_ROUTE_BASE } from "./constants";

export { FAD_ROUTE_BASE };

export const FAD_MENU_LABEL = "Fiscal Ambiental Digital";

export const FAD_NAV_ROLES: UserRole[] = [
  "admin",
  "technical",
  "gestor",
  "supervisor",
  "advogado",
  "diretor_fauna",
];

export const FAD_ACTIVE_TABS = [
  { href: `${FAD_ROUTE_BASE}/dashboard`, label: "Início", exact: true },
  { href: `${FAD_ROUTE_BASE}/montar-acervo`, label: "Montar acervo" },
  { href: `${FAD_ROUTE_BASE}/biblioteca`, label: "Biblioteca" },
  { href: `${FAD_ROUTE_BASE}/linha-do-tempo`, label: "Linha do tempo" },
  { href: `${FAD_ROUTE_BASE}/comparador`, label: "Comparar" },
] as const;

export const FAD_COMING_SOON_TABS = [
  { href: `${FAD_ROUTE_BASE}/evidencias`, label: "Evidências" },
  { href: `${FAD_ROUTE_BASE}/inteligencia`, label: "Inteligência" },
  { href: `${FAD_ROUTE_BASE}/fiscalizacao`, label: "Fiscalização" },
  { href: `${FAD_ROUTE_BASE}/relatorios`, label: "Relatórios" },
  { href: `${FAD_ROUTE_BASE}/monitoramento`, label: "Monitoramento" },
  { href: `${FAD_ROUTE_BASE}/esg`, label: "Auditoria ESG" },
  { href: `${FAD_ROUTE_BASE}/configuracoes`, label: "Configurações" },
] as const;
