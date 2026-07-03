/**
 * P0 — Probe de geosserviços (GetCapabilities + GetFeature por camada do catálogo).
 * Uso: npm run geo:probe
 */
import fs from "node:fs";
import path from "node:path";
import { resolveAllLayersForBbox } from "../src/lib/geospatial/geo-all-layers";
import {
  SICAR_WFS,
  IBAMA_SISCOM_WFS,
  TERRABRASILIS_WFS,
  MAPBIOMAS_ALERTA_WFS,
} from "../src/lib/geospatial/wave-federal-catalog";
import { expandBbox } from "../src/lib/geospatial/perimeter";
import { fetchWfsFeaturesInBbox } from "../src/lib/geospatial/wfs-client";

const FIXTURE = path.join(
  process.cwd(),
  "fixtures/geo/test-polygon-mg-850ha.geojson",
);

const CAPABILITY_ENDPOINTS = [
  {
    id: "ide_sisema_geoserver",
    url: "https://geoserver.meioambiente.mg.gov.br/ows?service=WFS&version=1.1.0&request=GetCapabilities",
  },
  {
    id: "sicar",
    url: "https://geoserver.car.gov.br/geoserver/sicar/ows?service=WFS&version=1.1.0&request=GetCapabilities",
  },
  {
    id: "ibama_siscom",
    url: `${IBAMA_SISCOM_WFS}?service=WFS&version=1.1.0&request=GetCapabilities`,
  },
  {
    id: "icmbio_inde",
    url: "https://geoservicos.inde.gov.br/geoserver/ICMBio/ows?service=WFS&version=2.0.0&request=GetCapabilities",
  },
  {
    id: "mma_inde",
    url: "https://geoservicos.inde.gov.br/geoserver/MMA/ows?service=WFS&version=2.0.0&request=GetCapabilities",
  },
  {
    id: "terrabrasilis",
    url: `${TERRABRASILIS_WFS}?service=WFS&version=1.1.0&request=GetCapabilities`,
  },
  {
    id: "mapbiomas_alerta",
    url: `${MAPBIOMAS_ALERTA_WFS}?service=WFS&version=1.1.0&request=GetCapabilities`,
  },
  {
    id: "geonetwork_csw",
    url: "https://idesisema.meioambiente.mg.gov.br/geonetwork/srv/por/csw?service=CSW&version=2.0.2&request=GetCapabilities",
  },
];

