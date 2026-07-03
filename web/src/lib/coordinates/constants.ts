import type { Datum, Fuso } from "@/lib/types";

/** Datum padrão para novos cadastros (MG / IGAM / CAR). */
export const DEFAULT_DATUM: Datum = "SIRGAS2000";

/** Fuso UTM padrão Minas Gerais (hemisfério sul). */
export const DEFAULT_UTM_FUSO: Fuso = "23";

/** EPSG: SIRGAS 2000 / UTM zone 23S. */
export const EPSG_SIRGAS2000_UTM_23S = 31983;

/** EPSG: SIRGAS 2000 geográfico (graus decimais). */
export const EPSG_SIRGAS2000_GEOGRAPHIC = 4674;

/** EPSG SIRGAS 2000 / UTM zone {22,23,24}S (hemisfério sul). */
export function epsgSirgas2000UtmS(fuso: Fuso): number {
  const zone = Number(fuso);
  if (zone === 22 || zone === 23 || zone === 24) {
    return 31980 + zone;
  }
  return EPSG_SIRGAS2000_UTM_23S;
}
