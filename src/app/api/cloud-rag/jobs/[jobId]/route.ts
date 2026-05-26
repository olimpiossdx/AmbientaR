import { NextRequest, NextResponse } from "next/server";
import { adminApiErrorNextResponse, requireAdminApiAuth } from "@/lib/api-auth";
import { getJob } from "@/lib/cloud-rag/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: { jobId: string } };

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    await requireAdminApiAuth(request);
    const jobId = context.params.jobId?.trim();
    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "jobId obrigatório." },
        { status: 400 },
      );
    }

    const job = await getJob(jobId);
    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job não encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, job });
  } catch (err) {
    return adminApiErrorNextResponse(err);
  }
}
