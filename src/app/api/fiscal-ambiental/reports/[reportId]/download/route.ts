import { NextResponse } from "next/server";
import { attachReportDownloadUrl, getSmartReport } from "@/lib/fiscal-ambiental/report-service";
import { requireFadWorkspaceRead } from "@/lib/fiscal-ambiental/fad-workspace-access";
import { handleFadApiError, requireFadApiAuth } from "../../../_fad-api-guard";

type RouteContext = { params: Promise<{ reportId: string }> };

export async function GET(req: Request, context: RouteContext) {
  try {
    const user = await requireFadApiAuth(req);
    const { reportId } = await context.params;
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId")?.trim();
    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_QUERY", message: "workspaceId obrigatório." } },
        { status: 400 },
      );
    }

    await requireFadWorkspaceRead(workspaceId, user.uid, user.role === "admin");

    const report = await getSmartReport(workspaceId, reportId);
    if (!report || report.status !== "ready") {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Relatório não encontrado ou indisponível." } },
        { status: 404 },
      );
    }

    const withUrl = await attachReportDownloadUrl(report);
    if (!withUrl.downloadUrl) {
      return NextResponse.json(
        { ok: false, error: { code: "NO_PDF", message: "PDF não disponível." } },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      data: { downloadUrl: withUrl.downloadUrl, report: withUrl },
    });
  } catch (err) {
    if (err instanceof Error && "status" in err) {
      const status = (err as Error & { status: number }).status;
      return NextResponse.json(
        { ok: false, error: { code: "ERROR", message: err.message } },
        { status },
      );
    }
    return handleFadApiError(err);
  }
}
