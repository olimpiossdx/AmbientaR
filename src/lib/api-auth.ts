import type { NextRequest } from "next/server";
import { verifyAdminBearer, type VerifiedAdmin } from "@/lib/admin/verify-admin";
import { adminApiErrorResponse } from "@/lib/admin/admin-api-error";

/** Exige Bearer token Firebase válido com role admin (API routes AI Lab, etc.). */
export async function requireAdminApiAuth(
  request: NextRequest,
): Promise<VerifiedAdmin> {
  return verifyAdminBearer(request.headers.get("authorization"));
}

export { adminApiErrorResponse };
