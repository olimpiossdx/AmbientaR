import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdminApiAuth } from "@/lib/api-auth";
import {
  markPlatformPaymentConfirmed,
  rejectPlatformPaymentRequest,
} from "@/lib/billing/sync-platform-access";
import { adminDb } from "@/lib/firebase-admin";
import type { ClientPackage } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    await requireAdminApiAuth(req);
    const status = req.nextUrl.searchParams.get("status") ?? "pending_verification";
    const snap = await adminDb()
      .collection("platform_payment_requests")
      .where("status", "==", status)
      .limit(50)
      .get();

    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ ok: true, count: items.length, items });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Erro." },
      { status: 401 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminApiAuth(req);
    const body = (await req.json()) as {
      requestId: string;
      action: "confirm" | "reject";
      packageId?: ClientPackage;
    };

    if (!body.requestId || !body.action) {
      return NextResponse.json({ ok: false, error: "requestId e action obrigatórios." }, { status: 400 });
    }

    const ref = adminDb().collection("platform_payment_requests").doc(body.requestId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ ok: false, error: "Pedido não encontrado." }, { status: 404 });
    }
    const data = snap.data()!;

    if (body.action === "reject") {
      await rejectPlatformPaymentRequest(body.requestId, admin.uid);
      return NextResponse.json({ ok: true, action: "rejected" });
    }

    const result = await markPlatformPaymentConfirmed({
      userId: data.userId as string,
      packageId: (body.packageId ?? data.packageId) as ClientPackage,
      txid: (data.txid as string) ?? `manual-${body.requestId}`,
      requestId: body.requestId,
      method: (data.method as "pix") ?? "pix",
      resolvedBy: "admin",
    });

    return NextResponse.json({ ok: true, action: "confirmed", ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Erro." },
      { status: 500 },
    );
  }
}
