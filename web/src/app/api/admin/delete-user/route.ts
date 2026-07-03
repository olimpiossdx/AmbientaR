import { NextRequest, NextResponse } from "next/server";
import { adminApiErrorResponse } from "@/lib/admin/admin-api-error";
import { verifyAdminBearer } from "@/lib/admin/verify-admin";
import { permanentlyDeleteUser } from "@/lib/admin/permanent-user-deletion";
import { adminAuth, adminDb, formatFirebaseAdminError } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    await verifyAdminBearer(req.headers.get("authorization"));
    const body = (await req.json()) as { userId?: string; email?: string };
    const userId =
      typeof body.userId === "string" ? body.userId.trim() : undefined;
    const email =
      typeof body.email === "string" ? body.email.trim() : undefined;

    if (!userId && !email) {
      return NextResponse.json(
        { success: false, error: "Informe userId ou email." },
        { status: 400 },
      );
    }

    const result = await permanentlyDeleteUser(adminDb(), adminAuth(), {
      userId,
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
