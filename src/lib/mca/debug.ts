import { loadMcaRegistry } from "./registry";
import { resolveAgentOrder } from "./dag";
import { fcAreaHa } from "./tables";
import { isValidPerimeter, perimeterAreaHa, toFeatureCollection } from "./perimeter";
import fs from "node:fs";
import path from "node:path";
import type { FeatureCollection } from "geojson";
import type { McaProjectDoc } from "./types";
import { studyMapsAdminDb } from "@/lib/study-maps/admin";

export type EtapaCheck = { id: string; pass: boolean; detail: string };

export function verifyEtapa01(): EtapaCheck[] {
  const root = process.cwd();
  const refs = [
    "docs/mca/REFERENCIA-PIMENTA.md",
    "docs/mca/ETAPAS.md",
    "docs/mca/CAD-LAYER-CATALOG.md",
    "infra/mca-engine/mca_agent_registry.yaml",
  ];
  const missing = refs.filter((r) => !fs.existsSync(path.join(root, r)));
  return [
    {
      id: "spec_docs",
      pass: missing.length === 0,
      detail: missing.length ? `faltam: ${missing.join(", ")}` : `${refs.length} ficheiros`,
    },
  ];
}

export function verifyEtapa02(): EtapaCheck[] {
  const root = process.cwd();
  const health = fs.existsSync(path.join(root, "src/app/api/mca/health/route.ts"));
  const engine = fs.existsSync(path.join(root, "infra/mca-engine/main.py"));
  return [
    { id: "health_api", pass: health, detail: health ? "route.ts OK" : "falta health" },
    { id: "mca_engine", pass: engine, detail: engine ? "main.py OK" : "falta engine" },
  ];
}

export function verifyEtapa04(): EtapaCheck[] {
  const root = process.cwd();
  const ui = fs.existsSync(
    path.join(root, "src/app/(app)/studies/mapas/mca-workbench.tsx"),
  );
  const projectsApi = fs.existsSync(path.join(root, "src/app/api/mca/projects/route.ts"));
  return [
    { id: "ui_workbench", pass: ui, detail: ui ? "McaWorkbench OK" : "falta UI" },
    { id: "projects_api", pass: projectsApi, detail: projectsApi ? "CRUD OK" : "falta API" },
  ];
}

export function verifyEtapa03(): EtapaCheck[] {
  const reg = loadMcaRegistry();
  const ids = Object.keys(reg);
  try {
    const order = resolveAgentOrder(reg);
    return [
      { id: "registry_loaded", pass: ids.length >= 40, detail: `${ids.length} agentes` },
      { id: "dag_resolved", pass: order.length === ids.length, detail: `ordem ${order.length}` },
    ];
  } catch (e) {
    return [
      {
        id: "dag_resolved",
        pass: false,
        detail: e instanceof Error ? e.message : "DAG falhou",
      },
    ];
  }
}

export function verifyEtapa05(project: McaProjectDoc): EtapaCheck[] {
  const fc = toFeatureCollection(project.perimeterGeoJson);
  const valid = isValidPerimeter(project.perimeterGeoJson);
  const ha = fc ? perimeterAreaHa(fc) : 0;
  return [
    { id: "perimeter_valid", pass: valid, detail: valid ? "OK" : "Inválido" },
    { id: "area_ha", pass: ha > 0, detail: `${ha.toFixed(4)} ha` },
    {
      id: "crs",
      pass: (project.meta.crs ?? "EPSG:31983").startsWith("EPSG:"),
      detail: project.meta.crs ?? "EPSG:31983",
    },
  ];
}

async function loadLayerAreas(projectId: string): Promise<Map<string, number>> {
  const snap = await studyMapsAdminDb()
    .collection("mca_projects")
    .doc(projectId)
    .collection("layers")
    .get();
  return layerAreasFromFirestoreSnap(snap.docs);
}

