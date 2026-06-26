/**
 * Health check SICAR WFS (P3).
 */

import { SICAR_WFS } from "@/lib/geospatial/wave-federal-catalog";

export type SicarHealthResult = {
  ok: boolean;
  status: number;
  latencyMs: number;
  capabilitiesUrl: string;
  error?: string;
};

export async function checkSicarWfsHealth(): Promise<SicarHealthResult> {
  const capabilitiesUrl = `${SICAR_WFS}?service=WFS&version=1.1.0&request=GetCapabilities`;
  const t0 = Date.now();
  try {
    const res = await fetch(capabilitiesUrl, {
      method: "GET",
      cache: "no-store",
      headers: { "User-Agent": "AmbientaR/sicar-health" },
      signal: AbortSignal.timeout(30_000),
    });
    return {
      ok: res.ok,
      status: res.status,
      latencyMs: Date.now() - t0,
      capabilitiesUrl,
      error: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      latencyMs: Date.now() - t0,
      capabilitiesUrl,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
