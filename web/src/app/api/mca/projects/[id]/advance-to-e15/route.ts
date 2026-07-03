import { NextRequest, NextResponse } from "next/server";
import { verifyBearerUid } from "@/lib/mca/verify-user";
import { advanceMcaProjectToE15 } from "@/lib/mca/advance-to-e15";

export const maxDuration = 300;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await verifyBearerUid(req.headers.get("authorization"));
    const body = (await req.json().catch(() => ({}))) as {
      importDemoIfNeeded?: boolean;
    };
    const result = await advanceMcaProjectToE15({
      projectId: params.id,
      uid: user.uid,
      importDemoIfNeeded: body.importDemoIfNeeded,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Falha ao avançar até E15",
      },
      { status: 400 },
    );
  }
}
