#!/usr/bin/env node
/**
 * Verifica /health dos workers FAD em Cloud Run.
 * Uso: node scripts/fad-worker-health.mjs
 */

const satellite =
  process.env.FISCAL_SATELLITE_WORKER_URL ??
  "https://ambientar-fiscal-satellite-485112911461.southamerica-east1.run.app";
const intelligence =
  process.env.FISCAL_INTELLIGENCE_WORKER_URL ??
  "https://ambientar-fiscal-intelligence-485112911461.southamerica-east1.run.app";

async function probe(label, base) {
  const url = `${base.replace(/\/$/, "")}/health`;
  try {
    const res = await fetch(url);
    const body = await res.json().catch(() => ({}));
    return { label, url, ok: res.ok, status: res.status, body };
  } catch (e) {
    return {
      label,
      url,
      ok: false,
      status: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

const results = await Promise.all([
  probe("satellite", satellite),
  probe("intelligence", intelligence),
]);

console.log(JSON.stringify(results, null, 2));
process.exit(results.every((r) => r.ok) ? 0 : 1);
