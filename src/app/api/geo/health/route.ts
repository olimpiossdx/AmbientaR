import { NextResponse } from "next/server";
import { checkSicarWfsHealth } from "@/lib/geospatial/sicar-health";
import { probeCswCapabilities } from "@/lib/geospatial/geonetwork-client";

export const dynamic = "force-dynamic";

/** Health check agregado dos geosserviços públicos (P0/P3). */
export async function GET() {
  const [sicar, csw] = await Promise.all([
    checkSicarWfsHealth(),
    probeCswCapabilities(),
  ]);

  const ideCapabilities = await fetch(
    "https://geoserver.meioambiente.mg.gov.br/ows?service=WFS&version=1.1.0&request=GetCapabilities",
    { cache: "no-store", signal: AbortSignal.timeout(25_000) },
  ).then((r) => ({ ok: r.ok, status: r.status }))
    .catch((e) => ({ ok: false, status: 0, error: String(e) }));

  return NextResponse.json({
    generatedAtUtc: new Date().toISOString(),
    services: {
      ideSisemaWfs: ideCapabilities,
      sicar,
      geonetworkCsw: csw,
    },
  });
}
