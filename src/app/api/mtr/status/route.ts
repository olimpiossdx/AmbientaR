import { NextResponse } from "next/server";
import { isMtrConfigured } from "@/lib/mtr/mtr-client";
import { requireAuthenticatedApi, apiAuthErrorResponse } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/** Indica se o proxy MTR está configurado no servidor (P7). */
export async function GET(req: Request) {
  try {
    await requireAuthenticatedApi(req);
  } catch (e) {
    return apiAuthErrorResponse(e);
  }

  return NextResponse.json({
    configured: isMtrConfigured(),
    homologDefault: process.env.MTR_USE_HOMOLOG === "true",
    baseUrlHint: process.env.MTR_API_BASE ?? "https://mtr.meioambiente.mg.gov.br/api",
    docs: "https://semad.mg.gov.br/documents/d/semad/manual-webservice-sistema-mtr_14022025-pdf",
  });
}
