import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { verifyBearerUid } from "@/lib/study-maps/verify-user";

export async function POST(req: Request) {
  try {
    const { uid } = await verifyBearerUid(req.headers.get("authorization"));
    const body = (await req.json()) as { token?: string };
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!token) {
      return NextResponse.json({ error: "token obrigatório" }, { status: 400 });
    }

    const db = adminDb();
    await db
      .collection("users")
      .doc(uid)
      .set(
        {
          fcmTokens: FieldValue.arrayUnion(token),
          fcmTokensUpdatedAt: new Date().toISOString(),
        },
        { merge: true },
      );

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Não autorizado";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
