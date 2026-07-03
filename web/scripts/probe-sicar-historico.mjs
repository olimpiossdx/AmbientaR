/**
 * Spike Fase 0 — histórico CAR / versões SICAR (consulta pública).
 *
 * Uso:
 *   node scripts/probe-sicar-historico.mjs
 *   node scripts/probe-sicar-historico.mjs --car MG-3170404-EE13855CE8314C4AA894EC793186E1E0
 *   node scripts/probe-sicar-historico.mjs --json
 */
const DEFAULT_CAR = "MG-3170404-EE13855CE8314C4AA894EC793186E1E0";
const JSON_OUT = process.argv.includes("--json");
const carArg = process.argv.find((a) => a.startsWith("--car="));
const CAR = carArg ? carArg.slice("--car=".length) : DEFAULT_CAR;

const WFS_BASE = "https://geoserver.car.gov.br/geoserver/sicar/wfs";
const WFS_OWS = "https://geoserver.car.gov.br/geoserver/sicar/ows";

const CANDIDATE_ENDPOINTS = [
  {
    id: "consultapublica-imovel",
    url: `https://consultapublica.car.gov.br/publico/imoveis/index?codigo=${encodeURIComponent(CAR)}`,
    method: "GET",
    expect: "html",
  },
  {
    id: "consultapublica-api-search",
    url: `https://consultapublica.car.gov.br/publico/municipios/imovel?codigoImovel=${encodeURIComponent(CAR)}`,
    method: "GET",
    expect: "json",
  },
  {
    id: "geoserver-rest-layers",
    url: "https://geoserver.car.gov.br/geoserver/rest/layers.json",
    method: "GET",
    expect: "json",
  },
];

function log(...args) {
  if (!JSON_OUT) console.log(...args);
}

async function fetchProbe(id, url, init = {}, timeoutMs = 45_000) {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        Accept: "application/json, text/html, */*",
        "User-Agent": "AmbientaR-probe/1.0",
        ...(init.headers ?? {}),
      },
    });
    const text = await res.text();
    return {
      id,
      url,
      ok: res.ok,
      status: res.status,
      ms: Date.now() - started,
      contentType: res.headers.get("content-type"),
      sample: text.slice(0, 500),
      bodyLength: text.length,
    };
  } catch (e) {
    return {
      id,
      url,
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      ms: Date.now() - started,
    };
  }
}

function extractWfsLayerNames(xml) {
  const names = new Set();
  const re = /<Name>([^<]+)<\/Name>/gi;
  let m;
  while ((m = re.exec(xml))) names.add(m[1]);
  return [...names].sort();
}

async function probeWfsCapabilities() {
  const url = `${WFS_BASE}?service=WFS&request=GetCapabilities&version=2.0.0`;
  const r = await fetchProbe("wfs-capabilities", url);
  if (!r.ok || !r.sample) return { ...r, layers: [], historicoLayers: [] };
  const layers = extractWfsLayerNames(r.sample + (r.bodyLength > 500 ? "" : ""));
  const historicoLayers = layers.filter((n) =>
    /hist|retif|vers|anterior|snapshot|mudan/i.test(n),
  );
  return { ...r, layers, historicoLayers, layerCount: layers.length };
}

async function probeCarWfs(uf = "mg") {
  const typeName = `sicar:sicar_imoveis_${uf}`;
  const cql = `cod_imovel='${CAR.replace(/'/g, "''")}'`;
  const url = new URL(WFS_OWS);
  url.searchParams.set("service", "WFS");
  url.searchParams.set("version", "1.1.0");
  url.searchParams.set("request", "GetFeature");
  url.searchParams.set("typeName", typeName);
  url.searchParams.set("outputFormat", "application/json");
  url.searchParams.set("srsName", "EPSG:4326");
  url.searchParams.set("CQL_FILTER", cql);
  url.searchParams.set("maxFeatures", "5");

  const r = await fetchProbe("wfs-car-atual", url.toString());
  let properties = null;
  let propertyKeys = [];
  if (r.ok && r.sample) {
    try {
      const gj = JSON.parse(
        r.sample.length < r.bodyLength
          ? await (await fetch(url.toString(), { signal: AbortSignal.timeout(45_000) })).text()
          : r.sample,
      );
      const feat = gj.features?.[0];
      properties = feat?.properties ?? null;
      propertyKeys = properties ? Object.keys(properties).sort() : [];
    } catch {
      /* partial */
    }
  }
  return { ...r, typeName, propertyKeys, properties };
}

