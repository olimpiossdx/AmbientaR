import type { AppUser, ClientPackage, PlatformPaymentMethod } from "@/lib/types";
import { isClientePortalRole } from "@/lib/role-guards";

/** Planos com cobrança anual única no cadastro (etapa Pagamento). */
export const CLIENT_PACKAGES_WITH_ANNUAL_PAYMENT: ClientPackage[] = [
  "basico",
  "intermediario",
  "avancado",
  "completo",
];

import { formatPackageAnnualLabel } from "@/lib/package-limits";

/** Texto de referência do valor anual (fonte: package-limits.ts). */
export const PACKAGE_ANNUAL_AMOUNT_LABEL: Partial<Record<ClientPackage, string>> = {
  gratuito: formatPackageAnnualLabel("gratuito"),
  basico: formatPackageAnnualLabel("basico"),
  intermediario: formatPackageAnnualLabel("intermediario"),
  avancado: formatPackageAnnualLabel("avancado"),
  completo: formatPackageAnnualLabel("completo"),
  sob_consulta: formatPackageAnnualLabel("sob_consulta"),
};

export function clientPackageRequiresAnnualPaymentStep(
  pkg: ClientPackage | undefined | null,
): boolean {
  if (!pkg) return false;
  return CLIENT_PACKAGES_WITH_ANNUAL_PAYMENT.includes(pkg);
}

export function isPlatformPaymentAutoApproveEnabled(): boolean {
  return (
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_AMBIENTAR_PLATFORM_PAYMENT_AUTO_APPROVE === "true"
  );
}

/** Fallback quando não há empresa da plataforma em Firestore. Prefira `resolvePlatformPixCopyPaste`. */
export function getPublicPixCopyPaste(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_AMBIENTAR_PIX_COPIA_E_COLA) {
    return process.env.NEXT_PUBLIC_AMBIENTAR_PIX_COPIA_E_COLA;
  }
  return "";
}

/** Contas antigas sem campos de assinatura: não bloquear. */
export function shouldBlockPlatformAccess(user: AppUser | null | undefined): boolean {
  if (!user || !isClientePortalRole(user.role)) return false;

  const st = user.platformPaymentStatus;
  const until = user.platformAccessValidUntil;

  if (st === undefined && until === undefined) return false;

  if (st === "exempt" || st === "pending_contract") return false;

  if (st === "pending_verification") return true;

  if (st === "paid") {
    if (!until) return false;
    return new Date(until).getTime() < Date.now();
  }

  if (st === "expired") return true;

  return false;
}

export function addYearsIso(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString();
}

export function buildPlatformSubscriptionFieldsForNewTitular(
  pkg: ClientPackage,
  method: PlatformPaymentMethod | null,
): Pick<
  AppUser,
  "platformPaymentStatus" | "platformAccessValidUntil" | "platformPaymentMethod"
> {
  const auto = isPlatformPaymentAutoApproveEnabled();

  if (pkg === "gratuito") {
    return {
      platformPaymentStatus: "exempt",
      platformAccessValidUntil: addYearsIso(1),
      platformPaymentMethod: undefined,
    };
  }

  if (pkg === "sob_consulta") {
    return {
      platformPaymentStatus: "pending_contract",
      platformAccessValidUntil: addYearsIso(1),
      platformPaymentMethod: undefined,
    };
  }

  if (clientPackageRequiresAnnualPaymentStep(pkg)) {
    if (auto) {
      return {
        platformPaymentStatus: "paid",
        platformAccessValidUntil: addYearsIso(1),
        platformPaymentMethod: method ?? undefined,
      };
    }
    return {
      platformPaymentStatus: "pending_verification",
      platformAccessValidUntil: null,
      platformPaymentMethod: method ?? undefined,
    };
  }

  return {
    platformPaymentStatus: "exempt",
    platformAccessValidUntil: addYearsIso(1),
  };
}
