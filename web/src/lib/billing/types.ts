import type { ClientPackage, PlatformPaymentMethod } from "@/lib/types";

export type PlatformBillingProvider = "sicoob" | "mock";

export type PlatformPaymentRequestStatus =
  | "pending_verification"
  | "confirmed"
  | "rejected"
  | "expired";

/** Campos estendidos em platform_payment_requests (PIX dinâmico). */
export type PlatformPaymentRequestRecord = {
  userId: string;
  email: string;
  name: string;
  packageId: ClientPackage;
  method: PlatformPaymentMethod;
  amountLabel: string;
  amountBrl: number;
  status: PlatformPaymentRequestStatus;
  provider: PlatformBillingProvider;
  txid: string;
  qrExpiresAt?: string | null;
  pixCopiaECola?: string | null;
  sicoobStatus?: string | null;
  webhookLastEvent?: string | null;
  createdAt: unknown;
  resolvedAt?: unknown | null;
  resolvedBy?: "webhook" | "admin" | "cron" | "debug";
};

export type ConfirmPlatformPaymentInput = {
  userId: string;
  packageId: ClientPackage;
  txid: string;
  requestId?: string;
  method?: PlatformPaymentMethod;
  resolvedBy: "webhook" | "admin" | "debug";
  extendYears?: number;
};

export type SicoobImmediateChargeResult = {
  txid: string;
  amountBrl: number;
  pixCopiaECola: string;
  qrCodeBase64?: string;
  expiresAt: string;
  status: string;
  mock: boolean;
};
