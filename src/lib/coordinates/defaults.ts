import type { CoordinateFormat } from "@/lib/types";
import { DEFAULT_DATUM, DEFAULT_UTM_FUSO } from "./constants";

function emptyLatLong() {
  return {
    lat: { grau: "", min: "", seg: "" },
    long: { grau: "", min: "", seg: "" },
  };
}

function emptyUtm() {
  return { x: "", y: "", fuso: DEFAULT_UTM_FUSO };
}

/** Bloco vazio para `geographicLocation` ou trechos E (`formato`). */
export function createDefaultCoordinateBlock(
  formatField: "format" | "formato" = "format",
  coordinateFormat: CoordinateFormat = "UTM",
) {
  return {
    datum: DEFAULT_DATUM,
    [formatField]: coordinateFormat,
    latLong: emptyLatLong(),
    utm: emptyUtm(),
  };
}

/** Defaults de início/fim do trecho (listagem E — dutos/gasodutos). */
export function createDefaultTrechoCoordinateBlock() {
  return {
    ...createDefaultCoordinateBlock("formato", "UTM"),
    local: "",
    municipio: "",
    referenciaAdicional: "",
    baciaHidrografica: "",
    subBaciaHidrografica: "",
    upgrh: "",
    cursoDaguaProximo: "",
  };
}
