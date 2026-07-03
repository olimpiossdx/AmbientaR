/** Referências de geometria v3 — Firestore (v1) ou PostGIS (v3+). */

export type McaLayerRefParsed =
  | { kind: "firestore"; projectId: string; layerKey: string }
  | { kind: "postgis"; schema: string; table: string; layerKey: string };

export function firestoreLayerRef(projectId: string, layerKey: string): string {
  return `firestore:mca_projects/${projectId}/layers/${layerKey}`;
}

export function postgisLayerRef(schema: string, table: string, layerKey: string): string {
  return `postgis:${schema}.${table}/${layerKey}`;
}

export function parseLayerRef(ref: string): McaLayerRefParsed | null {
  const fs = ref.match(/^firestore:mca_projects\/([^/]+)\/layers\/(.+)$/);
  if (fs) {
    return { kind: "firestore", projectId: fs[1], layerKey: fs[2] };
  }
  const pg = ref.match(/^postgis:([^.]+)\.([^/]+)\/(.+)$/);
  if (pg) {
    return { kind: "postgis", schema: pg[1], table: pg[2], layerKey: pg[3] };
  }
  return null;
}

export function isPostgisLayerRef(ref: string): boolean {
  return ref.startsWith("postgis:");
}
