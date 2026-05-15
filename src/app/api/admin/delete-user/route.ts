import { NextRequest, NextResponse } from "next/server";
import { verifyAdminBearer } from "@/lib/admin/verify-admin";
import { permanentlyDeleteUser } from "@/lib/admin/permanent-user-deletion";
import { studyMapsAdminAuth, studyMapsAdminDb } from "@/lib/study-maps/admin";

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

    const result = await permanentlyDeleteUser(
      studyMapsAdminDb(),
      studyMapsAdminAuth(),
      { userId, email },
    );

    return NextResponse.json({ success: true, result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido.";
    const status =
      msg.includes("Token") || msg.includes("permissão") ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
