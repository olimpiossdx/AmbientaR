import buffer from "@turf/buffer";
import center from "@turf/center";
import type { Feature, FeatureCollection } from "geojson";
import { featureCollection } from "@turf/helpers";
import {
  resolveLayerGeometry,
  synthAppFromHydro,
  synthConfrontantes,
  synthRlGlebas,
} from "../geometry-build";
import { getAgentDef } from "../registry";
import { emptyFc, isValidPerimeter, perimeterAreaHa, toFeatureCollection } from "../perimeter";
import { buildAppTable, buildRlTable, buildUsoTable, extractRlRowsFromLayers, fcAreaHa } from "../tables";
import { topologyScoreFromLayers } from "../topology/basic-checks";
import type { McaAgentContext, McaAgentResult } from "../types";

export type AgentHandler = (ctx: McaAgentContext) => Promise<McaAgentResult>;

function ok(
  agentId: string,
  layerKey: string,
  geojson?: FeatureCollection,
  meta?: Record<string, unknown>,
  score = 8,
): McaAgentResult {
  return { agentId, status: "pass", layerKey, geojson, meta, score };
}

function passMeta(agentId: string, meta: Record<string, unknown>, score = 9): McaAgentResult {
  return { agentId, status: "pass", meta, score };
}

function getPerimeterFc(ctx: McaAgentContext): FeatureCollection {
  const existing = ctx.layers.get("BASE_PERIMETRO");
  if (existing?.features?.length) return existing;
  const fc = toFeatureCollection(ctx.project.perimeterGeoJson);
  return fc ?? emptyFc();
}

const handlers: Record<string, AgentHandler> = {};

handlers.MCA_Ingest_Perimeter = async (ctx) => {
  const fc = toFeatureCollection(ctx.project.perimeterGeoJson);
  if (!fc) {
    return { agentId: "MCA_Ingest_Perimeter", status: "fail", message: "Sem perímetro." };
  }
  ctx.layers.set("BASE_PERIMETRO", fc);
  return ok("MCA_Ingest_Perimeter", "BASE_PERIMETRO", fc, {
    areaHa: perimeterAreaHa(fc),
  });
};

handlers.MCA_Ingest_KML_SHP = handlers.MCA_Ingest_Perimeter;

handlers.MCA_CRS_SIRGAS_UTM = async (ctx) => {
  const crs = ctx.project.meta.crs ?? "EPSG:31983";
  const valid = crs.startsWith("EPSG:");
  return valid
    ? passMeta("MCA_CRS_SIRGAS_UTM", { crs })
    : { agentId: "MCA_CRS_SIRGAS_UTM", status: "fail", message: "CRS inválido." };
};

handlers.MCA_QA_Topology = async (ctx) => {
  const valid = isValidPerimeter(ctx.project.perimeterGeoJson);
  return valid
    ? passMeta("MCA_QA_Topology", { valid: true }, 10)
    : { agentId: "MCA_QA_Topology", status: "fail", message: "Perímetro inválido." };
};

handlers.MCA_Learn_DWG_Ingest = async (ctx) => {
  const path = ctx.project.dwgGcsPath;
  const imported = ctx.project.meta.importedLayerKeys ?? [];
  const fromFirestore = [...ctx.layers.keys()].filter(
    (k) => !["BASE_PERIMETRO", "FUND_LIMITE"].includes(k),
  );
  const catalog = imported.length ? imported : fromFirestore;
  const hasLayers = catalog.length > 0;
  if (hasLayers) {
    return passMeta("MCA_Learn_DWG_Ingest", {
      dwgGcsPath: path ?? null,
      dwgFileName: ctx.project.meta.dwgFileName ?? null,
      dwgConvertedAt: ctx.project.meta.dwgConvertedAt ?? null,
      imported: true,
      layerCount: catalog.length,
      layerCatalog: catalog.slice(0, 40),
    });
  }
  return passMeta("MCA_Learn_DWG_Ingest", {
    dwgGcsPath: path ?? null,
    dwgFileName: ctx.project.meta.dwgFileName ?? null,
    imported: Boolean(path),
    layerCatalog: path
      ? ["Extrair layers DWG (ogr2ogr ou worker) ou importar GeoJSON"]
      : [],
  });
};

