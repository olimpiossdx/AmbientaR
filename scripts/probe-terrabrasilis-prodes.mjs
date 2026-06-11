/**
 * Smoke test dos serviços abertos PRODES/DETER (INPE TerraBrasilis).
 *
 * Uso:
 *   node scripts/probe-terrabrasilis-prodes.mjs
 *   node scripts/probe-terrabrasilis-prodes.mjs --json
 */
const WFS_BASE = "https://terrabrasilis.dpi.inpe.br/geoserver/ows";
const JSON_OUT = process.argv.includes("--json");

const KEY_LAYERS = [
  "prodes-cerrado-nb:yearly_deforestation",
  "prodes-mata-atlantica-nb:yearly_deforestation",
  "prodes-legal-amz:yearly_deforestation",
  "deter-amz:deter_amz",
];

function log(...args) {
  if (!JSON_OUT) console.log(...args);
}

async function fetchText(url, timeoutMs = 45_000) {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  return { status: res.status, ok: res.ok, text: await res.text() };
}

function extractLayerNames(xml) {
  const names = new Set();
  const re = /<Name>([^<]+)<\/Name>/g;
  let m;
  while ((m = re.exec(xml))) names.add(m[1]);
  return [...names].filter((n) => /prodes|deter/i.test(n)).sort();
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
    sampleLayers: layers.slice(0, 12),
  };
}

const LAYER_TEST_BBOX = {
  "prodes-cerrado-nb:yearly_deforestation": "-50,-20,-44,-14,EPSG:4326",
  "prodes-mata-atlantica-nb:yearly_deforestation": "-50,-23,-40,-14,EPSG:4326",
  "prodes-legal-amz:yearly_deforestation": "-60,-10,-48,5,EPSG:4326",
  "deter-amz:deter_amz": "-60,-10,-48,5,EPSG:4326",
};

async function probeLayer(typeName) {
  const url = new URL(WFS_BASE);
  url.searchParams.set("service", "WFS");
  url.searchParams.set("version", "1.1.0");
  url.searchParams.set("request", "GetFeature");
  url.searchParams.set("typeName", typeName);
  url.searchParams.set("outputFormat", "application/json");
  url.searchParams.set("srsName", "EPSG:4326");
  url.searchParams.set("maxFeatures", "1");
  url.searchParams.set(
    "bbox",
    LAYER_TEST_BBOX[typeName] ?? "-44.5,-20.5,-44.0,-20.0,EPSG:4326",
  );

  const { status, ok, text } = await fetchText(url.toString());
  let featureCount = 0;
  let sampleProps = null;
  let serviceOk = false;
  let warn = false;
  let note;

  if (text.includes("does not have a property named uid")) {
    warn = true;
    note =
      "Bug conhecido no GeoServer INPE (uid) — camada no catálogo, WFS pode falhar até correção upstream.";
  } else if (ok && text.trim().startsWith("{")) {
    try {
      const json = JSON.parse(text);
      if (json.type === "FeatureCollection") {
        serviceOk = true;
        featureCount = json.features?.length ?? 0;
        sampleProps = json.features?.[0]?.properties ?? null;
        if (featureCount === 0) {
          note = "serviço OK — sem feições no bbox de teste";
        }
      }
    } catch {
      /* ignore */
    }
  } else if (text.includes("ExceptionReport")) {
    const match = text.match(/<ows:ExceptionText>([^<]+)/);
    note = match?.[1]?.trim().slice(0, 120);
  }

  return {
    id: `layer:${typeName}`,
    ok: serviceOk,
    warn,
    status,
    featureCount,
    sampleProps,
    note,
  };
}

async function probeAnalyticsApi() {
  const url = "https://terrabrasilis.dpi.inpe.br/dashboard/api/v1/redis-cli/list_datasets";
  const { status, text } = await fetchText(url, 15_000);
  const looksHtml = text.trim().startsWith("<!");
  return {
    id: "analytics-api",
    ok: status === 200 && !looksHtml,
    status,
    note: looksHtml
      ? "Endpoint documentado no pacote R terrabrasilisAnalyticsAPI — responde HTML (provável descontinuação)."
      : undefined,
  };
}

async function main() {
  const results = [];
  results.push(await probeCapabilities());
  for (const typeName of KEY_LAYERS) {
    results.push(await probeLayer(typeName));
  }
  results.push(await probeAnalyticsApi());

  const failed = results.filter(
    (r) => !r.ok && !r.warn && r.id !== "analytics-api",
  );
  const report = {
    service: "INPE TerraBrasilis PRODES/DETER",
    wfsBase: WFS_BASE,
    probedAt: new Date().toISOString(),
    ok: failed.length === 0,
    results,
  };

  if (JSON_OUT) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    log(`[probe-terrabrasilis] WFS base: ${WFS_BASE}\n`);
    for (const r of results) {
      const tag = r.ok
        ? "OK"
        : r.warn || r.id === "analytics-api"
          ? "WARN"
          : "FAIL";
      log(
        `${tag} ${r.id}`,
        r.status ?? "",
        r.layerCount ?? r.featureCount ?? "",
        r.note ?? "",
      );
    }
    log(`\nResumo: ${failed.length} falha(s) crítica(s).`);
  }

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
