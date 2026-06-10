import type { ClientPackage } from "@/lib/types";

/** Valores anuais (cadastro / PIX). */
export const PACKAGE_ANNUAL_PRICE_BRL: Partial<Record<ClientPackage, number>> = {
  basico: 696,
  intermediario: 1396,
  avancado: 1996,
  completo: 2996,
};

export function formatPackageAnnualLabel(pkg: ClientPackage): string {
  if (pkg === "gratuito") return "R$ 0";
  if (pkg === "sob_consulta") return "Sob consulta";
  const value = PACKAGE_ANNUAL_PRICE_BRL[pkg];
  if (value == null) return "Consulte a equipe";
  return `R$ ${value.toFixed(2).replace(".", ",")} / ano`;
}

export function formatPackageMonthlyHint(
  pkg: ClientPackage,
  tierLabelForFreeTier?: string,
): string {
  if (pkg === "gratuito" || pkg === "sob_consulta") {
    return tierLabelForFreeTier ?? (pkg === "gratuito" ? "Gratuito (degustação)" : "Sob consulta");
  }
  const annual = PACKAGE_ANNUAL_PRICE_BRL[pkg];
  if (!annual) return "";
  const monthly = annual / 12;
  return `~R$ ${monthly.toFixed(0)}/mês`;
}

export function getPackageAnnualAmountLabel(pkg: ClientPackage): string {
  return formatPackageAnnualLabel(pkg);
}
