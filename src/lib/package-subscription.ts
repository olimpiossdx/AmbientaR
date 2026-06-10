import type { AppUser, ClientPackage } from "@/lib/types";
import { isClientePortalRole } from "@/lib/role-guards";
import { CLIENT_PACKAGES_WITH_ANNUAL_PAYMENT } from "@/lib/package-constants";

export { CLIENT_PACKAGES_WITH_ANNUAL_PAYMENT };

/** Pacote gravado no perfil (contratado / histórico). */
export function resolveStoredPackage(
  user: Pick<AppUser, "package" | "role">,
): ClientPackage {
  if (user.package) return user.package;
  if (user.role === "cliente_autonomo") return "gratuito";
  return "gratuito";
}

/** Plano pago anual com cobrança (não gratuito nem sob consulta). */
export function isPaidPortalPackage(pkg: ClientPackage): boolean {
  return CLIENT_PACKAGES_WITH_ANNUAL_PAYMENT.includes(pkg);
}

/** Assinatura anual paga ainda válida. */
export function isPaidSubscriptionActive(
  user: Pick<
    AppUser,
    "package" | "role" | "platformPaymentStatus" | "platformAccessValidUntil"
  >,
): boolean {
  const stored = resolveStoredPackage(user);
  if (!isPaidPortalPackage(stored)) return false;

  const st = user.platformPaymentStatus;
  if (st !== "paid") return false;

  const until = user.platformAccessValidUntil;
  if (!until) return true;
  return new Date(until).getTime() >= Date.now();
}

/**
 * Assinatura paga vencida ou marcada como expirada — aplica limites do gratuito
 * e reativa publicidade, sem bloquear o acesso total.
 */
export function isSubscriptionLapsed(
  user: Pick<
    AppUser,
    "package" | "role" | "platformPaymentStatus" | "platformAccessValidUntil"
  >,
): boolean {
  if (!isClientePortalRole(user.role)) return false;

  const stored = resolveStoredPackage(user);
  if (!isPaidPortalPackage(stored)) return false;

  const st = user.platformPaymentStatus;
  const until = user.platformAccessValidUntil;

  if (st === "expired") return true;
  if (st === "paid" && until && new Date(until).getTime() < Date.now()) {
    return true;
  }
  return false;
}

/** Pagamento enviado e aguardando confirmação manual. */
export function isSubscriptionPendingVerification(
  user: Pick<AppUser, "role" | "platformPaymentStatus">,
): boolean {
  if (!isClientePortalRole(user.role)) return false;
  return user.platformPaymentStatus === "pending_verification";
}

/** Plano usado para limites técnicos e exibição de anúncios. */
export function resolveEffectivePackage(
  user: Pick<
    AppUser,
    "package" | "role" | "platformPaymentStatus" | "platformAccessValidUntil"
  >,
): ClientPackage {
  const stored = resolveStoredPackage(user);

  if (isSubscriptionLapsed(user)) {
    return "gratuito";
  }

  return stored;
}

/** Exibir publicidade de terceiros (Google AdSense) neste perfil. */
export function shouldShowThirdPartyAdvertising(
  user: Pick<
    AppUser,
    "package" | "role" | "platformPaymentStatus" | "platformAccessValidUntil"
  > | null | undefined,
): boolean {
  if (!user || !isClientePortalRole(user.role)) return false;
  if (isSubscriptionPendingVerification(user)) return false;

  const effective = resolveEffectivePackage(user);
  return effective === "gratuito";
}