async function probeDescribeFeatureType(uf = "mg") {
  const typeName = `sicar:sicar_imoveis_${uf}`;
  const url = `${WFS_BASE}?service=WFS&version=1.1.0&request=DescribeFeatureType&typeName=${typeName}`;
  const r = await fetchProbe("describe-feature-type", url);
  const hasHistoricoField =
    r.sample &&
    /hist|retif|vers|data_atualiz|dat_atualiz|mudan/i.test(r.sample);
  return { ...r, typeName, hasHistoricoField };
}

async function main() {
  log(`\n=== Spike SICAR histórico — CAR: ${CAR} ===\n`);

  const results = {
    car: CAR,
    probedAt: new Date().toISOString(),
    wfs: null,
    carFeature: null,
    describe: null,
    endpoints: [],
    conclusion: "",
  };

  results.wfs = await probeWfsCapabilities();
  log("WFS capabilities:", results.wfs.ok ? "OK" : "FAIL", results.wfs.status ?? results.wfs.error);
  if (results.wfs.historicoLayers?.length) {
    log("  Camadas histórico:", results.wfs.historicoLayers.join(", "));
  } else {
    log("  Camadas histórico no WFS:", results.wfs.historicoLayers?.length === 0 ? "nenhuma" : "—");
  }
  log("  Total camadas:", results.wfs.layerCount ?? 0);

  results.carFeature = await probeCarWfs("mg");
  log("\nCAR atual (WFS MG):", results.carFeature.ok ? "OK" : "FAIL");
  if (results.carFeature.propertyKeys?.length) {
    log("  Campos:", results.carFeature.propertyKeys.join(", "));
    const dates = results.carFeature.propertyKeys.filter((k) =>
      /data|dat_|atualiz|criac/i.test(k),
    );
    log("  Campos data:", dates.join(", ") || "—");
    if (results.carFeature.properties) {
      for (const k of dates) {
        log(`    ${k}:`, results.carFeature.properties[k]);
      }
    }
  }

  results.describe = await probeDescribeFeatureType("mg");
  log("\nDescribeFeatureType:", results.describe.ok ? "OK" : "FAIL");

  for (const ep of CANDIDATE_ENDPOINTS) {
    const r = await fetchProbe(ep.id, ep.url);
    results.endpoints.push(r);
    log(`\n${ep.id}:`, r.ok ? `HTTP ${r.status}` : r.error ?? `HTTP ${r.status}`);
    if (r.sample) {
      const hint = /hist|retific|vers|mudan|atualiz/i.test(r.sample)
        ? " (contém termos histórico/retificação no corpo)"
        : "";
      log("  amostra:", r.sample.replace(/\s+/g, " ").slice(0, 200) + hint);
    }
  }

  const hasHistoricoWfs = (results.wfs.historicoLayers?.length ?? 0) > 0;
  const hasMultiVersion = false; // filled if we find version API

  if (hasHistoricoWfs) {
    results.conclusion =
      "WFS expõe camada(s) de histórico — implementar consulta por layerId dedicado.";
  } else {
    results.conclusion =
      "WFS público expõe apenas snapshot atual (sicar_imoveis_UF). Histórico de versões " +
      "do PDF Sicredi provavelmente exige API Conecta Gov (órgão) ou cache próprio por data_atualizacao. " +
      "Estratégia v1: snapshot atual + alerta omissão quando retificação reduz sobreposição (requer armazenar snapshots).";
  }

  log("\n--- CONCLUSÃO ---");
  log(results.conclusion);

  if (JSON_OUT) {
    console.log(JSON.stringify(results, null, 2));
  }

  process.exit(results.carFeature?.ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
