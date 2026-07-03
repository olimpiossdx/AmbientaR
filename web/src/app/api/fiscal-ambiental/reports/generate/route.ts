import { NextResponse } from "next/server";
import { generateSmartReport } from "@/lib/fiscal-ambiental/report-service";
import type { FadReportType } from "@/lib/fiscal-ambiental/types";
import { requireFadWorkspaceRead } from "@/lib/fiscal-ambiental/fad-workspace-access";
import { handleFadApiError, requireFadApiAuth } from "../../_fad-api-guard";

const VALID_TYPES: FadReportType[] = ["acervo", "mudancas", "fiscalizacao", "consolidado"];

export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const user = await requireFadApiAuth(req);
    const body = (await req.json()) as { workspaceId?: string; type?: string };

    const workspaceId = body.workspaceId?.trim();
    const type = body.type?.trim() as FadReportType;

    if (!workspaceId || !type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVALID_BODY",
            message: "workspaceId e type (acervo|mudancas|fiscalizacao|consolidado) são obrigatórios.",
          },
        },
        { status: 400 },
      );
    }

    await requireFadWorkspaceRead(workspaceId, user.uid, user.role === "admin");

    const report = await generateSmartReport({
      workspaceId,
      ownerId: user.uid,
      type,
    });

    return NextResponse.json({ ok: true, data: report }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && "status" in err) {
      const status = (err as Error & { status: number }).status;
      return NextResponse.json(
        { ok: false, error: { code: "ERROR", message: err.message } },
        { status },
      );
    }
    const message = err instanceof Error ? err.message : "Falha ao gerar relatório.";
    return NextResponse.json(
      { ok: false, error: { code: "REPORT_FAILED", message } },
      { status: 502 },
    );
  }
}
