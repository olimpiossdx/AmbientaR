import type { ApiResponse } from "../service/http/types";
import type { AuthClaim } from "../app/authorization/claim.types";

export type AuthUser = {
 id: number | string;
 nome: string;
 username: string;
 email?: string;
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
 claims: readonly AuthClaim[];
 accessTokenExpiresAt: number;
 refreshTokenExpiresAt: number;
};

export type PersistedAuthSnapshot = AuthSessionData & {
 requiresRelogin: boolean;
 lockedReason: AuthLockedReason;
 pendingLocation: string | null;
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
 claims: readonly AuthClaim[];
 accessTokenExpiresAt: number | null;
 refreshTokenExpiresAt: number | null;
 requiresRelogin: boolean;
 hasKnownUser: boolean;
 canUseApp: boolean;
 isRefreshing: boolean;
 isLocked: boolean;
 lockedReason: AuthLockedReason;
 pendingLocation: string | null;
 revision: number;
};

export type AuthSessionMetadata = {
 accessTokenExpiresAt?: number;
 refreshTokenExpiresAt?: number;
 user?: AuthUser;
 claims?: readonly AuthClaim[];
};

export type AuthApiResponse<TData = unknown> = ApiResponse<TData> & {
 metadata?: {
  session?: AuthSessionMetadata;
  [key: string]: unknown;
 };
};

type GroupedApiClaim = {
 type: string;
 values: readonly string[];
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

export function isAuthClaim(value: unknown): value is AuthClaim {
 if (!value || typeof value !== "object") {
  return false;
 }

 const claim = value as Partial<AuthClaim>;

 return (
  typeof claim.claimType === "string" &&
  claim.claimType.trim().length > 0 &&
  typeof claim.claimValue === "string" &&
  claim.claimValue.trim().length > 0
 );
}

function isGroupedApiClaim(value: unknown): value is GroupedApiClaim {
 if (!value || typeof value !== "object") {
  return false;
 }

 const claim = value as Partial<GroupedApiClaim>;
 return (
  typeof claim.type === "string" &&
  claim.type.trim().length > 0 &&
  Array.isArray(claim.values) &&
  claim.values.every((item) => typeof item === "string" && item.trim().length > 0)
 );
}

export function parseAuthClaims(value: unknown): readonly AuthClaim[] | null {
 if (!Array.isArray(value)) {
  return null;
 }

 const claims: AuthClaim[] = [];

 for (const item of value) {
  if (isAuthClaim(item)) {
   claims.push(item);
   continue;
  }

  if (isGroupedApiClaim(item)) {
   for (const claimValue of item.values) {
    claims.push({ claimType: item.type, claimValue });
   }
   continue;
  }

  return null;
 }

 return claims;
}

export function isAuthSessionData(value: unknown): value is AuthSessionData {
 if (!value || typeof value !== "object") {
  return false;
 }

 const session = value as Partial<AuthSessionData>;

 return (
  isAuthUser(session.user) &&
  Array.isArray(session.claims) &&
  session.claims.every(isAuthClaim) &&
  typeof session.accessTokenExpiresAt === "number" &&
  typeof session.refreshTokenExpiresAt === "number"
 );
}

export function parseAuthSessionData(value: unknown): AuthSessionData | null {
 if (!value || typeof value !== "object") {
  return null;
 }

 const session = value as Partial<AuthSessionData>;
 const claims = parseAuthClaims(session.claims);

 if (
  !isAuthUser(session.user) ||
  !claims ||
  typeof session.accessTokenExpiresAt !== "number" ||
  typeof session.refreshTokenExpiresAt !== "number"
 ) {
  return null;
 }

 return {
  user: session.user,
  claims,
  accessTokenExpiresAt: session.accessTokenExpiresAt,
  refreshTokenExpiresAt: session.refreshTokenExpiresAt,
 };
}

export function extractAuthSessionData(response: ApiResponse<unknown>): AuthSessionData | null {
 const responseSession = parseAuthSessionData(response.data);
 if (responseSession) {
  return responseSession;
 }

 const metadata = (response as AuthApiResponse).metadata;
 const session = metadata?.session;

 if (!session) {
  return null;
 }

 const currentData = parseAuthSessionData(response.data);
 const user = session.user ?? currentData?.user;
 const claims = parseAuthClaims(session.claims ?? currentData?.claims);

 if (
  isAuthUser(user) &&
  claims &&
  typeof session.accessTokenExpiresAt === "number" &&
  typeof session.refreshTokenExpiresAt === "number"
 ) {
  return {
   user,
   claims,
   accessTokenExpiresAt: session.accessTokenExpiresAt,
   refreshTokenExpiresAt: session.refreshTokenExpiresAt,
  };
 }

 return null;
}
