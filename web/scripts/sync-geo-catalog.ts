/**
 * P4 — Sincroniza metadados GeoNetwork com catálogo TS (relatório diff, sem auto-deploy).
 * Uso: npm run geo:sync-catalog
 */
import fs from "node:fs";
import path from "node:path";
import { SIG_MG_ALL_LAYERS } from "../src/lib/geospatial/wave-a-catalog";
import { searchGeoNetworkRecords } from "../src/lib/geospatial/geonetwork-client";

const KEYWORDS = ["zee", "outorga", "hidrografia", "bioma", "embargo", "florestal"];

async function main() {
  const catalogIds = new Set(SIG_MG_ALL_LAYERS.map((l) => l.layerId));
  const catalogTypeNames = new Set(
    SIG_MG_ALL_LAYERS.flatMap((l) => l.typeNames.map((t) => t.toLowerCase())),
  );

  const discovered: { keyword: string; records: Awaited<ReturnType<typeof searchGeoNetworkRecords>> }[] =
    [];

  for (const kw of KEYWORDS) {
    console.log(`GeoNetwork search: ${kw}…`);
    try {
      const records = await searchGeoNetworkRecords({ query: kw, size: 15 });
      discovered.push({ keyword: kw, records });
      console.log(`  ${records.length} registos`);
    } catch (e) {
      console.warn(`  falha: ${e instanceof Error ? e.message : e}`);
      discovered.push({ keyword: kw, records: [] });
    }
  }

  const allTitles = discovered.flatMap((d) => d.records);
  const maybeMissing = allTitles.filter((r) => {
    const t = (r.title ?? "").toLowerCase();
    return !Array.from(catalogTypeNames).some((cn) => t.includes(cn.replace("ide:", "")));
  });

  const report = {
    generatedAtUtc: new Date().toISOString(),
    catalogLayerCount: catalogIds.size,
    catalogTypeNameCount: catalogTypeNames.size,
    discoveredByKeyword: discovered,
    suggestionsReview: maybeMissing.slice(0, 30),
  };

  const outPath = path.join(
    process.cwd(),
    "docs/analise-ambiental-automatizada/geo-catalog-sync-report.json",
  );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`\nRelatório: ${outPath}`);
  console.log(`Sugestões para revisão humana: ${maybeMissing.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
