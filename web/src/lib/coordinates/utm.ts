import proj4 from "proj4";
import type { CoordinateDecimal, Fuso } from "@/lib/types";
import {
  DEFAULT_UTM_FUSO,
  EPSG_SIRGAS2000_GEOGRAPHIC,
  epsgSirgas2000UtmS,
} from "./constants";
import "./proj-setup";
import { parseUtmInteger } from "./parse-number";

export type UtmSirgas2000 = {
  easting: number;
  northing: number;
  fuso: Fuso;
};

function geoCrs(): string {
  return `EPSG:${EPSG_SIRGAS2000_GEOGRAPHIC}`;
}

function utmCrs(fuso: Fuso): string {
  return `EPSG:${epsgSirgas2000UtmS(fuso)}`;
}

/** UTM SIRGAS 2000 (inteiro) → decimal geográfico. */
export function utmSirgas2000ToDecimal(
  easting: number,
  northing: number,
  fuso: Fuso = DEFAULT_UTM_FUSO,
): CoordinateDecimal {
  const [lng, lat] = proj4(utmCrs(fuso), geoCrs(), [easting, northing]);
  return { lat, lng };
}

/** UTM a partir de strings de formulário (X/Y/fuso). */
export function utmFormToDecimal(
  x: string | undefined,
  y: string | undefined,
  fuso: Fuso = DEFAULT_UTM_FUSO,
): CoordinateDecimal | undefined {
  const easting = parseUtmInteger(x);
  const northing = parseUtmInteger(y);
  if (easting == null || northing == null) return undefined;
  return utmSirgas2000ToDecimal(easting, northing, fuso);
}

/** Decimal geográfico → UTM SIRGAS 2000 arredondado (inteiro, padrão FEAM). */
export function decimalToUtmSirgas2000(
  lat: number,
  lng: number,
  fuso: Fuso = DEFAULT_UTM_FUSO,
): UtmSirgas2000 {
  const [easting, northing] = proj4(geoCrs(), utmCrs(fuso), [lng, lat]);
  return {
    easting: Math.round(easting),
    northing: Math.round(northing),
    fuso,
  };
}

/** UTM inteiro formatado como string (6/7 dígitos) para formulários. */
export function utmSirgas2000ToFormStrings(utm: UtmSirgas2000): {
  x: string;
  y: string;
  fuso: Fuso;
} {
  return {
    x: String(utm.easting).padStart(6, "0").slice(-6),
    y: String(utm.northing).padStart(7, "0").slice(-7),
    fuso: utm.fuso,
  };
}
