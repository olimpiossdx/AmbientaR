import { NextResponse } from "next/server";
import { loadMcaRegistry } from "@/lib/mca/registry";
import { loadBehaviorRegistry } from "@/lib/mca/behavior/load-behavior-registry";
import { isCadWorkerConfigured, isOgr2ogrAvailable } from "@/lib/mca/dwg-convert";
export async function GET() {
  let agents = 0;
  try {
    agents = Object.keys(loadMcaRegistry()).length;
  } catch {
    agents = 0;
  }
  const engineUrl = process.env.MCA_ENGINE_URL?.replace(/\/$/, "");
  let engineOk = false;
  if (engineUrl) {
    try {
      const r = await fetch(`${engineUrl}/health`, { signal: AbortSignal.timeout(3000) });
      engineOk = r.ok;
    } catch {
      engineOk = false;
    }
  }
  return NextResponse.json({
    status: "ok",
    service: "mca",
    version: 2,
    agents,
    behaviorRegistry: Object.keys(loadBehaviorRegistry()).length,
    engineUrl: engineUrl ?? null,
    engineOk,
    ogr2ogr: isOgr2ogrAvailable(),
    cadWorker: isCadWorkerConfigured(),
    debug: process.env.MCA_DEBUG === "1",
  });}
