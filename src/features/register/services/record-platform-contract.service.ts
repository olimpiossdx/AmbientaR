import {
  clientPackageRequiresAnnualPaymentStep,
  isPlatformPaymentAutoApproveEnabled,
} from "@/lib/platform-access";
import type { RegisterFormValues } from "../schemas/register.schema";
import {
  normalizeDocument,
  isValidCpfOrCnpj,
} from "../schemas/register.schema";
import type { PlatformContractPublic } from "@/lib/types";
import type { RegisterPaymentState, RegisterProfileMode } from "../types/register.types";

export type RecordPlatformContractInput = {
  uid: string;
  values: RegisterFormValues;
  mode: RegisterProfileMode;
  payment: RegisterPaymentState;
  paymentAcknowledged: boolean;
  userCpfNormalized: string;
  titularDocument: string;
  getIdToken: () => Promise<string>;
  platformCompany?: PlatformContractPublic | null;
};

export async function recordPlatformContract(
  input: RecordPlatformContractInput,
): Promise<void> {
  const {
    uid,
    values,
    mode,
    payment,
    paymentAcknowledged,
    userCpfNormalized,
    titularDocument,
    getIdToken,
    platformCompany,
  } = input;

  if (mode === "representative" || mode === "consultor_representante") return;
  if (mode !== "cliente_autonomo" || !values.selectedPackage) return;

  try {
    const token = await getIdToken();
    const titularRole = mode === "cliente_autonomo" ? "cliente_autonomo" : "client";
    const payConfirmed =
      values.selectedPackage === "gratuito" ||
      values.selectedPackage === "sob_consulta" ||
      (clientPackageRequiresAnnualPaymentStep(values.selectedPackage) &&
        isPlatformPaymentAutoApproveEnabled()) ||
      paymentAcknowledged;

    await fetch("/api/platform-subscription-contract/record", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: uid,
        name: values.name,
        phone: values.phone,
        cpf:
          titularDocument.length === 11 ? titularDocument : userCpfNormalized,
        cnpjs: titularDocument.length === 14 ? [titularDocument] : undefined,
        role: titularRole,
        packageId: values.selectedPackage,
        paymentMethod: clientPackageRequiresAnnualPaymentStep(values.selectedPackage)
          ? payment.paymentMethod
          : null,
        billingMode: payment.billingMode,
        paymentConfirmed: payConfirmed,
        cardDisplay:
          payment.paymentMethod === "credit_card" ||
          payment.paymentMethod === "debit_card"
            ? {
                holderName: payment.cardHolder.trim() || values.name,
                last4: payment.cardLast4.replace(/\D/g, "").slice(-4),
                expiryMonth: payment.cardExpiryMonth,
                expiryYear: payment.cardExpiryYear,
                brand: payment.cardBrand.trim() || undefined,
              }
            : undefined,
        clientUserAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        platformCompanyName: platformCompany?.name,
        platformCompanyCnpj: platformCompany?.cnpj,
      }),
    });
  } catch (contractErr) {
    console.warn("[platform-subscription-contract] registro de aceite:", contractErr);
  }
}

export function resolveTitularDocument(
  values: RegisterFormValues,
  mode: RegisterProfileMode,
  userCpfNormalized: string,
): string {
  const titularFromField = normalizeDocument(values.cpfCnpjTitular);
  if (mode === "cliente_autonomo" && !isValidCpfOrCnpj(values.cpfCnpjTitular)) {
    return userCpfNormalized;
  }
  return titularFromField;
}
