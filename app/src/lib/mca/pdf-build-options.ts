import { loadMcaProjectLayers } from "./load-project-layers";
import {
  fetchMcaConsultancyBranding,
  fetchMcaOptionalBrandingImages,
} from "./company-branding-server";
import type { McaLayoutPdfOptions } from "./layout-pdf";
import type { FeatureCollection } from "geojson";

/** Carrega layers + branding para buildMcaLayoutPdf (APIs servidor). */
export async function loadMcaPdfBuildOptions(
  projectId: string,
): Promise<McaLayoutPdfOptions> {
  const [layersMap, branding, brandingImages] = await Promise.all([
    loadMcaProjectLayers(projectId),
    fetchMcaConsultancyBranding(),
    fetchMcaOptionalBrandingImages(),
  ]);

  const layers: Record<string, FeatureCollection> = {};
  for (const [k, v] of Object.entries(layersMap)) {
    if (v?.features?.length) layers[k] = v;
  }

  return {
    layers,
    branding,
    brandingImages,
  };
}
