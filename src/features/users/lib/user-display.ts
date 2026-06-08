import { isClientePortalRole } from "@/lib/role-guards";
import type { AppUser } from "@/lib/types";

export function getRoleText(role: AppUser["role"]): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "client":
      return "Cliente Gestão";
    case "cliente_autonomo":
      return "Cliente Autônomo";
    case "representative":
      return "Representante";
    case "consultor_representante":
      return "Consultor-Representante";
    case "technical":
      return "Técnico";
    case "sales":
      return "Vendas";
    case "financial":
      return "Financeiro";
    case "gestor":
      return "Gestor Ambiental";
    case "supervisor":
      return "Supervisor";
    case "diretor_fauna":
      return "Diretor de Fauna";
    case "advogado":
      return "Advogado";
    default:
      return role;
  }
}

export function getPackageLabel(pkg?: string): string {
  const labels: Record<string, string> = {
    gratuito: "Gratuito",
    basico: "Básico",
    intermediario: "Intermediário",
    avancado: "Avançado",
    completo: "Completo",
    sob_consulta: "Sob Consulta",
  };
  return pkg ? labels[pkg] || pkg : "Não informado";
}

export function canDeleteUser(
  target: AppUser | null,
  sessionTargetUid: string | null,
  currentRole: AppUser["role"] | undefined,
): boolean {
  return (
    !!target &&
    !!sessionTargetUid &&
    (currentRole === "admin" ||
      ((isClientePortalRole(currentRole) || currentRole === "representative") &&
        (target.id === sessionTargetUid || target.uid === sessionTargetUid)))
  );
}

export type ApprovedTitularEntry = {
  name: string;
  cpfCnpj: string;
  type: "cliente" | "empreendedor";
};

export function buildApprovedTitularesFromEntities(
  clients: { name: string; cpfCnpj?: string }[] | null | undefined,
  empreendedores: { name: string; cpfCnpj?: string }[] | null | undefined,
): ApprovedTitularEntry[] {
  const byCpf = new Map<string, ApprovedTitularEntry>();
  const add = (
    item: { name: string; cpfCnpj?: string },
    type: "cliente" | "empreendedor",
  ) => {
    const key = (item.cpfCnpj || "").replace(/\D/g, "");
    if (key.length >= 11 && !byCpf.has(key)) {
      byCpf.set(key, {
        name: item.name,
        cpfCnpj: item.cpfCnpj || "",
        type,
      });
    }
  };
  clients?.forEach((c) => add(c, "cliente"));
  empreendedores?.forEach((e) => add(e, "empreendedor"));
  return Array.from(byCpf.values());
}
