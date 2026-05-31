import { NextRequest, NextResponse } from "next/server";
import { studyMapsAdminDb } from "@/lib/study-maps/admin";
import {
  canReadPlatformAcceptance,
  verifyPlatformContractRequestUser,
} from "@/lib/platform-subscription-contract/verify-request-user";

const ACCEPTANCES = "platform_subscription_acceptances";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await verifyPlatformContractRequestUser(req.headers.get("authorization"));
    const snap = await studyMapsAdminDb()
      .collection(ACCEPTANCES)
      .doc(params.id)
      .get();
    if (!snap.exists) {
      return NextResponse.json({ success: false, error: "Não encontrado." }, { status: 404 });
    }
    const data = snap.data() as { userId?: string };
    if (!canReadPlatformAcceptance(user, data.userId ?? "")) {
      return NextResponse.json({ success: false, error: "Sem permissão." }, { status: 403 });
    }
    return NextResponse.json({ success: true, acceptance: { id: snap.id, ...snap.data() } });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Erro" },
      { status: 401 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await verifyPlatformContractRequestUser(req.headers.get("authorization"));
    if (user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Somente administrador." }, { status: 403 });
    }
    await studyMapsAdminDb().collection(ACCEPTANCES).doc(params.id).delete();
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Erro" },
      { status: 401 },
    );
  }
}
