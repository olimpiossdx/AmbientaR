import { NextResponse } from "next/server";
import { loadMcaRegistry } from "@/lib/mca/registry";
import { MCA_ETAPA_LABELS } from "@/lib/mca/etapas";

export async function GET() {
  try {
    const registry = loadMcaRegistry();
    const agents = Object.entries(registry)
      .map(([id, def]) => ({
        id,
        family: def.family,
        mode: def.mode,
        etapa: def.etapa_min,
        etapaLabel: MCA_ETAPA_LABELS[def.etapa_min] ?? `Etapa ${def.etapa_min}`,
        produces: def.produces,
        depends_on: def.depends_on,
      }))
      .sort((a, b) => a.etapa - b.etapa || a.id.localeCompare(b.id));

    return NextResponse.json({
      success: true,
      count: agents.length,
      agents,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Registry indisponível" },
      { status: 500 },
    );
  }
}
