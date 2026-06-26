import { NextResponse } from "next/server";
import { attachReportDownloadUrl, listSmartReports } from "@/lib/fiscal-ambiental/report-service";
import { requireFadWorkspaceRead } from "@/lib/fiscal-ambiental/fad-workspace-access";
import { handleFadApiError, requireFadApiAuth } from "../_fad-api-guard";

export async function GET(req: Request) {
  try {
    const user = await requireFadApiAuth(req);
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId")?.trim();
    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_QUERY", message: "workspaceId obrigatório." } },
        { status: 400 },
      );
    }

    await requireFadWorkspaceRead(workspaceId, user.uid, user.role === "admin");

    const reports = await listSmartReports(workspaceId);
    const data = await Promise.all(
      reports.map((r) => (r.status === "ready" ? attachReportDownloadUrl(r) : r)),
    );

    return NextResponse.json({ ok: true, data });
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
