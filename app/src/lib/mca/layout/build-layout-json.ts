import type { FeatureCollection } from "geojson";
import bbox from "@turf/bbox";
import { geojsonChecksum } from "../checksum";
import { fcAreaHa } from "../tables";
import type { McaProjectDoc } from "../types";
import type {
  McaCartographicView,
  McaLayoutJson,
  McaSpatialLayer,
} from "../types-v2";
import { knowledgeUpstream } from "../knowledge/relations";
import { resolveScaleProfile } from "../scale/scale-manager";
import {
  buildSemanticLayer,
  legendGroupForTaxonomy,
  taxonomyForLayerKey,
} from "../semantic/layer-taxonomy";
import {
  sortLayerKeys,
  styleProfileFor,
  zIndexFor,
} from "../symbols/style-profiles";
import { assessTopology } from "../topology/basic-checks";

export function buildLayoutJson(
  project: McaProjectDoc,
  layers: Map<string, FeatureCollection>,
): McaLayoutJson {
  const m = project.meta;
  const scaleProfile = resolveScaleProfile(m.scale);
  const scale = m.scale ?? scaleProfile.scale;
  const scaleDenominator = scaleProfile.scaleDenominator;
  const layerKeys = sortLayerKeys(
    [...layers.keys()].filter((k) => layers.get(k)?.features?.length),
  );

  let mainExtent: [number, number, number, number] | undefined;
  const perim = layers.get("BASE_PERIMETRO") ?? layers.get("FUND_LIMITE");
  if (perim?.features?.length) {
    const b = bbox(perim);
    if (b.every(Number.isFinite)) mainExtent = b as [number, number, number, number];
  }

  const semanticLayers = layerKeys.map((key) => {
    const upstream = knowledgeUpstream(key);
    return buildSemanticLayer(key, {
      origin: project.meta.importedLayerKeys?.includes(key) ? "import" : "pipeline",
      derivedFrom: upstream.length ? upstream : undefined,
    });
  });

  const spatialLayers: McaSpatialLayer[] = layerKeys.map((key) => {
    const fc = layers.get(key)!;
    return {
      spatialId: key,
      geometryRef: `firestore:mca_projects/{id}/layers/${key}`,
      checksum: geojsonChecksum(fc),
      topologyStatus: assessTopology(fc),
      sourceAgentId: key,
      areaHa: fcAreaHa(fc),
      layerState: "promoted",
    };
  });

  const cartographicViews: McaCartographicView[] = layerKeys.map((key) => ({
    viewId: `${key}_view`,
    spatialRef: key,
    scaleDenominator,
    templateId: m.templateId ?? "pimenta_uso_ocupacao",
    styleProfile: styleProfileFor(key),
    zIndex: zIndexFor(key),
  }));

  const legend = layerKeys.map((key) => {
    const tax = taxonomyForLayerKey(key);
    return {
      layerKey: key,
      label: key.replace(/_/g, " "),
      group: legendGroupForTaxonomy(tax),
    };
  });

  return {
    version: 2,
    templateId: m.templateId ?? "pimenta_uso_ocupacao",
    title: "Uso e Ocupação do Solo",
    scale,
    scaleDenominator,
    crs: m.crs ?? "EPSG:31983",
    meta: {
      propertyName: m.propertyName,
      ownerName: m.ownerName,
      municipality: m.municipality,
      matriculas: m.matriculas,
      car: m.car,
      areaTotalHa: m.areaTotalHa,
      technicalResponsible: m.technicalResponsible,
      crea: m.crea,
    },
    frames: [
      { type: "main", extent: mainExtent, scale },
      { type: "inset", scale: scaleProfile.insetScale },
    ],
    layerOrder: layerKeys,
    legend,
    tables: {
      uso: project.tables?.uso ?? [],
      app: project.tables?.app ?? [],
      rl: project.tables?.rl ?? [],
    },
    northArrow: Boolean(project.layoutMeta?.MCA_Layout_North_Arrow ?? true),
    grid: { utm: Boolean(project.layoutMeta?.MCA_Layout_UTM_Grid ?? true) },
    inset: {
      scale: scaleProfile.insetScale,
      enabled: Boolean(project.layoutMeta?.MCA_Layout_Inset_Localizacao),
    },
    stamp: {
      crea: m.crea,
      technicalResponsible: m.technicalResponsible,
    },
    layoutFragments: project.layoutMeta ?? {},
    semanticLayers,
    spatialLayers,
    cartographicViews,
    generatedAt: new Date().toISOString(),
  };
}

export function layoutJsonChecksPass(layout: McaLayoutJson): boolean {
  return (
    layout.version === 2 &&
    layout.layerOrder.length > 0 &&
    layout.legend.length > 0 &&
    layout.semanticLayers.length > 0 &&
    layout.spatialLayers.length > 0 &&
    layout.cartographicViews.length > 0 &&
    Object.keys(layout.layoutFragments).length >= 8
  );
}
