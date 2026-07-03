import type { ClientPackage, PlatformPaymentMethod } from "@/lib/types";

/** Forma de quitação do valor anual (sem juros no parcelado). */
export type PlatformSubscriptionBillingMode = "annual_upfront" | "monthly_12x";

export type PlatformSubscriptionCardDisplay = {
  holderName?: string;
  brand?: string;
  last4?: string;
  expiryMonth?: string;
  expiryYear?: string;
};

export type PlatformSubscriptionClientContext = {
  ipAddress?: string;
  userAgent?: string;
  deviceLabel?: string;
  browserLabel?: string;
  osLabel?: string;
};

export type PlatformSubscriptionAcceptanceRecord = {
  id: string;
  userId: string;
  userEmail: string;
  packageId: ClientPackage;
  /** Plano pago com cláusulas de vigência/parcelas; gratuito mantém regras atuais. */
  recordKind: "paid_subscription" | "gratuito_legacy";
  status: "Aprovado";
  billingMode?: PlatformSubscriptionBillingMode;
  paymentMethod?: PlatformPaymentMethod;
  annualAmountBrl?: number;
  installmentAmountBrl?: number;
  installmentCount?: number;
  /** Vigência: assinatura; acesso após confirmação de pagamento (registrado em verifiedAt). */
  signedAt: string;
  accessValidFrom?: string | null;
  accessValidUntil?: string | null;
  paymentConfirmedAt?: string | null;
  contratante: {
    name: string;
    email: string;
    phone?: string;
    cpf?: string;
    cnpjs?: string[];
    role: string;
  };
  paymentDisplay?: {
    methodLabel: string;
    billingModeLabel?: string;
    annualAmountLabel?: string;
    installmentLabel?: string;
    card?: PlatformSubscriptionCardDisplay;
    note?: string;
  };
  clientContext?: PlatformSubscriptionClientContext;
  contractHtml: string;
  contractVersion: string;
  ledgerId?: string;
  createdAt: string;
};

export type PlatformSubscriptionLedgerRecord = {
  id: string;
  acceptanceId: string;
  userId: string;
  status: "Aprovado";
  packageId: ClientPackage;
  contratanteNome: string;
  contratanteCpfCnpj: string;
  contratanteEmail: string;
  annualAmountBrl?: number;
  billingMode?: PlatformSubscriptionBillingMode;
  installmentCount?: number;
  installmentAmountBrl?: number;
  paymentMethod?: PlatformPaymentMethod;
  signedAt: string;
  contractHtml: string;
  createdAt: string;
};

export type RecordPlatformSubscriptionAcceptanceInput = {
  userId: string;
  userEmail: string;
  name: string;
  phone?: string;
  cpf?: string;
  cnpjs?: string[];
  role: string;
  packageId: ClientPackage;
  paymentMethod?: PlatformPaymentMethod | null;
  billingMode?: PlatformSubscriptionBillingMode;
  paymentConfirmed: boolean;
  allowsCommercialContact?: boolean;
  marketingContactConsent?: boolean;
  cardDisplay?: PlatformSubscriptionCardDisplay;
  clientContext?: PlatformSubscriptionClientContext;
  platformCompanyName?: string;
  platformCompanyCnpj?: string;
};
