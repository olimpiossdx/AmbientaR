import { NextResponse } from "next/server";
import { verifyBearerUid } from "@/lib/study-maps/verify-user";
import { sendPushToPortalUsers } from "@/lib/notification-push-server";

export async function POST(req: Request) {
  try {
    await verifyBearerUid(req.headers.get("authorization"));
    const body = (await req.json()) as {
      userIds?: string[];
      title?: string;
      description?: string;
      link?: string;
      sourceType?: string;
      sourceId?: string;
    };

    const userIds = Array.isArray(body.userIds) ? body.userIds : [];
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";

    if (!title || userIds.length === 0) {
      return NextResponse.json(
        { error: "title e userIds são obrigatórios" },
        { status: 400 },
      );
    }

    const result = await sendPushToPortalUsers(userIds, {
      title,
      body: description || title,
      link: typeof body.link === "string" ? body.link : undefined,
      sourceType: typeof body.sourceType === "string" ? body.sourceType : undefined,
      sourceId: typeof body.sourceId === "string" ? body.sourceId : undefined,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Não autorizado";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
