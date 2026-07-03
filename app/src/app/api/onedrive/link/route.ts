import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminApiErrorNextResponse, requireAdminApiAuth } from "@/lib/api-auth";
import { assertOnedriveReady } from "@/lib/onedrive/api-guard";
import { linkClientFolder } from "@/lib/onedrive/sync-delta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  clientId: z.string().min(1),
  folderPath: z.string().min(1),
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
        { success: false, error: "clientId e folderPath são obrigatórios." },
        { status: 400 },
      );
    }

    const result = await linkClientFolder(parsed.data);

    return NextResponse.json({
      success: true,
      link: result.link,
      folderPath: result.folderPath,
      oneDriveItemId: result.folderItem.id,
    });
  } catch (err) {
    return adminApiErrorNextResponse(err);
  }
}
