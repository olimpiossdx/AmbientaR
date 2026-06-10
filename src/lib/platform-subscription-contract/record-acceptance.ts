import { FieldValue } from "firebase-admin/firestore";
import { studyMapsAdminDb } from "@/lib/study-maps/admin";
import { PACKAGE_ANNUAL_PRICE_BRL } from "@/lib/package-pricing";
import { addYearsIso } from "@/lib/platform-access";
import { buildPlatformSubscriptionContractHtml } from "./build-contract-html";
import type {
  PlatformSubscriptionAcceptanceRecord,
  PlatformSubscriptionLedgerRecord,
  RecordPlatformSubscriptionAcceptanceInput,
} from "./types";

const ACCEPTANCES = "platform_subscription_acceptances";
const LEDGER = "platform_subscription_ledger";

function primaryDoc(cpf?: string, cnpjs?: string[]): string {
  if (cnpjs?.length) return cnpjs[0]!;
  return cpf ?? "";
}

export async function recordPlatformSubscriptionAcceptance(
  input: RecordPlatformSubscriptionAcceptanceInput,
): Promise<{
  acceptance: PlatformSubscriptionAcceptanceRecord;
  ledger: PlatformSubscriptionLedgerRecord;
}> {
  const { html, version, recordKind } = buildPlatformSubscriptionContractHtml(input);
  const signedAt = new Date().toISOString();
  const isPaid = recordKind === "paid_subscription";
  const annual = isPaid ? PACKAGE_ANNUAL_PRICE_BRL[input.packageId] : undefined;
  const billingMode = input.billingMode ?? "annual_upfront";
  const installmentCount = billingMode === "monthly_12x" ? 12 : 1;
  const installmentAmountBrl =
    annual && billingMode === "monthly_12x" ? annual / 12 : annual;

  const accessValidUntil = addYearsIso(1);
  const paymentConfirmedAt = input.paymentConfirmed ? signedAt : null;
  const accessValidFrom = paymentConfirmedAt ?? null;

  const acceptanceRef = studyMapsAdminDb().collection(ACCEPTANCES).doc();
  const ledgerRef = studyMapsAdminDb().collection(LEDGER).doc();

  const acceptance: PlatformSubscriptionAcceptanceRecord = {
    id: acceptanceRef.id,
    userId: input.userId,
    userEmail: input.userEmail,
    packageId: input.packageId,
    recordKind,
    status: "Aprovado",
    billingMode: isPaid ? billingMode : undefined,
    paymentMethod: input.paymentMethod ?? undefined,
    annualAmountBrl: annual,
    installmentAmountBrl,
    installmentCount: isPaid ? installmentCount : undefined,
    signedAt,
    accessValidFrom,
    accessValidUntil,
    paymentConfirmedAt,
    contratante: {
      name: input.name,
      email: input.userEmail,
      phone: input.phone,
      cpf: input.cpf,
      cnpjs: input.cnpjs,
      role: input.role,
    },
    paymentDisplay: isPaid
      ? {
          methodLabel:
            input.paymentMethod === "pix"
              ? "PIX"
              : input.paymentMethod === "credit_card"
                ? "Cartão de crédito"
                : input.paymentMethod === "debit_card"
                  ? "Cartão de débito"
                  : "—",
          billingModeLabel:
            billingMode === "monthly_12x" ? "12× mensal sem juros" : "À vista",
          annualAmountLabel: annual
            ? `R$ ${annual.toFixed(2).replace(".", ",")}`
            : undefined,
          installmentLabel:
            billingMode === "monthly_12x" && installmentAmountBrl
              ? `12 × R$ ${installmentAmountBrl.toFixed(2).replace(".", ",")}`
              : undefined,
          card: input.cardDisplay,
          note: "CVV não armazenado.",
        }
      : undefined,
    clientContext: input.clientContext,
    contractHtml: html,
    contractVersion: version,
    ledgerId: ledgerRef.id,
    createdAt: signedAt,
  };

  const ledger: PlatformSubscriptionLedgerRecord = {
    id: ledgerRef.id,
    acceptanceId: acceptanceRef.id,
    userId: input.userId,
    status: "Aprovado",
    packageId: input.packageId,
    contratanteNome: input.name,
    contratanteCpfCnpj: primaryDoc(input.cpf, input.cnpjs),
    contratanteEmail: input.userEmail,
    annualAmountBrl: annual,
    billingMode: isPaid ? billingMode : undefined,
    installmentCount: isPaid ? installmentCount : undefined,
    installmentAmountBrl,
    paymentMethod: input.paymentMethod ?? undefined,
    signedAt,
    contractHtml: html,
    createdAt: signedAt,
  };

  const batch = studyMapsAdminDb().batch();
  batch.set(acceptanceRef, {
    ...acceptance,
    createdAt: FieldValue.serverTimestamp(),
  });
  batch.set(ledgerRef, {
    ...ledger,
    createdAt: FieldValue.serverTimestamp(),
  });
  batch.update(studyMapsAdminDb().collection("users").doc(input.userId), {
    platformSubscriptionAcceptanceId: acceptanceRef.id,
    platformSubscriptionLedgerId: ledgerRef.id,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();

  return { acceptance, ledger };
}