handlers.MCA_Fund_Limite_Propriedade = async (ctx) => {
  const fc = getPerimeterFc(ctx);
  ctx.layers.set("FUND_LIMITE", fc);
  return ok("MCA_Fund_Limite_Propriedade", "FUND_LIMITE", fc);
};

handlers.MCA_Fund_Limite_Matricula = async (ctx) => {
  const base = getPerimeterFc(ctx);
  const mats = ctx.project.meta.matriculas ?? [];
  const features: Feature[] = base.features.map((f, i) => ({
    ...f,
    properties: {
      ...f.properties,
      matricula: mats[i] ?? `M-${i + 1}`,
      class: "LIMITE_MATRICULA",
    },
  }));
  const fc = featureCollection(features);
  ctx.layers.set("FUND_MATRICULA", fc);
  return ok("MCA_Fund_Limite_Matricula", "FUND_MATRICULA", fc, { count: mats.length || 1 });
};

handlers.MCA_Fund_Label_Matricula = async (ctx) =>
  passMeta("MCA_Fund_Label_Matricula", {
    labels: (ctx.project.meta.matriculas ?? []).map((m) => ({ text: m })),
  });

handlers.MCA_Fund_Quadro_Matriculas = async (ctx) =>
  passMeta("MCA_Fund_Quadro_Matriculas", {
    matriculas: ctx.project.meta.matriculas ?? [],
  });

handlers.MCA_Fund_Confrontante_Label = async (ctx) => {
  const fc = resolveLayerGeometry(ctx, "FUND_CONFRONTANTE", () => synthConfrontantes(ctx));
  return ok("MCA_Fund_Confrontante_Label", "FUND_CONFRONTANTE", fc, {
    segments: fc.features.length,
  });
};

handlers.MCA_Fund_CAR_Metadata = async (ctx) =>
  passMeta("MCA_Fund_CAR_Metadata", { car: ctx.project.meta.car ?? "" });

handlers.MCA_Fund_Area_Total = async (ctx) => {
  const ha = ctx.project.meta.areaTotalHa ?? perimeterAreaHa(getPerimeterFc(ctx));
  return passMeta("MCA_Fund_Area_Total", { areaTotalHa: ha });
};

handlers.MCA_Base_Satellite = async (ctx) =>
  passMeta("MCA_Base_Satellite", {
    basemap: "Esri World Imagery",
    note: "Basemap via Leaflet na UI; raster no PDF final (QGIS v3).",
  });

function hydroAgent(ctx: McaAgentContext, agentId: string, layerKey: string): McaAgentResult {
  const fc = resolveLayerGeometry(ctx, layerKey, () => emptyFc());
  return ok(agentId, layerKey, fc, {
    featureCount: fc.features.length,
    nome: (fc.features[0]?.properties?.nome as string) ?? layerKey,
  });
}

handlers.MCA_Hydro_Ribeirao = async (ctx) => hydroAgent(ctx, "MCA_Hydro_Ribeirao", "HYD_RIBEIRAO");
handlers.MCA_Hydro_Corrego = async (ctx) => hydroAgent(ctx, "MCA_Hydro_Corrego", "HYD_CORREGO");
handlers.MCA_Hydro_Vereda_Nome = async (ctx) => hydroAgent(ctx, "MCA_Hydro_Vereda_Nome", "HYD_VEREDA");
handlers.MCA_Hydro_Grota = async (ctx) => hydroAgent(ctx, "MCA_Hydro_Grota", "HYD_GROTA");
handlers.MCA_Hydro_Barragem = async (ctx) => ok("MCA_Hydro_Barragem", "HYD_BARRAGEM", emptyFc());
handlers.MCA_Hydro_Cascaleira = async (ctx) => ok("MCA_Hydro_Cascaleira", "HYD_CASCALEIRA", emptyFc());
handlers.MCA_Hydro_Lagoa = async (ctx) => ok("MCA_Hydro_Lagoa", "HYD_LAGOA", emptyFc());
handlers.MCA_Hydro_Label_Generico = async (ctx) => passMeta("MCA_Hydro_Label_Generico", {});

