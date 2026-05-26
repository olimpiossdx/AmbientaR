import { NextRequest, NextResponse } from "next/server";
import { adminApiErrorNextResponse, requireAdminApiAuth } from "@/lib/api-auth";
import { createOneDriveAuthState } from "@/lib/onedrive/consumer-oauth";
import { getGraphAuthMode } from "@/lib/onedrive/graph";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminApiAuth(request);
    if (getGraphAuthMode() !== "delegated") {
      return NextResponse.json(
        {
          error:
            "OAuth delegado só é usado com ONEDRIVE_GRAPH_AUTH_MODE=delegated.",
        },
        { status: 400 },
      );
    }

    const returnPath =
      request.nextUrl.searchParams.get("returnPath")?.trim() ||
      "/ai-lab/cloud-library";
    const { authUrl } = await createOneDriveAuthState({
      uid: admin.uid,
      returnPath,
    });

    return NextResponse.json({ success: true, authUrl });
  } catch (err) {
    return adminApiErrorNextResponse(err);
  }
}
