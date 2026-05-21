import { NextResponse } from "next/server";
import { checkPackageLimitForToken } from "@/lib/package-enforcement-server";
import type { PortalModuleCollection } from "@/lib/package-limits";

type Body = {
  action?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const action = body.action;
    if (!action) {
      return NextResponse.json(
        { ok: false, message: "Ação inválida." },
        { status: 400 },
      );
    }

    const authHeader = req.headers.get("authorization");
    const idToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

    const result = await checkPackageLimitForToken(
      idToken,
      action as
        | "create_empreendimento"
        | "ambbot"
        | `create_module:${PortalModuleCollection}`,
    );

    if (result.ok) {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({
      ok: false,
      message: result.message,
      code: result.code,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Falha na validação do plano.",
      },
      { status: 401 },
    );
  }
}
