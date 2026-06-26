import { NextResponse } from "next/server";
import { verifyIdTokenAndLoadUser } from "@/lib/package-enforcement-server";
import {
  authorizePortalNotification,
  createNotificationForUserAdmin,
  ensureUnreadNotificationAdmin,
} from "@/lib/notifications-server";
import { sendPushToPortalUsers } from "@/lib/notification-push-server";

type CreateBody = {
  targetUserId?: string;
  title?: string;
  description?: string;
  link?: string;
  sourceType?: string;
  sourceId?: string;
  actorRole?: string;
  ensureUnread?: boolean;
};

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const idToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : null;
    const caller = await verifyIdTokenAndLoadUser(idToken);
    const callerUid = caller.uid || caller.id;

    const body = (await req.json()) as CreateBody;
    const targetUserId =
      typeof body.targetUserId === "string" ? body.targetUserId.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const sourceType =
      typeof body.sourceType === "string" ? body.sourceType.trim() : "";
    const sourceId =
      typeof body.sourceId === "string" ? body.sourceId.trim() : "";

    if (!targetUserId || !title || !sourceType || !sourceId) {
      return NextResponse.json(
        { error: "targetUserId, title, sourceType e sourceId são obrigatórios." },
        { status: 400 },
      );
    }

    await authorizePortalNotification({
      callerUid,
      callerEmail: caller.email,
      targetUserId,
      sourceType,
      sourceId,
    });

    const payload = {
      title,
      description: description || title,
      link: typeof body.link === "string" ? body.link : undefined,
      sourceType,
      sourceId,
      actorRole: typeof body.actorRole === "string" ? body.actorRole : undefined,
    };

    const created = body.ensureUnread
      ? await ensureUnreadNotificationAdmin(targetUserId, payload)
      : (await createNotificationForUserAdmin(targetUserId, payload), true);

    if (created) {
      void sendPushToPortalUsers([targetUserId], {
        title: payload.title,
        body: payload.description,
        link: payload.link,
        sourceType: payload.sourceType,
        sourceId: payload.sourceId,
      });
    }

    return NextResponse.json({ ok: true, created });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Não autorizado";
    const status =
      message.includes("Não autorizado") ||
      message.includes("inválido") ||
      message.includes("não encontrado")
        ? 403
        : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
