/**
 * Depuração das camadas federais PRODES / MapBiomas Alerta.
 * Usa a mesma margem de bbox que a análise geoespacial (run-wave-a-analysis).
 *
 * Uso:
 *   npx tsx scripts/debug-federal-geo-layers.ts
 *   npx tsx scripts/debug-federal-geo-layers.ts --fixture fixtures/geo/test-polygon-mg-alerta-hit.geojson
 */
import fs from "node:fs";
import path from "node:path";
import { expandBbox } from "../src/lib/geospatial/perimeter";
import { fetchFederalWfsForEntry } from "../src/lib/geospatial/federal-wfs-fetch";
import { FEDERAL_STATIC_LAYERS } from "../src/lib/geospatial/wave-federal-catalog";

const DEFAULT_FIXTURE = path.join(
  process.cwd(),
  "fixtures/geo/test-polygon-mg-850ha.geojson",
);

const FEDERAL_WFS_LAYERS = FEDERAL_STATIC_LAYERS.filter(
  (e) => e.wfsBaseUrls.length > 0 && !e.arcgisLayerUrl,
);

function fixtureArg(): string {
  const idx = process.argv.indexOf("--fixture");
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1]!;
  return DEFAULT_FIXTURE;
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

type ProbeStatus =
  | "ok"
  | "ok_proxy"
  | "no_features"
  | "skipped"
  | "degraded"
  | "error";

async function probeEntry(
  entry: (typeof FEDERAL_WFS_LAYERS)[number],
  bbox: [number, number, number, number],
) {
  const margin =
    entry.bboxMarginDegrees ??
    (entry.geometryKind === "point" ? 0.05 : 0.02);
  const queryBbox = expandBbox(bbox, margin);

  const wfs = await fetchFederalWfsForEntry(entry, queryBbox);

  let status: ProbeStatus = "error";
  if (wfs.ok && wfs.proxiedFromMapBiomasAlerta) status = "ok_proxy";
  else if (wfs.ok) status = "ok";
  else if (wfs.skippedOutsideExtent) status = "skipped";
  else if (wfs.upstreamWfsDegraded) status = "degraded";
  else if (wfs.noFeaturesInExtent) status = "no_features";

  return {
    layerId: entry.layerId,
    title: entry.title,
    status,
    featureCount: wfs.features.length,
    marginDegrees: margin,
    queryBbox,
    typeName: wfs.typeName ?? entry.typeNames[0],
    error: wfs.error,
  };
}

async function main() {
  const fixture = path.resolve(fixtureArg());
  const bbox = bboxFromFixture(fixture);

  console.log(`[debug-federal] fixture: ${fixture}`);
  console.log(`[debug-federal] bbox perímetro: ${bbox.join(", ")}\n`);

  const results = [];
  for (const entry of FEDERAL_WFS_LAYERS) {
    const row = await probeEntry(entry, bbox);
    results.push(row);
    const tag =
      row.status === "ok"
        ? "OK"
        : row.status === "ok_proxy"
          ? "OK_PROXY"
          : row.status === "skipped"
            ? "IGNORADA"
            : row.status === "no_features"
              ? "SEM_FEICOES"
              : row.status === "degraded"
                ? "DEGRADADO"
                : "ERRO";
    console.log(
      `[${tag}] ${row.layerId}`,
      row.featureCount ? `${row.featureCount} feat` : "",
      row.error ?? "",
    );
  }

  const summary = {
    ok: results.filter((r) => r.status === "ok").length,
    okProxy: results.filter((r) => r.status === "ok_proxy").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    noFeatures: results.filter((r) => r.status === "no_features").length,
    degraded: results.filter((r) => r.status === "degraded").length,
    error: results.filter((r) => r.status === "error").length,
  };

  console.log(
    `\nResumo: OK=${summary.ok} proxy=${summary.okProxy} ignorada=${summary.skipped} sem feições=${summary.noFeatures} degradado=${summary.degraded} erro=${summary.error}`,
  );

  const outPath = path.join(
    process.cwd(),
    "docs/analise-ambiental-automatizada/debug-federal-geo-report.json",
  );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        generatedAtUtc: new Date().toISOString(),
        fixture,
        bbox,
        results,
        summary,
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log(`Relatório: ${outPath}`);

  if (summary.error > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
