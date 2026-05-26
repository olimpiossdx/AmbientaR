import { NextRequest, NextResponse } from "next/server";
import {
  adminApiErrorNextResponse,
  requireAuthenticatedApi,
} from "@/lib/api-auth";
import { assertGraphReadyForAutofill } from "@/lib/onedrive/api-guard";
import { buildOnedriveAutofillContext } from "@/lib/onedrive/autofill-context.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEAM_ROLES = new Set([
  "admin",
  "technical",
  "gestor",
  "supervisor",
  "financial",
]);

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthenticatedApi(request);
    if (!TEAM_ROLES.has(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Sem permissão para autofill via OneDrive.",
        },
        { status: 403 },
      );
    }

    const guard = assertGraphReadyForAutofill();
    if (!guard.ok) return guard.response;

    const body = (await request.json().catch(() => ({}))) as {
      cpfCnpj?: string;
    };
    const cpfCnpj = (body.cpfCnpj || "").trim();
    if (!cpfCnpj) {
      return NextResponse.json(
        { success: false, error: "cpfCnpj é obrigatório." },
        { status: 400 },
      );
    }

    const context = await buildOnedriveAutofillContext(cpfCnpj);

    return NextResponse.json({
      success: true,
      ...context,
    });
  } catch (err) {
    return adminApiErrorNextResponse(err);
  }
}
