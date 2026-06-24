import { NextRequest, NextResponse } from "next/server";
import { adminApiErrorResponse } from "@/lib/admin/admin-api-error";
import { verifyAdminBearer } from "@/lib/admin/verify-admin";
import { repairUserAuth } from "@/lib/admin/create-internal-user";
import { adminAuth, adminDb, formatFirebaseAdminError } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const actor = await verifyAdminBearer(req.headers.get("authorization"));
    const body = (await req.json()) as {
      email?: string;
      password?: string;
    };

    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Informe e-mail e senha para reparar o login.",
        },
        { status: 400 },
      );
    }

    const result = await repairUserAuth(adminDb(), adminAuth(), {
      email,
      password,
      actorRole: actor.role,
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
