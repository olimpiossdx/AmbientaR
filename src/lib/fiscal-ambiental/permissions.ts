import type { UserRole } from "@/lib/types";

export const FISCAL_AMBIENTAL_ROLES = {
  view: [
    "admin",
    "technical",
    "gestor",
    "supervisor",
    "advogado",
    "client",
    "cliente_autonomo",
  ] as UserRole[],
  buildArchive: ["admin", "technical", "gestor", "supervisor"] as UserRole[],
  downloadGeoTiff: ["admin", "technical", "gestor", "supervisor"] as UserRole[],
  runIntelligence: ["admin", "technical", "gestor"] as UserRole[],
  runFiscalChecks: ["admin", "technical", "gestor", "advogado"] as UserRole[],
  generateReports: ["admin", "technical", "gestor", "advogado"] as UserRole[],
  configureMonitoring: ["admin", "technical", "gestor"] as UserRole[],
  deleteArchive: ["admin"] as UserRole[],
} as const;

export function roleCanViewFad(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return (FISCAL_AMBIENTAL_ROLES.view as readonly string[]).includes(role);
}
