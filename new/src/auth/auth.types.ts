import type { ApiResponse } from "../service/http/types";

export type AuthUser = {
 id: number | string;
 nome: string;
 username: string;
 email?: string;
 role?: string;
};

export type LoginModel = {
 username: string;
 password: string;
};

export type ReloginModel = {
 password: string;
};

export type PasswordResetModel = {
 email: string;
};

export type RegisterMode =
 | "cliente_autonomo"
 | "representative"
 | "consultor_representante";

export type RegisterPaymentMethod = "pix" | "credit_card" | "debit_card";

export type RegisterModel = {
 mode: RegisterMode;
 name: string;
 email: string;
 phone: string;
 cpf?: string;
 cpfCnpjTitular?: string;
 password: string;
 selectedPackage?: string;
 contractAccepted: boolean;
 marketingContactConsent?: boolean;
 payment?: {
  method: RegisterPaymentMethod;
  billingMode?: "annual_upfront" | "monthly_12x";
  acknowledged: boolean;
  cardDisplay?: {
   holderName: string;
   last4: string;
   expiryMonth: string;
   expiryYear: string;
   brand?: string;
  };
 };
};

export type RegisterResult = {
 session?: AuthSessionData;
 payment?: {
  txid: string;
  amountBrl: number;
  pixCopiaECola: string;
  expiresAt?: string | null;
  mock?: boolean;
  packageLabel?: string;
 };
 status?: "active" | "payment_pending" | "access_pending";
};

export type RegisterDocumentPreviewModel = {
 mode: "cliente_autonomo";
 document: string;
};

export type RegisterDocumentPreview = {
 cnpjLookupStatus: "not_applicable" | "success" | "failed" | "not_found";
 linkedClientId?: string | null;
 linkedEmpreendedorId?: string | null;
 suggestedFields?: {
  name?: string;
  email?: string;
  phone?: string;
 };
 message?: string;
};

export type AuthSessionData = {
 user: AuthUser;
 accessTokenExpiresAt: number;
 refreshTokenExpiresAt: number;
};

export type AuthStatus =
 | "unknown"
 | "authenticated"
 | "refreshing"
 | "locked"
 | "anonymous";

export type AuthLockedReason =
 | "access-expired"
 | "request-unauthorized"
 | "route-expired"
 | "session-unavailable"
 | "manual"
 | null;

export type AuthSnapshot = {
 status: AuthStatus;
 user: AuthUser | null;
 accessTokenExpiresAt: number | null;
 refreshTokenExpiresAt: number | null;
 hasKnownUser: boolean;
 canUseApp: boolean;
 isRefreshing: boolean;
 isLocked: boolean;
 lockedReason: AuthLockedReason;
 pendingLocation: string | null;
};

export type AuthSessionMetadata = {
 accessTokenExpiresAt?: number;
 refreshTokenExpiresAt?: number;
 user?: AuthUser;
};

export type AuthApiResponse<TData = unknown> = ApiResponse<TData> & {
 metadata?: {
  session?: AuthSessionMetadata;
  [key: string]: unknown;
 };
};

export function isAuthUser(value: unknown): value is AuthUser {
 if (!value || typeof value !== "object") {
  return false;
 }

 const user = value as Partial<AuthUser>;

 return (
  (typeof user.id === "number" || typeof user.id === "string") &&
  typeof user.nome === "string" &&
  typeof user.username === "string"
 );
}

export function isAuthSessionData(value: unknown): value is AuthSessionData {
 if (!value || typeof value !== "object") {
  return false;
 }

 const session = value as Partial<AuthSessionData>;

 return (
  isAuthUser(session.user) &&
  typeof session.accessTokenExpiresAt === "number" &&
  typeof session.refreshTokenExpiresAt === "number"
 );
}

export function extractAuthSessionData(response: ApiResponse<unknown>): AuthSessionData | null {
 if (isAuthSessionData(response.data)) {
  return response.data;
 }

 const metadata = (response as AuthApiResponse).metadata;
 const session = metadata?.session;

 if (!session) {
  return null;
 }

 const currentData = response.data;
 const user = session.user ?? (isAuthSessionData(currentData) ? currentData.user : undefined);

 if (
  isAuthUser(user) &&
  typeof session.accessTokenExpiresAt === "number" &&
  typeof session.refreshTokenExpiresAt === "number"
 ) {
  return {
   user,
   accessTokenExpiresAt: session.accessTokenExpiresAt,
   refreshTokenExpiresAt: session.refreshTokenExpiresAt,
  };
 }

 return null;
}
