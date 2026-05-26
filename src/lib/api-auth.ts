import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminBearer, type VerifiedAdmin } from "@/lib/admin/verify-admin";
import { verifyIdTokenAndLoadUser } from "@/lib/package-enforcement-server";
import type { AppUser } from "@/lib/types";

/** Exige Bearer token Firebase válido com role admin (API routes AI Lab, etc.). */
export async function requireAdminApiAuth(
  request: NextRequest,
): Promise<VerifiedAdmin> {
  return verifyAdminBearer(request.headers.get("authorization"));
}

export function getBearerToken(request: NextRequest | Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  return token || null;
}

/** Exige utilizador autenticado com perfil em Firestore (`users/{uid}`). */
export async function requireAuthenticatedApi(
  request: NextRequest | Request,
): Promise<AppUser> {
  return verifyIdTokenAndLoadUser(getBearerToken(request));
}

export function apiUnauthorizedResponse(
  message = "Sessão inválida. Faça login novamente.",
) {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function apiAuthErrorResponse(err: unknown) {
  const message =
    err instanceof Error ? err.message : "Falha de autenticação.";
  return NextResponse.json({ error: message }, { status: 401 });
}

export { adminApiErrorResponse, adminApiErrorNextResponse } from "@/lib/admin/admin-api-error";
