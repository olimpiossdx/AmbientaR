import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminApiErrorNextResponse, requireAdminApiAuth } from "@/lib/api-auth";
import { assertOnedriveReady } from "@/lib/onedrive/api-guard";
import { syncClientFolder } from "@/lib/onedrive/sync-delta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  clientId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    await requireAdminApiAuth(request);
    const guard = assertOnedriveReady();
    if (!guard.ok) return guard.response;

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "clientId é obrigatório." },
        { status: 400 },
      );
    }

    const result = await syncClientFolder(parsed.data.clientId);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    return adminApiErrorNextResponse(err);
  }
}