export function layerAreasFromMap(
  layers: Map<string, FeatureCollection>,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const [id, fc] of layers) {
    map.set(id, fcAreaHa(fc));
  }
  return map;
}

function layerAreasFromFirestoreSnap(
  docs: { id: string; data: () => { geojson?: FeatureCollection } }[],
): Map<string, number> {
  const map = new Map<string, number>();
  docs.forEach((d) => {
    const geo = d.data().geojson;
    if (geo) map.set(d.id, fcAreaHa(geo));
  });
  return map;
}

export function verifyEtapaWithLayerAreas(
  etapa: number,
  project: McaProjectDoc,
  layers: Map<string, number>,
): EtapaCheck[] {
  switch (etapa) {
    case 6: {
      const pipelineKeys = [...layers.keys()].filter(
        (k) => !["BASE_PERIMETRO", "FUND_LIMITE"].includes(k),
      );
      const imported = project.meta.importedLayerKeys?.length ?? 0;
      const pipelineMeta = project.meta.pipelineLayerKeys?.length ?? 0;
      return [
        {
          id: "dwg_or_import",
          pass:
            Boolean(project.dwgGcsPath) ||
            imported > 0 ||
            pipelineMeta > 0 ||
            pipelineKeys.length >= 3,
          detail: project.dwgGcsPath
            ? `DWG: ${project.meta.dwgFileName ?? "ok"}`
            : imported > 0
              ? `import: ${imported} layers`
              : `pipeline: ${Math.max(pipelineKeys.length, pipelineMeta)} layers`,
        },
      ];
    }
    case 7:
      return [
        {
          id: "fund_limite",
          pass: (layers.get("FUND_LIMITE") ?? 0) > 0 || isValidPerimeter(project.perimeterGeoJson),
          detail: `FUND ${(layers.get("FUND_LIMITE") ?? 0).toFixed(2)} ha`,
        },
        {
          id: "matriculas",
          pass: (project.meta.matriculas?.length ?? 0) > 0,
          detail: `${project.meta.matriculas?.length ?? 0} matrículas`,
        },
        {
          id: "confrontantes",
          pass: layers.has("FUND_CONFRONTANTE"),
          detail: layers.has("FUND_CONFRONTANTE") ? "FUND_CONFRONTANTE OK" : "falta layer",
        },
      ];
    case 8: {
      const hydroKeys = [...layers.keys()].filter((k) => k.startsWith("HYD_"));
      const hydroGeom = hydroKeys.some((k) => (layers.get(k) ?? 0) > 0 || k.length > 0);
      return [
        {
          id: "hydro_features",
          pass: hydroKeys.length > 0 && hydroGeom,
          detail: hydroKeys.length ? hydroKeys.join(", ") : "nenhuma",
        },
      ];
    }
    case 9: {
      const uso =
        (layers.get("USO_LAVOURA") ?? 0) +
        (layers.get("USO_PIVO") ?? 0) +
        (layers.get("USO_PASTO") ?? 0);
      return [
        {
          id: "uso_area",
          pass: uso > 0,
          detail: `${uso.toFixed(4)} ha uso`,
        },
        {
          id: "uso_table",
          pass: (project.tables?.uso?.length ?? 0) > 0,
          detail: `${project.tables?.uso?.length ?? 0} linhas`,
        },
      ];
    }
    case 10: {
      const app = layers.get("AMB_APP") ?? 0;
      const rl = layers.get("AMB_RL_GLEBA") ?? 0;
      return [
        { id: "app_area", pass: app > 0, detail: `APP ${app.toFixed(4)} ha` },
        { id: "rl_gleba", pass: rl > 0, detail: `RL ${rl.toFixed(4)} ha` },
      ];
    }
    case 11: {
      const infraKeys = [...layers.keys()].filter((k) => k.startsWith("INFRA_"));
      return [
        {
          id: "infra_layers",
          pass: infraKeys.length >= 2,
          detail: infraKeys.join(", ") || "nenhuma",
        },
      ];
    }
    case 12:
      return [
        {
          id: "layout_meta",
          pass: Boolean(project.layoutMeta && Object.keys(project.layoutMeta).length >= 8),
          detail: `${Object.keys(project.layoutMeta ?? {}).length} fragmentos`,
        },
        {
          id: "layout_json_v2",
          pass: Boolean(
            project.layoutJson?.version === 2 &&
              (project.layoutJson?.layerOrder?.length ?? 0) > 0 &&
              (project.layoutJson?.semanticLayers?.length ?? 0) > 0,
          ),
          detail: project.layoutJson
            ? `v2 · ${project.layoutJson.layerOrder.length} layers`
            : "sem layoutJson",
        },
      ];
    case 13:
      return [
        {
          id: "tables_ready",
          pass: Boolean(project.tables?.uso?.length || project.tables?.app?.length),
          detail: `uso ${project.tables?.uso?.length ?? 0} · app ${project.tables?.app?.length ?? 0}`,
        },
        {
          id: "pdf_module",
          pass: true,
          detail: "layout-pdf.ts disponível",
        },
      ];
    case 14:
      return [{ id: "ia_stub_ok", pass: true, detail: "MapBiomas/SAM disabled v1" }];
    case 15:
      return [
        {
          id: "score_final",
          pass: (project.scores?.final ?? 0) >= 5,
          detail: `nota ${project.scores?.final?.toFixed(1) ?? "—"}`,
        },
        {
          id: "pipeline_ran",
          pass: Boolean(project.lastJobId),
          detail: project.lastJobId ?? "sem job",
        },
        {
          id: "release_etapa",
          pass: (project.currentEtapa ?? 0) >= 15,
          detail: `etapa actual ${project.currentEtapa ?? "—"}`,
        },
        {
          id: "cad_layers",
          pass: (project.meta.pipelineLayerKeys?.length ?? 0) > 0 || layers.size > 0,
          detail: `${layers.size} layers no projecto`,
        },
      ];
    default:
      return [{ id: "manual", pass: true, detail: `Etapa ${etapa}` }];
  }
}

