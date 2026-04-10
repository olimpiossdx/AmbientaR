import type { UserRole } from "@/lib/types";

/** Rótulos em português para exibição (menu, cabeçalho, formulários). */
export const ROLE_LABELS_PT: Record<UserRole, string> = {
  admin: "Administrador",
  client: "Cliente Gestão",
  cliente_autonomo: "Cliente Autônomo",
  representative: "Representante",
  technical: "Técnico",
  sales: "Vendas",
  financial: "Financeiro",
  gestor: "Gestor Ambiental",
  supervisor: "Supervisor",
  diretor_fauna: "Diretor de Fauna",
  advogado: "Advogado",
};

export function getRoleLabelPt(role: string | undefined | null): string {
  if (!role) return "";
  return ROLE_LABELS_PT[role as UserRole] ?? role;
}