function usoAgent(ctx: McaAgentContext, agentId: string, layerKey: string, label: string): McaAgentResult {
  const fc = resolveLayerGeometry(ctx, layerKey, () => emptyFc());
  return ok(agentId, layerKey, fc, {
    classe: label,
    areaHa: fcAreaHa(fc),
  });
}

handlers.MCA_Uso_Lavoura = async (ctx) => usoAgent(ctx, "MCA_Uso_Lavoura", "USO_LAVOURA", "Lavoura");
handlers.MCA_Uso_Pasto = async (ctx) => usoAgent(ctx, "MCA_Uso_Pasto", "USO_PASTO", "Pasto");
handlers.MCA_Uso_Eucalipto = async (ctx) => usoAgent(ctx, "MCA_Uso_Eucalipto", "USO_EUCALIPTO", "Eucalipto");
handlers.MCA_Uso_Pivo = async (ctx) => usoAgent(ctx, "MCA_Uso_Pivo", "USO_PIVO", "Pivô");
handlers.MCA_Uso_Vereda_Poligono = async (ctx) => usoAgent(ctx, "MCA_Uso_Vereda_Poligono", "USO_VEREDA", "Vereda");

handlers.MCA_Uso_IA_Prior_MapBiomas = async (ctx) =>
  passMeta("MCA_Uso_IA_Prior_MapBiomas", { enabled: false, note: "Integração MapBiomas — v4." });

handlers.MCA_Uso_Segment_SAM = async (ctx) =>
  passMeta("MCA_Uso_Segment_SAM", { enabled: false, note: "Segmentação SAM — v4." });

handlers.MCA_Tile_Splitter = async (ctx) => passMeta("MCA_Tile_Splitter", { tiles: 0 });

handlers.MCA_Uso_Area_Label = async (ctx) =>
  passMeta("MCA_Uso_Area_Label", { format: "Classe\\nXX,XXXX ha" });

handlers.MCA_Uso_Tabela_Resumo = async (ctx) => {
  const total = ctx.project.meta.areaTotalHa ?? perimeterAreaHa(getPerimeterFc(ctx));
  const rows = buildUsoTable(ctx.layers, total);
  return passMeta("MCA_Uso_Tabela_Resumo", { table: rows });
};

handlers.MCA_Uso_Legend_Group = async (ctx) => passMeta("MCA_Uso_Legend_Group", {});

handlers.MCA_APP_Buffer_From_Hydro = async (ctx) => {
  const perim = getPerimeterFc(ctx);
  const feat = perim.features[0];
  let fc = synthAppFromHydro(ctx, 0.03);
  if (!fc.features.length && feat?.geometry) {
    try {
      const buf = buffer(feat, 0.03, { units: "kilometers" });
      fc = featureCollection(buf ? [buf] : []);
    } catch {
      fc = emptyFc();
    }
  }
  ctx.layers.set("AMB_APP_BUFFER", fc);
  return ok("MCA_APP_Buffer_From_Hydro", "AMB_APP_BUFFER", fc, { areaHa: fcAreaHa(fc) });
};

handlers.MCA_APP_Polygon = async (ctx) => {
  const buf = ctx.layers.get("AMB_APP_BUFFER") ?? synthAppFromHydro(ctx);
  ctx.layers.set("AMB_APP", buf);
  return ok("MCA_APP_Polygon", "AMB_APP", buf, { areaHa: fcAreaHa(buf) });
};

handlers.MCA_APP_Area_Label = async (ctx) => passMeta("MCA_APP_Area_Label", {});
handlers.MCA_APP_Tabela = async (ctx) => {
  const table = buildAppTable(ctx.layers);
  return passMeta("MCA_APP_Tabela", { table });
};

