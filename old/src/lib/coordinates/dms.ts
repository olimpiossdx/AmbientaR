import type { CoordinateDecimal } from "@/lib/types";
import type { DmsComponents } from "./types";
import { parseCoordinateNumber } from "./parse-number";

function hasAnyDmsValue(dms: DmsComponents): boolean {
  return [dms.grau, dms.min, dms.seg].some(
    (v) => v != null && String(v).trim() !== "",
  );
}

/**
 * Magnitude em graus decimais a partir de GMS (valores positivos).
 * Retorna undefined se todos os campos estiverem vazios.
 */
export function dmsMagnitudeToDecimal(dms: DmsComponents): number | undefined {
  if (!hasAnyDmsValue(dms)) return undefined;

  const grau = parseCoordinateNumber(dms.grau);
  if (grau == null) return undefined;

  const min = parseCoordinateNumber(dms.min) ?? 0;
  const seg = parseCoordinateNumber(dms.seg) ?? 0;

  if (min < 0 || min >= 60 || seg < 0 || seg >= 60) return undefined;

  return grau + min / 60 + seg / 3600;
}

/**
 * GMS (magnitudes positivas) → decimal com sinal MG (Sul/Oeste = negativo).
 */
export function dmsMgToDecimal(
  dms: DmsComponents,
  _axis: "lat" | "lng",
): number | undefined {
  const magnitude = dmsMagnitudeToDecimal(dms);
  if (magnitude == null) return undefined;
  return -Math.abs(magnitude);
}

/** Par GMS MG → par decimal signed. */
export function gmsPairMgToDecimal(
  lat: DmsComponents,
  lng: DmsComponents,
): CoordinateDecimal | undefined {
  const latDec = dmsMgToDecimal(lat, "lat");
  const lngDec = dmsMgToDecimal(lng, "lng");
  if (latDec == null || lngDec == null) return undefined;
  return { lat: latDec, lng: lngDec };
}

/** Decimal signed → GMS magnitudes positivas (strings) para exibição/formulário. */
export function decimalToDmsMagnitudes(decimalSigned: number): {
  grau: string;
  min: string;
  seg: string;
} {
  const abs = Math.abs(decimalSigned);
  const grau = Math.floor(abs);
  const minFloat = (abs - grau) * 60;
  const min = Math.floor(minFloat);
  const seg = (minFloat - min) * 60;

  const formatSeg = (value: number): string => {
    const rounded = Math.round(value * 1e6) / 1e6;
    return String(rounded).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  };

  return {
    grau: String(grau),
    min: String(min),
    seg: formatSeg(seg),
  };
}

/** Garante sinais Sul/Oeste para coordenadas decimais em MG. */
export function applyMgHemisphere(decimal: CoordinateDecimal): CoordinateDecimal {
  return {
    lat: decimal.lat <= 0 ? decimal.lat : -Math.abs(decimal.lat),
    lng: decimal.lng <= 0 ? decimal.lng : -Math.abs(decimal.lng),
  };
}
