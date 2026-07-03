/**
 * Smoke test MapBiomas Alerta (WFS GeoServer + GraphQL).
 *
 * Uso:
 *   node scripts/probe-mapbiomas-alerta.mjs
 *   node scripts/probe-mapbiomas-alerta.mjs --json
 */
const WFS_BASE = "https://production.alerta.mapbiomas.org/geoserver/ows";
const GRAPHQL_URL = "https://plataforma.alerta.mapbiomas.org/api/v2/graphql";
const JSON_OUT = process.argv.includes("--json");

const KEY_LAYERS = [
  "mapbiomas-alertas:dashboard_alerts-shapefile",
  "mapbiomas-alertas:crew_simplified-alerts",
];

function log(...args) {
  if (!JSON_OUT) console.log(...args);
}

async function fetchText(url, init = {}, timeoutMs = 60_000) {
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
  });
  return { status: res.status, ok: res.ok, text: await res.text() };
}

function extractLayerNames(xml) {
  const names = new Set();
  const re = /<Name>([^<]+)<\/Name>/g;
  let m;
  while ((m = re.exec(xml))) names.add(m[1]);
  return [...names].filter((n) => /mapbiomas/i.test(n)).sort();
}

async function probeCapabilities() {
  const url = `${WFS_BASE}?service=WFS&request=GetCapabilities&version=2.0.0`;
  const { status, ok, text } = await fetchText(url);
  const layers = ok ? extractLayerNames(text) : [];
  return {
    id: "wfs-capabilities",
    ok: ok && layers.length > 0,
    status,
    layerCount: layers.length,
    sampleLayers: layers.slice(0, 10),
  };
}

async function probeLayer(typeName) {
  const url = new URL(WFS_BASE);
  url.searchParams.set("service", "WFS");
  url.searchParams.set("version", "1.1.0");
  url.searchParams.set("request", "GetFeature");
  url.searchParams.set("typeName", typeName);
  url.searchParams.set("outputFormat", "application/json");
  url.searchParams.set("srsName", "EPSG:4326");
  url.searchParams.set("maxFeatures", "1");
  url.searchParams.set("bbox", "-44.5,-20.5,-44.0,-20.0,EPSG:4326");

  const { status, ok, text } = await fetchText(url.toString());
  let featureCount = 0;
  let sampleProps = null;
  if (ok && text.trim().startsWith("{")) {
    try {
      const json = JSON.parse(text);
      featureCount = json.features?.length ?? 0;
      sampleProps = json.features?.[0]?.properties ?? null;
    } catch {
      /* ignore */
    }
  }
  return {
    id: `layer:${typeName}`,
    ok: ok && featureCount > 0,
    status,
    featureCount,
    sampleProps,
  };
}

async function probeGraphql() {
  const { status, ok, text } = await fetchText(
    GRAPHQL_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "{ __schema { queryType { name } } }" }),
    },
    20_000,
  );
  let queryType = null;
  if (ok) {
    try {
      queryType = JSON.parse(text)?.data?.__schema?.queryType?.name ?? null;
    } catch {
      /* ignore */
    }
  }
  return {
    id: "graphql-introspection",
    ok: ok && queryType === "Query",
    status,
    queryType,
    endpoint: GRAPHQL_URL,
    note: "Queries de dados exigem Bearer token (conta MapBiomas Alerta).",
  };
}

async function main() {
  const results = [];
  results.push(await probeCapabilities());
  for (const typeName of KEY_LAYERS) {
    results.push(await probeLayer(typeName));
  }
  results.push(await probeGraphql());

  const failed = results.filter((r) => !r.ok);
  const report = {
    service: "MapBiomas Alerta",
    wfsBase: WFS_BASE,
    graphql: GRAPHQL_URL,
    probedAt: new Date().toISOString(),
    ok: failed.length === 0,
    results,
  };

  if (JSON_OUT) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    log(`[probe-mapbiomas-alerta] WFS: ${WFS_BASE}`);
    log(`[probe-mapbiomas-alerta] GraphQL: ${GRAPHQL_URL}\n`);
    for (const r of results) {
      const tag = r.ok ? "OK" : "FAIL";
      log(`${tag} ${r.id}`, r.status ?? "", r.layerCount ?? r.featureCount ?? "", r.note ?? "");
    }
    log(`\nResumo: ${failed.length} falha(s).`);
  }

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