handlers.MCA_RL_Gleba_Polygon = async (ctx) => {
  const fc = resolveLayerGeometry(ctx, "AMB_RL_GLEBA", () => synthRlGlebas(ctx));
  const rlRows = extractRlRowsFromLayers(ctx.layers, ctx.project.meta.matriculas);
  return ok("MCA_RL_Gleba_Polygon", "AMB_RL_GLEBA", fc, { rlRows, glebaCount: fc.features.length });
};

handlers.MCA_RL_Compensada_Flag = async (ctx) => {
  const rl = extractRlRowsFromLayers(ctx.layers, ctx.project.meta.matriculas);
  return passMeta("MCA_RL_Compensada_Flag", {
    compensada: rl.some((r) => r.compensada),
  });
};

handlers.MCA_RL_Matricula_Gleba_Label = async (ctx) =>
  passMeta("MCA_RL_Matricula_Gleba_Label", {
    labels: extractRlRowsFromLayers(ctx.layers, ctx.project.meta.matriculas),
  });

handlers.MCA_RL_Tabela_Detalhada = async (ctx) => {
  const rl = buildRlTable(extractRlRowsFromLayers(ctx.layers, ctx.project.meta.matriculas));
  return passMeta("MCA_RL_Tabela_Detalhada", { table: rl });
};
handlers.MCA_RL_Legend_Block = async (ctx) => passMeta("MCA_RL_Legend_Block", {});

handlers.MCA_Infra_Sede = async (ctx) => {
  const fc = resolveLayerGeometry(ctx, "INFRA_SEDE", () => emptyFc());
  return ok("MCA_Infra_Sede", "INFRA_SEDE", fc);
};
handlers.MCA_Infra_Patio = async (ctx) => {
  const fc = resolveLayerGeometry(ctx, "INFRA_PATIO", () => emptyFc());
  return ok("MCA_Infra_Patio", "INFRA_PATIO", fc);
};
handlers.MCA_Infra_Curral = async (ctx) => ok("MCA_Infra_Curral", "INFRA_CURRAL", emptyFc());
handlers.MCA_Infra_Silos = async (ctx) => {
  const fc = resolveLayerGeometry(ctx, "INFRA_SILOS", () => emptyFc());
  return ok("MCA_Infra_Silos", "INFRA_SILOS", fc);
};
handlers.MCA_Infra_Pista_Pouso = async (ctx) => ok("MCA_Infra_Pista_Pouso", "INFRA_PISTA", emptyFc());
handlers.MCA_Infra_Usina_Solar = async (ctx) => ok("MCA_Infra_Usina_Solar", "INFRA_USINA", emptyFc());
handlers.MCA_Infra_Piscinao = async (ctx) => ok("MCA_Infra_Piscinao", "INFRA_PISCINAO", emptyFc());
handlers.MCA_Infra_Rede_Eletrica = async (ctx) => {
  const fc = ctx.layers.get("INFRA_REDE") ?? emptyFc();
  return ok("MCA_Infra_Rede_Eletrica", "INFRA_REDE", fc);
};

handlers.MCA_Amb_DAIA_Corretiva = async (ctx) => ok("MCA_Amb_DAIA_Corretiva", "AMB_DAIA", emptyFc());
handlers.MCA_Ctx_Compensacao_Florestal = async (ctx) =>
  passMeta("MCA_Ctx_Compensacao_Florestal", { text: ctx.project.meta.compensacaoSei ?? "" });
handlers.MCA_Ctx_Rodovia = async (ctx) => ok("MCA_Ctx_Rodovia", "CTX_RODOVIA", emptyFc());

const layoutFields = [
  "MCA_Layout_Title_Uso_Ocupacao",
  "MCA_Layout_Info_Gerais",
  "MCA_Layout_Coordenadas_Sede",
  "MCA_Layout_Carimbo_CREA",
  "MCA_Layout_Logo_Consultoria",
  "MCA_Layout_Assinaturas",
  "MCA_Layout_North_Arrow",
  "MCA_Layout_Scale_Bar",
  "MCA_Layout_UTM_Grid",
  "MCA_Layout_Inset_Localizacao",
  "MCA_Layout_Folha_Numero",
] as const;

