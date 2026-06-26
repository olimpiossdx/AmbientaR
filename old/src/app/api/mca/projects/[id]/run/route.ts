import { NextRequest, NextResponse } from "next/server";
import { runMcaPipeline } from "@/lib/mca/orchestrator";
import { verifyBearerUid } from "@/lib/mca/verify-user";

export const maxDuration = 300;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await verifyBearerUid(req.headers.get("authorization"));
    const body = (await req.json().catch(() => ({}))) as {
      maxEtapa?: number;
      minEtapa?: number;
      agentIds?: string[];
      changedLayerKeys?: string[];
    };
    const result = await runMcaPipeline({
      projectId: params.id,
      uid: user.uid,
      maxEtapa: body.maxEtapa ?? 15,
      minEtapa: body.minEtapa,
      agentIds: body.agentIds,
      changedLayerKeys: body.changedLayerKeys,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Pipeline falhou" },
      { status: 500 },
    );
  }
}
