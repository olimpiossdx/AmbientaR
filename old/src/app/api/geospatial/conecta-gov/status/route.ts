import { NextResponse } from "next/server";
import { isConectaGovConfigured } from "@/lib/geospatial/conecta-gov-sicar";

/** Indica se Conecta Gov SICAR está configurado (sem expor segredos). */
export async function GET() {
  return NextResponse.json({ configured: isConectaGovConfigured() });
}
