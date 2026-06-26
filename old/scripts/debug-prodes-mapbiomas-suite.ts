/**
 * Repasse completo — PRODES / MapBiomas Alerta / camadas federais.
 *
 * Uso:
 *   npx tsx scripts/debug-prodes-mapbiomas-suite.ts
 *   npx tsx scripts/debug-prodes-mapbiomas-suite.ts --json
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { expandBbox } from "../src/lib/geospatial/perimeter";
import {
  bboxMayIntersectLegalAmazon,
  fetchFederalWfsForEntry,
} from "../src/lib/geospatial/federal-wfs-fetch";
import { runWaveAAnalysis } from "../src/lib/geospatial/run-wave-a-analysis";
import {
  FEDERAL_STATIC_LAYERS,
  FEDERAL_PRODES_CERRADO_LAYER_ID,
  FEDERAL_PRODES_MATA_ATLANTICA_LAYER_ID,
  FEDERAL_PRODES_LEGAL_AMZ_LAYER_ID,
  FEDERAL_MAPBIOMAS_ALERTA_LAYER_ID,
  WAVE_FEDERAL_LAYER_COUNT,
} from "../src/lib/geospatial/wave-federal-catalog";

const JSON_OUT = process.argv.includes("--json");
const FULL_WAVE = process.argv.includes("--full-wave");
const ROOT = process.cwd();

const FIXTURES = [
  {
    id: "mg-850ha",
    file: "fixtures/geo/test-polygon-mg-850ha.geojson",
  },
  {
    id: "mg-alerta-hit",
    file: "fixtures/geo/test-polygon-mg-alerta-hit.geojson",
  },
] as const;

const FEDERAL_LAYER_IDS = [
  FEDERAL_PRODES_CERRADO_LAYER_ID,
  FEDERAL_PRODES_MATA_ATLANTICA_LAYER_ID,
  FEDERAL_PRODES_LEGAL_AMZ_LAYER_ID,
  FEDERAL_MAPBIOMAS_ALERTA_LAYER_ID,
] as const;

function log(...args: unknown[]) {
  if (!JSON_OUT) console.log(...args);
}

function bboxFromFixture(filePath: string): [number, number, number, number] {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as {
    features: { geometry: { coordinates: number[][][] } }[];
  };
  const ring = raw.features[0]!.geometry.coordinates[0]!;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of ring) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return [minX, minY, maxX, maxY];
}

function runProbeScript(script: string): {
  id: string;
  exitCode: number;
  stdout: string;
} {
  const scriptPath = path.join(ROOT, script);
  try {
    const stdout = execSync(`node "${scriptPath}"`, {
      encoding: "utf8",
      timeout: 180_000,
    });
    return { id: script, exitCode: 0, stdout };
  } catch (e) {
    const err = e as { status?: number; stdout?: string };
    return {
      id: script,
      exitCode: err.status ?? 1,
      stdout: err.stdout ?? String(e),
    };
  }
}

async function analyzeFederalLayers(fixture: (typeof FIXTURES)[number]) {
  const filePath = path.join(ROOT, fixture.file);
  const geojson = fs.readFileSync(filePath, "utf8");
  const result = await runWaveAAnalysis({ dataType: "polygon", data: geojson });
  const federal = result.layers.filter((l) =>
    (FEDERAL_LAYER_IDS as readonly string[]).includes(l.layerId),
  );
  return {
    fixtureId: fixture.id,
    file: fixture.file,
    federalLayers: federal.map((l) => ({
      layerId: l.layerId,
      title: l.title,
      status: l.status,
      statsCount: l.stats.length,
      summary: l.summary.slice(0, 200),
      sourceMethod: l.source?.method,
      sourceName: l.source?.name,
    })),
  };
}

async function directFetchMatrix(fixture: (typeof FIXTURES)[number]) {
  const bbox = bboxFromFixture(path.join(ROOT, fixture.file));
  const rows = [];
  for (const entry of FEDERAL_STATIC_LAYERS.filter(
    (e) => e.wfsBaseUrls.length && !e.arcgisLayerUrl,
  )) {
    const margin = entry.bboxMarginDegrees ?? 0.02;
    const queryBbox = expandBbox(bbox, margin);
    const wfs = await fetchFederalWfsForEntry(entry, queryBbox);
    rows.push({
      layerId: entry.layerId,
      ok: wfs.ok,
      features: wfs.features.length,
      proxied: Boolean(wfs.proxiedFromMapBiomasAlerta),
      skipped: Boolean(wfs.skippedOutsideExtent),
      degraded: Boolean(wfs.upstreamWfsDegraded),
      noFeatures: Boolean(wfs.noFeaturesInExtent),
      error: wfs.error?.slice(0, 120),
    });
  }
  return { fixtureId: fixture.id, bbox, legalAmazon: bboxMayIntersectLegalAmazon(bbox), rows };
}

async function main() {
  const probes = [
    runProbeScript("scripts/probe-terrabrasilis-prodes.mjs"),
    runProbeScript("scripts/probe-mapbiomas-alerta.mjs"),
  ];

  const fetchMatrix = [];
  for (const f of FIXTURES) {
    fetchMatrix.push(await directFetchMatrix(f));
  }

  const waveFixtures = FULL_WAVE
    ? FIXTURES
    : FIXTURES.filter((f) => f.id === "mg-alerta-hit");
  const waveAnalysis = [];
  for (const f of waveFixtures) {
    waveAnalysis.push(await analyzeFederalLayers(f));
  }

  const catalogCheck = {
    federalStaticCount: FEDERAL_STATIC_LAYERS.length,
    waveFederalLayerCount: WAVE_FEDERAL_LAYER_COUNT,
    layerIds: FEDERAL_STATIC_LAYERS.map((l) => l.layerId),
  };

  const report = {
    generatedAtUtc: new Date().toISOString(),
    catalogCheck,
    probes: probes.map((p) => ({
      script: p.id,
      exitCode: p.exitCode,
      ok: p.exitCode === 0,
      tail: p.stdout.trim().split("\n").slice(-4).join("\n"),
    })),
    fetchMatrix,
    waveAnalysis,
    allProbesOk: probes.every((p) => p.exitCode === 0),
    federalFetchErrors: fetchMatrix.flatMap((m) =>
      m.rows.filter((r) => !r.ok && !r.skipped && !r.noFeatures && !r.degraded),
    ),
  };

  const outPath = path.join(
    ROOT,
    "docs/analise-ambiental-automatizada/debug-prodes-mapbiomas-suite-report.json",
  );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

  if (JSON_OUT) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    log("=== Repasse PRODES + MapBiomas Alerta ===\n");
    log("Catálogo federal:", catalogCheck.layerIds.join(", "));
    log("");
    for (const p of report.probes) {
      log(`${p.ok ? "OK" : "FAIL"} ${path.basename(p.script)} (exit ${p.exitCode})`);
      log(p.tail);
      log("");
    }
    for (const m of fetchMatrix) {
      log(`--- Fetch direto: ${m.fixtureId} (AL? ${m.legalAmazon}) ---`);
      for (const r of m.rows) {
        const tag = r.ok
          ? r.proxied
            ? "OK_PROXY"
            : "OK"
          : r.skipped
            ? "IGNORADA"
            : r.degraded
              ? "DEGRADADO"
              : r.noFeatures
                ? "SEM_FEICOES"
                : "ERRO";
        log(`  [${tag}] ${r.layerId} ${r.features || ""} ${r.error || ""}`);
      }
      log("");
    }
    for (const w of waveAnalysis) {
      log(`--- Wave A análise: ${w.fixtureId} ---`);
      for (const l of w.federalLayers) {
        log(`  [${l.status}] ${l.layerId} stats=${l.statsCount}`);
        log(`    ${l.summary}`);
      }
      log("");
    }
    log(`Relatório: ${outPath}`);
    const failed = !report.allProbesOk || report.federalFetchErrors.length > 0;
    if (failed) log("\n⚠ Alguns checks falharam — ver JSON.");
    else log("\n✓ Suite concluída sem erros críticos.");
  }

  const failed =
    !report.allProbesOk || report.federalFetchErrors.length > 0;
  if (failed) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