function bboxFromFixture(): [number, number, number, number] {
  const raw = JSON.parse(fs.readFileSync(FIXTURE, "utf8")) as {
    features: { geometry: { coordinates: number[][][] } }[];
  };
  const ring = raw.features[0].geometry.coordinates[0];
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

async function probeCapabilities(): Promise<
  { id: string; url: string; status: number; ok: boolean; ms: number; error?: string }[]
> {
  const out = [];
  for (const ep of CAPABILITY_ENDPOINTS) {
    const t0 = Date.now();
    try {
      const res = await fetch(ep.url, {
        method: "GET",
        cache: "no-store",
        headers: { "User-Agent": "AmbientaR/geo-probe" },
        signal: AbortSignal.timeout(30_000),
      });
      out.push({
        id: ep.id,
        url: ep.url,
        status: res.status,
        ok: res.ok,
        ms: Date.now() - t0,
      });
    } catch (e) {
      out.push({
        id: ep.id,
        url: ep.url,
        status: 0,
        ok: false,
        ms: Date.now() - t0,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return out;
}

async function probeLayers(
  bbox: [number, number, number, number],
): Promise<
  {
    layerId: string;
    title: string;
    status: "ok" | "no_features" | "degraded" | "error";
    featureCount?: number;
    typeName?: string;
    baseUrl?: string;
    error?: string;
    arcgis?: boolean;
  }[]
> {
  const all = resolveAllLayersForBbox(bbox);
  type LayerProbe = Awaited<ReturnType<typeof probeLayers>>[number];
  const results: LayerProbe[] = [];

  for (const entry of all) {
    if (entry.arcgisLayerUrl) {
      results.push({
        layerId: entry.layerId,
        title: entry.title,
        status: "ok" as const,
        arcgis: true,
        error: "ArcGIS REST — probe WFS ignorado (usar arcgis-feature-client)",
      });
      continue;
    }

    const margin =
      entry.bboxMarginDegrees ??
      (entry.geometryKind === "point" ? 0.05 : 0.02);
    const queryBbox = expandBbox(bbox, margin);

    const wfs = await fetchWfsFeaturesInBbox({
      baseUrls: entry.wfsBaseUrls,
      typeNames: entry.typeNames,
      bbox: queryBbox,
      maxFeatures: entry.maxWfsFeatures ?? 5,
    });

    if (wfs.ok) {
      results.push({
        layerId: entry.layerId,
        title: entry.title,
        status: "ok" as const,
        featureCount: wfs.features.length,
        typeName: wfs.typeName,
        baseUrl: wfs.baseUrl,
      });
    } else if (wfs.noFeaturesInExtent) {
      results.push({
        layerId: entry.layerId,
        title: entry.title,
        status: "no_features" as const,
        typeName: entry.typeNames[0],
        baseUrl: entry.wfsBaseUrls[0],
        error: wfs.error,
      });
    } else if (wfs.upstreamWfsDegraded) {
      results.push({
        layerId: entry.layerId,
        title: entry.title,
        status: "degraded" as const,
        typeName: entry.typeNames[0],
        baseUrl: entry.wfsBaseUrls[0],
        error: wfs.error,
      });
    } else {
      results.push({
        layerId: entry.layerId,
        title: entry.title,
        status: "error" as const,
        typeName: entry.typeNames[0],
        baseUrl: entry.wfsBaseUrls[0],
        error: wfs.error,
      });
    }
  }

  return results;
}

async function main() {
  const bbox = bboxFromFixture();
  console.log("Geo probe — bbox fixture:", bbox.join(", "));
  console.log("Capabilities…");
  const capabilities = await probeCapabilities();
  for (const c of capabilities) {
    console.log(
      `  ${c.ok ? "OK" : "FAIL"} ${c.id} HTTP ${c.status} (${c.ms}ms)${c.error ? ` — ${c.error}` : ""}`,
    );
  }

  console.log("\nCamadas do catálogo…");
  const layers = await probeLayers(bbox);
  const ok = layers.filter((l) => l.status === "ok").length;
  const noFeat = layers.filter((l) => l.status === "no_features").length;
  const degraded = layers.filter((l) => l.status === "degraded").length;
  const err = layers.filter((l) => l.status === "error").length;
  console.log(
    `  Total: ${layers.length} | OK: ${ok} | sem feições: ${noFeat} | degradado: ${degraded} | erro: ${err}`,
  );

  for (const l of layers) {
    const tag =
      l.status === "ok"
        ? `OK (${l.featureCount} feat)`
        : l.status === "no_features"
          ? "SEM_FEICOES"
          : l.status === "degraded"
            ? "DEGRADADO"
            : "ERRO";
    console.log(`  [${tag}] ${l.layerId}: ${l.error ?? l.typeName ?? ""}`);
  }

  const report = {
    generatedAtUtc: new Date().toISOString(),
    fixture: FIXTURE,
    bbox,
    capabilities,
    layers,
    summary: {
      total: layers.length,
      ok,
      noFeatures: noFeat,
      degraded,
      error: err,
    },
  };

  const outPath = path.join(
    process.cwd(),
    "docs/analise-ambiental-automatizada/geo-probe-report.json",
  );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`\nRelatório: ${outPath}`);

  const capFail = capabilities.filter((c) => !c.ok).length;
  if (capFail > 0 || err > layers.length * 0.5) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
