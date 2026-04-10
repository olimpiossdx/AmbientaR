import type { AppUser, ClientPackage, PlatformPaymentMethod } from "@/lib/types";
import { isClientePortalRole } from "@/lib/role-guards";

/** Planos com cobrança anual única no cadastro (etapa Pagamento). */
export const CLIENT_PACKAGES_WITH_ANNUAL_PAYMENT: ClientPackage[] = [
  "basico",
  "intermediario",
  "avancado",
  "completo",
];

/** Texto de referência do valor anual (ajustar conforme tabela comercial). */
export const PACKAGE_ANNUAL_AMOUNT_LABEL: Partial<Record<ClientPackage, string>> = {
  basico: "R$ 598,80 / ano",
  intermediario: "R$ 1.198,80 / ano",
  avancado: "R$ 2.398,80 / ano",
  completo: "R$ 4.198,80 / ano",
  gratuito: "R$ 0",
  sob_consulta: "Sob consulta",
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
