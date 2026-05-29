import fs from "node:fs";
import path from "node:path";
import type { FeatureCollection } from "geojson";
import { runMcaAgent } from "./agents/run-agent";
import { buildGoldPerimeter, loadGoldPerimeterFromRepo } from "./gold-perimeters";
import { ensureProjectGeometry } from "./geometry-build";
import { parseLayersImportPayload } from "./layer-import";
import { loadMcaRegistry, listAgentsForEtapa } from "./registry";
import { resolveAgentOrder } from "./dag";
import { buildAppTable, buildRlTable, buildUsoTable, extractRlRowsFromLayers, fcAreaHa } from "./tables";
import { toFeatureCollection, perimeterAreaHa } from "./perimeter";
import { buildLayoutJson } from "./layout/build-layout-json";
import { loadGoldLayersFromRepo } from "./gold-cad-import";
import type { McaAgentContext, McaAgentRun, McaProjectDoc } from "./types";

export type OfflinePipelineResult = {
  project: McaProjectDoc;
  layers: Map<string, FeatureCollection>;
  runs: McaAgentRun[];
  jobId: string;
  layerAreas: Map<string, number>;
};

function loadDemoImportLayers(): Record<string, FeatureCollection> {
  const examplePath = path.join(
    process.cwd(),
    "public/mca/examples/layers-import-exemplo.json",
  );
  const raw = JSON.parse(fs.readFileSync(examplePath, "utf8"));
  return parseLayersImportPayload(raw);
}

/** Simula pipeline E05–E15 sem Firestore (gold Catingueiro + import demo E06). */
export async function runOfflinePipeline(): Promise<OfflinePipelineResult> {
  return runOfflinePipelineInternal({ useDemoImport: true });
}

/** Pipeline offline só com geometria sintética (sem import demo E06). */
export async function runOfflinePipelineSynthetic(): Promise<OfflinePipelineResult> {
  return runOfflinePipelineInternal({ useDemoImport: false });
}

async function runOfflinePipelineInternal(opts: {
  useDemoImport: boolean;
}): Promise<OfflinePipelineResult> {
  const perimeter = loadGoldPerimeterFromRepo("gold_catingueiro");
  const layers = new Map<string, FeatureCollection>();
  let importedKeys: string[] | undefined;

  if (opts.useDemoImport) {
    const goldLayers = loadGoldLayersFromRepo("gold_catingueiro");
    if (goldLayers && Object.keys(goldLayers).length) {
      importedKeys = Object.keys(goldLayers);
      for (const [key, fc] of Object.entries(goldLayers)) {
        if (fc.features?.length) layers.set(key, fc);
      }
    } else {
      const demoLayers = loadDemoImportLayers();
      importedKeys = Object.keys(demoLayers);
      for (const [key, fc] of Object.entries(demoLayers)) {
        if (fc.features?.length) layers.set(key, fc);
      }
    }
  }

  const project: McaProjectDoc = {
    uid: "offline-test",
    title: opts.useDemoImport ? "Catingueiro — offline" : "Catingueiro — sintético",
    meta: {
      propertyName: "Faz. Catingueiro",
      ownerName: "Célio Fontana",
      municipality: "Unaí-MG",
      matriculas: ["37.674", "37.671", "37.672", "37.663", "37.665", "37.664", "37.673"],
      car: "MG-demo",
      areaTotalHa: 2073.8318,
      scale: "1:17.000",
      crs: "EPSG:31983",
      goldPresetId: "gold_catingueiro",
      importedLayerKeys: importedKeys,
      crea: "144.093/D",
      technicalResponsible: "Elaine de Sales Fernandes",
    },
    perimeterGeoJson: perimeter,
    currentEtapa: 5,
    etapaStatus: {},
    layoutMeta: {},
  };

  const ctx: McaAgentContext = { project, layers, logs: [] };
  ensureProjectGeometry(ctx);

  const registry = loadMcaRegistry();
  const agentIds = listAgentsForEtapa(15, registry, 5).filter(
    (id) => !["MCA_Orchestrator_Master", "MCA_DAG_Resolver"].includes(id),
  );
  const order = resolveAgentOrder(registry, agentIds);
  const jobId = crypto.randomUUID();
  const runs: McaAgentRun[] = [];

  for (const agentId of order) {
    const started = Date.now();
    const result = await runMcaAgent(agentId, ctx);
    const durationMs = Date.now() - started;

    if (result.geojson && result.layerKey && result.geojson.features?.length) {
      ctx.layers.set(result.layerKey, result.geojson);
    }

    if (agentId.startsWith("MCA_Layout_")) {
      project.layoutMeta = {
        ...(project.layoutMeta ?? {}),
        [agentId]: result.meta ?? true,
      };
    }

    runs.push({
      agentId,
      status: result.status,
      message: result.message,
      durationMs,
      score: result.score,
    });
  }

  const perim = toFeatureCollection(project.perimeterGeoJson);
  const totalHa = project.meta.areaTotalHa ?? (perim ? perimeterAreaHa(perim) : 0);
  project.tables = {
    uso: buildUsoTable(ctx.layers, totalHa),
    app: buildAppTable(ctx.layers),
    rl: buildRlTable(extractRlRowsFromLayers(ctx.layers, project.meta.matriculas)),
  };

  const scoreResult = await runMcaAgent("MCA_Score_Aggregator", ctx);
  if (scoreResult.meta) {
    project.scores = {
      geometric: Number(scoreResult.meta.geometric) || 0,
      topological: Number(scoreResult.meta.topological) || 0,
      visual: Number(scoreResult.meta.visual) || 0,
      ia: Number(scoreResult.meta.ia) || 0,
      environmental: Number(scoreResult.meta.environmental) || 0,
      semantic: Number(scoreResult.meta.semantic) || 0,
      final: Number(scoreResult.meta.final) || 0,
    };
  }

  project.lastJobId = jobId;
  project.currentEtapa = 15;
  project.meta.pipelineLayerKeys = [...ctx.layers.keys()].filter(
    (k) => !["BASE_PERIMETRO", "FUND_LIMITE"].includes(k),
  );
  for (let e = 1; e <= 15; e++) {
    project.etapaStatus[String(e).padStart(2, "0")] = "pass";
  }

  project.layoutJson = buildLayoutJson(project, ctx.layers);

  const layerAreas = new Map<string, number>();
  for (const [key, fc] of ctx.layers) {
    layerAreas.set(key, fcAreaHa(fc));
  }

  return { project, layers: ctx.layers, runs, jobId, layerAreas };
}
