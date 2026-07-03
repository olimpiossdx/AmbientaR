import { NextResponse } from "next/server";
import {
  apiAuthErrorResponse,
  requireAuthenticatedApi,
} from "@/lib/api-auth";
import { getGeminiGeoComplementUsage } from "@/lib/geospatial/geo-ia-gemini-quota";

export async function GET(req: Request) {
  try {
    const user = await requireAuthenticatedApi(req);
    const usage = await getGeminiGeoComplementUsage(user.uid || user.id);
    return NextResponse.json({ success: true, usage });
  } catch (e) {
    return apiAuthErrorResponse(e);
  }
}
