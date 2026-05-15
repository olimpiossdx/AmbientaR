import { NextRequest, NextResponse } from "next/server";
import { adminApiErrorResponse } from "@/lib/admin/admin-api-error";
import { verifyAdminBearer } from "@/lib/admin/verify-admin";
import { permanentlyDeleteUser } from "@/lib/admin/permanent-user-deletion";
import { adminAuth, adminDb, formatFirebaseAdminError } from "@/lib/firebase-admin";

/** Exclusão definitiva apenas por e-mail (Auth órfão ou perfil já removido). */
export async function POST(req: NextRequest) {
  try {
    await verifyAdminBearer(req.headers.get("authorization"));
    const body = (await req.json()) as { email?: string };
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Informe o e-mail." },
        { status: 400 },
      );
    }

    const result = await permanentlyDeleteUser(adminDb(), adminAuth(), {
      email,
    });

    return NextResponse.json({ success: true, result });
  } catch (e) {
    const { message, status, code } = adminApiErrorResponse(
      formatFirebaseAdminError(e),
    );
    return NextResponse.json(
      { success: false, error: message, code },
      { status },
    );
  }
}
