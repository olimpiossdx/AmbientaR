/**
 * Verifica fundação v3 (layer-ref, cache, tiles, export client).
 * Uso: npm run mca:verify-v3
 */
import {
  firestoreLayerRef,
  parseLayerRef,
  postgisLayerRef,
} from "../../src/lib/mca/spatial/layer-ref";
import { isPostGisConfigured } from "../../src/lib/mca/spatial/postgis-config";
import {
  cacheHitRatio,
  shouldReuseCachedLayer,
  spatialCacheKey,
} from "../../src/lib/mca/cache/spatial-cache";
import {
  MCA_TILE_THRESHOLD_HA,
  requiresTiledMode,
  resolveTileMode,
} from "../../src/lib/mca/tiles/tile-policy";
import { isQgisWorkerConfigured, checkQgisWorkerHealth } from "../../src/lib/mca/export/qgis-worker-client";
import { runOfflinePipeline } from "../../src/lib/mca/pipeline-offline";

async function main() {
  console.log("=== MCA verify-v3 (fundação enterprise) ===\n");

  const fsRef = firestoreLayerRef("proj1", "AMB_APP");
  const parsed = parseLayerRef(fsRef);
  if (!parsed || parsed.kind !== "firestore" || parsed.layerKey !== "AMB_APP") {
    console.error("FAIL layer-ref firestore");
    process.exit(1);
  }
  console.log(`PASS · layer-ref firestore: ${fsRef}`);

  const pgRef = postgisLayerRef("mca", "spatial_layers", "HYD_CORREGO");
  const pgParsed = parseLayerRef(pgRef);
  if (!pgParsed || pgParsed.kind !== "postgis") {
    console.error("FAIL layer-ref postgis");
    process.exit(1);
  }
  console.log(`PASS · layer-ref postgis: ${pgRef}`);

  const key = spatialCacheKey({
    agentId: "MCA_APP_Polygon",
    layerKey: "AMB_APP",
    checksum: "abc123",
  });
  if (!key.includes("MCA_APP_Polygon")) {
    console.error("FAIL spatial-cache key");
    process.exit(1);
  }
  if (!shouldReuseCachedLayer("abc123", "abc123")) {
    console.error("FAIL cache reuse same checksum");
    process.exit(1);
  }
  if (shouldReuseCachedLayer("abc123", "def456")) {
    console.error("FAIL cache miss different checksum");
    process.exit(1);
  }
  console.log(`PASS · spatial-cache: hit ratio ${cacheHitRatio(10, 3).toFixed(1)}`);

  if (resolveTileMode(200) !== "inline" || resolveTileMode(600) !== "tiled") {
    console.error("FAIL tile policy");
    process.exit(1);
  }
  if (!requiresTiledMode(MCA_TILE_THRESHOLD_HA + 1)) {
    console.error("FAIL tiled threshold");
    process.exit(1);
  }
  console.log(`PASS · tile policy: >${MCA_TILE_THRESHOLD_HA} ha → tiled`);

  if (isPostGisConfigured() && !process.env.MCA_POSTGIS_URL) {
    console.error("FAIL postgis false positive");
    process.exit(1);
  }
  console.log(`PASS · postgis configured: ${isPostGisConfigured()}`);

  const { project, layers } = await runOfflinePipeline();
  const areaHa = project.meta.areaTotalHa ?? 0;
  const mode = resolveTileMode(areaHa);
  console.log(`PASS · offline project tileMode=${mode} (${areaHa.toFixed(0)} ha)`);

  if (layers.size < 10) {
    console.error("FAIL offline layers for v3 export payload");
    process.exit(1);
  }
  console.log(`PASS · export payload: ${layers.size} layers`);

  if (isQgisWorkerConfigured()) {
    const ok = await checkQgisWorkerHealth();
    if (ok) {
      console.log("PASS · qgis worker health: ok");
    } else {
      console.warn("WARN · MCA_QGIS_WORKER_URL definido mas /health falhou — iniciar worker (Docker ou uvicorn)");
    }
  } else {
    console.log("INFO · qgis worker não configurado (fallback jsPDF em export-final)");
  }

  console.log("\n=== MCA verify-v3 PASS ===");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
