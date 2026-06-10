import { NextRequest, NextResponse } from "next/server";
import { adminApiErrorNextResponse, requireAdminApiAuth } from "@/lib/api-auth";
import { updateOfficialSource } from "@/lib/mcp-rag/store.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PatchBody = {
  enabled?: boolean;
  notes?: string;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminApiAuth(request);
    const { id } = await context.params;
    const body = (await request.json()) as PatchBody;
    const updated = await updateOfficialSource(id, {
      ...(typeof body.enabled === "boolean" ? { enabled: body.enabled } : {}),
      ...(typeof body.notes === "string" ? { notes: body.notes } : {}),
    });
    if (!updated) {
      return NextResponse.json(
        { error: "Fonte oficial não encontrada." },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, source: updated });
  } catch (err) {
    return adminApiErrorNextResponse(err);
  }
}
