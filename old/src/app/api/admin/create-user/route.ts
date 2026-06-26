import { NextRequest, NextResponse } from "next/server";
import { adminApiErrorResponse } from "@/lib/admin/admin-api-error";
import { verifyAdminOrSupervisorBearer } from "@/lib/admin/verify-admin";
import { createInternalUser } from "@/lib/admin/create-internal-user";
import { adminAuth, adminDb, formatFirebaseAdminError } from "@/lib/firebase-admin";
import type { UserRole } from "@/lib/types";

const VALID_ROLES: UserRole[] = [
  "admin",
  "client",
  "cliente_autonomo",
  "representative",
  "consultor_representante",
  "technical",
  "sales",
  "financial",
  "gestor",
  "supervisor",
  "diretor_fauna",
  "advogado",
];

const VALID_STATUSES = ["active", "inactive", "pending_invite"] as const;

export async function POST(req: NextRequest) {
  try {
    const actor = await verifyAdminOrSupervisorBearer(
      req.headers.get("authorization"),
    );
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      name?: string;
      role?: string;
      status?: string;
      userCpf?: string;
      cpf?: string;
      cnpjs?: string[];
      titularDocument?: string;
      titularType?: string;
      photoURL?: string;
      dataNascimento?: string;
    };

    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const role =
      typeof body.role === "string" &&
      VALID_ROLES.includes(body.role as UserRole)
        ? (body.role as UserRole)
        : null;
    const status =
      typeof body.status === "string" &&
      (VALID_STATUSES as readonly string[]).includes(body.status)
        ? (body.status as (typeof VALID_STATUSES)[number])
        : "active";

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        {
          success: false,
          error: "Informe e-mail, senha, nome e perfil do usuário.",
        },
        { status: 400 },
      );
    }

    const result = await createInternalUser(adminDb(), adminAuth(), {
      email,
      password,
      name,
      role,
      status,
      userCpf: body.userCpf,
      cpf: body.cpf,
      cnpjs: Array.isArray(body.cnpjs) ? body.cnpjs : undefined,
      titularDocument: body.titularDocument,
      titularType: body.titularType,
      photoURL: body.photoURL,
      dataNascimento: body.dataNascimento,
      createdByUid: actor.uid,
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