for (const id of layoutFields) {
  handlers[id] = async (ctx) => {
    const c = centerFromPerimeter(ctx);
    return passMeta(id, {
      layoutFragment: id,
      ...(c ? { sedeLon: c[0], sedeLat: c[1] } : {}),
    });
  };
}

function centerFromPerimeter(ctx: McaAgentContext): [number, number] | null {
  const fc = getPerimeterFc(ctx);
  if (!fc.features.length) return null;
  try {
    const c = center(fc);
    return c.geometry.coordinates as [number, number];
  } catch {
    return null;
  }
}

handlers.MCA_Layout_Export_PDF = async (ctx) =>
  passMeta("MCA_Layout_Export_PDF", {
    ready: true,
    title: "Uso e Ocupação do Solo",
    mapPanel: ctx.layers.size > 0 || Boolean(ctx.project.perimeterGeoJson),
    cartouche: Boolean(ctx.project.meta.crea ?? ctx.project.meta.technicalResponsible),
    layerCount: ctx.layers.size,
  });

handlers.MCA_Conflict_Merger = async (ctx) => {
  const conflicts: string[] = [];
  const appHa = fcAreaHa(ctx.layers.get("AMB_APP"));
  const usoHa =
    fcAreaHa(ctx.layers.get("USO_LAVOURA")) + fcAreaHa(ctx.layers.get("USO_PIVO"));
  if (appHa > 0 && usoHa > 0) {
    conflicts.push("Revisar sobreposição APP vs uso (detecção automática).");
  }
  return passMeta("MCA_Conflict_Merger", { conflicts });
};

handlers.MCA_Score_Aggregator = async (ctx) => {
  const geometric = isValidPerimeter(ctx.project.perimeterGeoJson) ? 9 : 4;
  const topological = topologyScoreFromLayers(ctx.layers);
  const usoHa = buildUsoTable(
    ctx.layers,
    ctx.project.meta.areaTotalHa ?? 0,
  ).reduce((s, r) => s + r.areaHa, 0);
  const environmental = usoHa > 0 && fcAreaHa(ctx.layers.get("AMB_APP")) > 0 ? 8 : 4;
  const visual = ctx.project.layoutMeta ? 7 : 5;
  const semantic = (ctx.project.meta.matriculas?.length ?? 0) > 0 ? 8 : 5;
  const final =
    geometric * 0.25 +
    topological * 0.2 +
    environmental * 0.2 +
    visual * 0.2 +
    semantic * 0.15;
  return passMeta("MCA_Score_Aggregator", {
    geometric,
    topological,
    environmental,
    visual,
    semantic,
    ia: 6,
    final,
  });
};

handlers.MCA_QA_Visual_Fidelity = async (ctx) =>
  passMeta("MCA_QA_Visual_Fidelity", { note: "Diff visual vs PDF referência — revisão humana / gold v4." });

handlers.MCA_CAD_Layer_Export = async (ctx) =>
  passMeta("MCA_CAD_Layer_Export", { layers: [...ctx.layers.keys()] });
handlers.MCA_CAD_DWG_2010 = async (ctx) =>
  passMeta("MCA_CAD_DWG_2010", {
    format: "DWG2010",
    dwgGcsPath: ctx.project.dwgGcsPath ?? null,
  });
handlers.MCA_CAD_QGZ_Project = async (ctx) =>
  passMeta("MCA_CAD_QGZ_Project", { format: "QGZ" });

handlers.MCA_Orchestrator_Master = async () =>
  passMeta("MCA_Orchestrator_Master", { ok: true });
handlers.MCA_DAG_Resolver = async () => passMeta("MCA_DAG_Resolver", { ok: true });

export const agentHandlers: Record<string, AgentHandler> = handlers;

export function ensureHandler(agentId: string): boolean {
  return Boolean(agentHandlers[agentId] || getAgentDef(agentId));
}
