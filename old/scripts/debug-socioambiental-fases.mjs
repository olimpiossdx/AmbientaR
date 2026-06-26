#!/usr/bin/env node
/**
 * Debugger por fase — Extrato Socioambiental (sem auth Firebase).
 * Uso: node scripts/debug-socioambiental-fases.mjs
 */
const UA = "AmbientaR/1.0 (debug socioambiental)";

async function probe(label, url, ok = (r) => r.ok, extraHeaders = {}) {
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": UA, ...extraHeaders },
      signal: AbortSignal.timeout(30_000),
    });
    const ms = Date.now() - t0;
    const pass = ok(res);
    console.log(`${pass ? "✓" : "✗"} ${label} — HTTP ${res.status} (${ms}ms)`);
    if (!pass) {
      const text = await res.text().catch(() => "");
      console.log(`  ${text.slice(0, 200)}`);
    }
    return pass;
  } catch (e) {
    console.log(`✗ ${label} — ${e instanceof Error ? e.message : e}`);
    return false;
  }
}

async function probeJson(label, url, validate) {
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": UA },
      signal: AbortSignal.timeout(30_000),
    });
    const ms = Date.now() - t0;
    const json = await res.json();
    const pass = res.ok && validate(json);
    console.log(`${pass ? "✓" : "✗"} ${label} — HTTP ${res.status} (${ms}ms)`);
    if (!pass) console.log(`  keys: ${Object.keys(json).join(", ")}`);
    return pass;
  } catch (e) {
    console.log(`✗ ${label} — ${e instanceof Error ? e.message : e}`);
    return false;
  }
}

console.log("=== Fase 0 — SICAR WFS (snapshot CAR) ===\n");
await probeJson(
  "SICAR GetFeature MG sample",
  "https://geoserver.car.gov.br/geoserver/sicar/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=sicar:sicar_imoveis_mg&maxFeatures=1&outputFormat=application/json",
  (j) => j.type === "FeatureCollection" && Array.isArray(j.features),
);

console.log("\n=== Fase 2 — Motor espacial ===\n");
console.log(
  "  INCRA: app usa GML2 (incra-wfs-gml-client.ts), não JSON — testar na execução Wave A",
);
await probeJson(
  "FUNAI TI WFS",
  "https://geoserver.funai.gov.br/geoserver/Funai/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=Funai:tis_poligonais_portarias&maxFeatures=1&outputFormat=application/json",
  (j) => j.type === "FeatureCollection",
);
await probeJson(
  "IPHAN PAMGIA ArcGIS",
  "https://pamgia.ibama.gov.br/server/rest/services/BasesSincronizadas/loc_sitios_arqueologicos_iphan_p/MapServer/0/query?where=1%3D1&outFields=identifica&returnGeometry=false&f=json&resultRecordCount=1",
  (j) => j.features?.length >= 0,
);
await probe(
  "MapBiomas Alerta WFS (capabilities XML)",
  "https://production.alerta.mapbiomas.org/geoserver/ows?service=WFS&version=1.0.0&request=GetCapabilities",
  async (r) => {
    if (!r.ok) return false;
    const text = await r.text();
    return text.includes("WFS_Capabilities") || text.includes("wfs:WFS_Capabilities");
  },
);

console.log("\n=== Fase 3 — Listas agente ===\n");
await probe(
  "MTE Lista Suja CSV",
  "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/areas-de-atuacao/combate-ao-trabalho-escravo-e-analogo-ao-de-escravo/cadastro_de_empregadores.csv",
  (r) => r.ok,
  {
    Accept: "text/csv, text/plain, */*",
    "User-Agent": "AmbientaR/1.0 (consultoria ambiental; lista MTE)",
  },
);
await probeJson(
  "IBAMA embargos ArcGIS",
  "https://pamgia.ibama.gov.br/server/rest/services/01_Publicacoes_Bases/embargos_siscom_brasil/FeatureServer/2/query?where=1%3D1&outFields=cpf_cnpj_i&returnGeometry=false&f=json&resultRecordCount=1",
  (j) => j.features?.length >= 0,
);
await probeJson(
  "ICMBio embargos WFS CQL",
  "https://geoservicos.inde.gov.br/geoserver/ICMBio/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ICMBio:embargos_icmbio&CQL_FILTER=cpf_cnpj%20LIKE%20%2701914517970%27&maxFeatures=1&outputFormat=application/json",
  (j) => j.type === "FeatureCollection",
);

console.log("\n=== Fase 4/5 — testes unitários ===\n");
console.log("  Rode: npm run debug:socioambiental:units");

console.log("\n=== Concluído ===\n");