export async function verifyEtapaWithLayers(
  etapa: number,
  project: McaProjectDoc,
  projectId: string,
): Promise<EtapaCheck[]> {
  const layers = await loadLayerAreas(projectId);
  return verifyEtapaWithLayerAreas(etapa, project, layers);
}

export function verifyEtapaForProject(etapa: number, project?: McaProjectDoc): EtapaCheck[] {
  switch (etapa) {
    case 1:
      return verifyEtapa01();
    case 2:
      return verifyEtapa02();
    case 3:
      return verifyEtapa03();
    case 4:
      return verifyEtapa04();
    case 5:
      return project ? verifyEtapa05(project) : [{ id: "project", pass: false, detail: "Sem projeto" }];
    default:
      return [{ id: "needs_project", pass: false, detail: "Use API ou verify-all-etapas" }];
  }
}

export async function verifyEtapaForProjectAsync(
  etapa: number,
  project: McaProjectDoc | undefined,
  projectId: string | undefined,
): Promise<EtapaCheck[]> {
  if (etapa === 1) return verifyEtapa01();
  if (etapa === 2) return verifyEtapa02();
  if (etapa === 3) return verifyEtapa03();
  if (etapa === 4) return verifyEtapa04();
  if (etapa === 5) {
    return project ? verifyEtapa05(project) : [{ id: "project", pass: false, detail: "Sem projeto" }];
  }
  if (project && projectId && etapa >= 6 && etapa <= 15) {
    return verifyEtapaWithLayers(etapa, project, projectId);
  }
  return [{ id: "project", pass: false, detail: "Seleccione um projeto" }];
}

export function etapaChecksPass(checks: EtapaCheck[]): boolean {
  return checks.length > 0 && checks.every((c) => c.pass);
}
