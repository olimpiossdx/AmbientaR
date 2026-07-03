/**
 * APP hídrica regionalizada (MAPCAR / IDE-Sisema).
 * Uma camada por macrorregião hidrográfica MG — resolver por bbox evita 14× GetFeature.
 */

export const MAPCAR_APP_TYPE_NAMES: Record<string, string> = {
  ne: "IDE:ide_210603_mg_hid_app_hidrica_mapcar_ne_pol",
  amsf: "IDE:ide_210603_mg_hid_app_hidrica_mapcar_amsf_pol",
  ap: "IDE:ide_210603_mg_hid_app_hidrica_mapcar_ap_pol",
  cnor: "IDE:ide_210603_mg_hid_app_hidrica_mapcar_cnor_pol",
  co: "IDE:ide_210603_mg_hid_app_hidrica_mapcar_co_pol",
  cs: "IDE:ide_210603_mg_hid_app_hidrica_mapcar_cs_pol",
  jeq: "IDE:ide_210603_mg_hid_app_hidrica_mapcar_jeq_pol",
  mata: "IDE:ide_210603_mg_hid_app_hidrica_mapcar_mata_pol",
  cm: "IDE:ide_210603_mg_hid_app_hidrica_mapcar_cm_pol",
  nor: "IDE:ide_210603_mg_hid_app_hidrica_mapcar_nor_pol",
  no: "IDE:ide_210603_mg_hid_app_hidrica_mapcar_no_pol",
  riodoce: "IDE:ide_210603_mg_hid_app_hidrica_mapcar_riodoce_pol",
  sul: "IDE:ide_210603_mg_hid_app_hidrica_mapcar_sul_pol",
  tm: "IDE:ide_210603_mg_hid_app_hidrica_mapcar_tm_pol",
};

/** Extents aproximados (EPSG:4326) das macrorregiões MAPCAR MG. */
export const MAPCAR_APP_BBOX: Record<string, [number, number, number, number]> = {
  ne: [-42.0, -18.5, -39.5, -14.5],
  amsf: [-43.5, -20.0, -41.0, -17.5],
  ap: [-41.5, -16.5, -39.0, -14.0],
  cnor: [-46.5, -18.0, -43.5, -15.5],
  co: [-44.5, -21.0, -42.0, -18.5],
  cs: [-47.0, -22.5, -44.5, -19.5],
  jeq: [-43.5, -17.5, -40.5, -15.0],
  mata: [-43.0, -21.5, -40.5, -18.5],
  cm: [-46.0, -20.5, -43.5, -18.0],
  nor: [-44.5, -17.5, -42.0, -15.0],
  no: [-49.0, -17.0, -44.5, -14.0],
  riodoce: [-43.0, -21.0, -39.5, -18.0],
  sul: [-47.5, -23.0, -44.0, -19.5],
  tm: [-47.5, -21.0, -44.5, -18.5],
};

function bboxOverlaps(
  a: [number, number, number, number],
  b: [number, number, number, number],
): boolean {
  return !(a[2] < b[0] || a[0] > b[2] || a[3] < b[1] || a[1] > b[3]);
}

/** typeNames MAPCAR que intersectam o bbox da consulta (máx. 4). */
export function resolveMapcarAppTypeNamesForBbox(
  bbox: [number, number, number, number],
  max = 4,
): string[] {
  const hits: string[] = [];
  for (const [key, regionBbox] of Object.entries(MAPCAR_APP_BBOX)) {
    if (bboxOverlaps(bbox, regionBbox)) {
      hits.push(MAPCAR_APP_TYPE_NAMES[key]);
    }
  }
  if (hits.length === 0) {
    return [MAPCAR_APP_TYPE_NAMES.sul, MAPCAR_APP_TYPE_NAMES.mata, MAPCAR_APP_TYPE_NAMES.tm];
  }
  return hits.slice(0, max);
}
