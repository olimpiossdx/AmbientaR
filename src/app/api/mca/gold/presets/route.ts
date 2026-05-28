import { NextResponse } from "next/server";
import { MCA_GOLD_PRESETS } from "@/lib/mca/gold-presets";
import { buildGoldPerimeter, goldPerimeterAreaHa } from "@/lib/mca/gold-perimeters";

/** Lista presets ouro com perímetro sintético (testes e integrações). */
export async function GET() {
  const presets = MCA_GOLD_PRESETS.map((p) => {
    const areaHa = goldPerimeterAreaHa(p.id);
    return {
      ...p,
      perimeterAreaHa: areaHa,
      perimeterGeoJson: buildGoldPerimeter(p.id),
    };
  });
  return NextResponse.json({
    success: true,
    presets,
    note: "Perímetros sintéticos para QA; substituir por GeoJSON real dos PDFs/DWG quando disponível.",
  });
}
