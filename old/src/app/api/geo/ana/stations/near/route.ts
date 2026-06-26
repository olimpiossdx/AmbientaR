import { NextResponse } from "next/server";
import { buildHidrologiaContext } from "@/lib/geospatial/ana-hidroweb-client";

export const dynamic = "force-dynamic";

/** Estações ANA/SNIRH num raio do bbox (P6). Query: minX,minY,maxX,maxY ou raioKm=50 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const bboxParam = searchParams.get("bbox");
  const raioKm = Number(searchParams.get("raioKm") ?? "50");

  let bbox: [number, number, number, number] | null = null;
  if (bboxParam) {
    const parts = bboxParam.split(",").map(Number);
    if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
      bbox = parts as [number, number, number, number];
    }
  }

  if (!bbox) {
    return NextResponse.json(
      { error: "Parâmetro bbox obrigatório: minX,minY,maxX,maxY" },
      { status: 400 },
    );
  }

  const ctx = await buildHidrologiaContext(bbox, raioKm);
  return NextResponse.json(ctx);
}
