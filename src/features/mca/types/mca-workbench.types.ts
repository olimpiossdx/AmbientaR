import type { McaProjectListItem } from "@/lib/mca/project-list-item";

export type McaPerimeterInputMode =
  | "draw"
  | "car"
  | "coordinates"
  | "paste"
  | "kml_file"
  | "shp";

export type McaProjectRow = McaProjectListItem;

export type McaLayerManifestRow = { id: string; featureCount: number };

export const MCA_PDF_SATELLITE_PREF_KEY = "mca-pdf-include-satellite";
