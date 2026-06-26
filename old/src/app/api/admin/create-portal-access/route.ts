import { NextRequest, NextResponse } from "next/server";
import { adminApiErrorResponse } from "@/lib/admin/admin-api-error";
import { verifyAdminBearer } from "@/lib/admin/verify-admin";
import { createPortalAccessForClientGestao } from "@/lib/admin/create-portal-access";
import { adminAuth, adminDb, formatFirebaseAdminError } from "@/lib/firebase-admin";
import type { ClientPackage } from "@/lib/types";

const VALID_PACKAGES: ClientPackage[] = [
  "gratuito",
  "basico",
  "intermediario",
  "avancado",
  "completo",
  "sob_consulta",
];

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminBearer(req.headers.get("authorization"));
    const body = (await req.json()) as {
      clientId?: string;
      email?: string;
      name?: string;
      userCpf?: string;
      package?: string;
    };

    const clientId =
      typeof body.clientId === "string" ? body.clientId.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const userCpf =
      typeof body.userCpf === "string" ? body.userCpf.trim() : undefined;
    const pkg =
      typeof body.package === "string" &&
      VALID_PACKAGES.includes(body.package as ClientPackage)
        ? (body.package as ClientPackage)
        : undefined;

    if (!clientId || !email || !name) {
      return NextResponse.json(
        {
          success: false,
          error: "Informe clientId, e-mail e nome do responsável.",
        },
        { status: 400 },
      );
    }

    const result = await createPortalAccessForClientGestao(
      adminDb(),
      adminAuth(),
      {
        clientId,
        email,
        name,
        userCpf,
        package: pkg,
        invitedByUid: admin.uid,
      },
    );

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
