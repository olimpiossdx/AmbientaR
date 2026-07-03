import type { Client, Empreendedor, UserRole } from "@/lib/types";
import {
  canPerformOperationalWrite,
  isAdminRole,
} from "@/lib/role-guards";

export type CtfIbamaEntity = Pick<
  Empreendedor,
  | "ctfIbama"
  | "ctfIbamaCartaoUrl"
  | "ctfIbamaCartaoUpdatedAt"
  | "ctfIbamaCertificadoUrl"
  | "ctfIbamaCertificadoValidade"
  | "ctfIbamaCertificadoUpdatedAt"
>;

export type CtfStatusBadge = {
  label: string;
  className: string;
};

export type CtfListFilter = "todos" | "pendentes" | "vencidos" | "validos";

/** Quem pode carregar/atualizar documentos CTF/IBAMA na UI. */
export function canManageCtfIbamaDocs(role: UserRole | undefined | null): boolean {
  if (!role) return false;
  if (isAdminRole(role)) return true;
  if (canPerformOperationalWrite(role)) return true;
  if (role === "technical" || role === "advogado" || role === "diretor_fauna") {
    return true;
  }
  if (role === "client" || role === "cliente_autonomo") return true;
  return false;
}

export function formatCtfDateBr(iso?: string | null): string {
  if (!iso?.trim()) return "—";
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function formatCtfDateTimeBr(iso?: string | null): string {
  if (!iso?.trim()) return "—";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString("pt-BR");
}

export function daysUntilCtfCertificadoValidade(iso?: string | null): number | null {
  if (!iso?.trim()) return null;
  const due = new Date(`${iso}T23:59:59`);
  if (Number.isNaN(due.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

export function isCtfCartaoMissing(entity: CtfIbamaEntity): boolean {
  return !entity.ctfIbamaCartaoUrl?.trim();
}

export function isCtfCertificadoMissing(entity: CtfIbamaEntity): boolean {
  return !entity.ctfIbamaCertificadoUrl?.trim();
}

export function isCtfCertificadoVencido(entity: CtfIbamaEntity): boolean {
  const dias = daysUntilCtfCertificadoValidade(entity.ctfIbamaCertificadoValidade);
  return dias !== null && dias < 0;
}

export function isCtfPendente(entity: CtfIbamaEntity): boolean {
  return isCtfCartaoMissing(entity) || isCtfCertificadoMissing(entity);
}

export function cartaoStatus(entity: CtfIbamaEntity): CtfStatusBadge {
  if (isCtfCartaoMissing(entity)) {
    return {
      label: "Cartão ausente",
      className: "bg-amber-500/20 text-amber-800 border-amber-500/30",
    };
  }
  return {
    label: "Cartão carregado",
    className: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30",
  };
}

export function certificadoStatus(entity: CtfIbamaEntity): CtfStatusBadge {
  if (isCtfCertificadoMissing(entity)) {
    return {
      label: "Certificado ausente",
      className: "bg-slate-500/20 text-slate-700 border-slate-500/30",
    };
  }
  const dias = daysUntilCtfCertificadoValidade(entity.ctfIbamaCertificadoValidade);
  if (dias === null) {
    return {
      label: "Certificado carregado",
      className: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30",
    };
  }
  if (dias < 0) {
    return {
      label: "Certificado vencido",
      className: "bg-red-500/20 text-red-700 border-red-500/30",
    };
  }
  if (dias <= 30) {
    return {
      label: `Vence em ${dias} dia(s)`,
      className: "bg-amber-500/20 text-amber-800 border-amber-500/30",
    };
  }
  return {
    label: "Certificado válido",
    className: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30",
  };
}

export function matchesCtfListFilter(
  entity: CtfIbamaEntity,
  filter: CtfListFilter,
): boolean {
  if (filter === "todos") return true;
  if (filter === "pendentes") return isCtfPendente(entity);
  if (filter === "vencidos") return isCtfCertificadoVencido(entity);
  if (filter === "validos") {
    return (
      !isCtfCartaoMissing(entity) &&
      !isCtfCertificadoMissing(entity) &&
      !isCtfCertificadoVencido(entity)
    );
  }
  return true;
}

export type CtfIbamaSyncFields = {
  ctfIbama?: string;
  ctfIbamaCartaoUrl?: string;
  ctfIbamaCartaoUpdatedAt?: string;
  ctfIbamaCertificadoUrl?: string;
  ctfIbamaCertificadoValidade?: string;
  ctfIbamaCertificadoUpdatedAt?: string;
};

export function pickCtfIbamaSyncFields(
  data: Record<string, string | undefined>,
): CtfIbamaSyncFields {
  const out: CtfIbamaSyncFields = {};
  const keys: (keyof CtfIbamaSyncFields)[] = [
    "ctfIbama",
    "ctfIbamaCartaoUrl",
    "ctfIbamaCartaoUpdatedAt",
    "ctfIbamaCertificadoUrl",
    "ctfIbamaCertificadoValidade",
    "ctfIbamaCertificadoUpdatedAt",
  ];
  for (const key of keys) {
    if (key in data) out[key] = data[key];
  }
  return out;
}

export type CtfIbamaDetailSource = CtfIbamaEntity & { name?: string };

export function hasAnyCtfDocument(entity: CtfIbamaEntity): boolean {
  return Boolean(
    entity.ctfIbamaCartaoUrl?.trim() || entity.ctfIbamaCertificadoUrl?.trim(),
  );
}

export function ctfSummaryForClient(entity: Client | Empreendedor): string {
  const parts: string[] = [];
  if (entity.ctfIbama?.trim()) parts.push(`Nº ${entity.ctfIbama.trim()}`);
  if (entity.ctfIbamaCertificadoValidade?.trim()) {
    parts.push(`Validade ${formatCtfDateBr(entity.ctfIbamaCertificadoValidade)}`);
  }
  return parts.join(" · ") || "Não informado";
}
