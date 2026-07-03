import { NextRequest, NextResponse } from "next/server";
import { adminApiErrorResponse } from "@/lib/admin/admin-api-error";
import { verifyAdminBearer } from "@/lib/admin/verify-admin";
import { formatFirebaseAdminError, hasFirebaseAdminCredentials } from "@/lib/firebase-admin";

/** Indica se o servidor tem credenciais explícitas do Firebase Admin (dev local). */
export async function GET(req: NextRequest) {
  try {
    await verifyAdminBearer(req.headers.get("authorization"));
    return NextResponse.json({ configured: hasFirebaseAdminCredentials() });
  } catch (e) {
    const { message, status, code } = adminApiErrorResponse(
      formatFirebaseAdminError(e),
    );
    return NextResponse.json(
      { configured: false, error: message, code },
      { status },
    );
  }
}
