import { NextResponse } from "next/server";
import { fetchEstacaoTelemetrica } from "@/lib/geospatial/ana-hidroweb-client";
import { requireAuthenticatedApi, apiAuthErrorResponse } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/** Consulta estação telemétrica ANA HidroWeb (P6). */
export async function GET(req: Request) {
  try {
    await requireAuthenticatedApi(req);
  } catch (e) {
    return apiAuthErrorResponse(e);
  }

  const id = new URL(req.url).searchParams.get("id");
  if (!id?.trim()) {
    return NextResponse.json({ error: "Parâmetro id é obrigatório." }, { status: 400 });
  }

  const station = await fetchEstacaoTelemetrica(id.trim());
  if (!station) {
    return NextResponse.json(
      { error: "Estação não encontrada ou HidroWeb indisponível." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    generatedAtUtc: new Date().toISOString(),
    station,
    fonte: "https://www.snirh.gov.br/hidroweb/",
  });
}
