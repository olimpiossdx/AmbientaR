import type { Datum } from "@/lib/types";

/** Opções de datum para `<CoordinateInput />` (SIRGAS 2000 primeiro). */
export const COORDINATE_DATUM_OPTIONS: { value: Datum; label: string }[] = [
  { value: "SIRGAS2000", label: "SIRGAS 2000" },
  { value: "SAD-69", label: "SAD-69" },
  { value: "WGS-84", label: "WGS-84" },
  { value: "Córrego Alegre", label: "Córrego Alegre" },
];

export const COORDINATE_FORMAT_OPTIONS = [
  { value: "Lat/Long" as const, label: "Geográficas (Grau, Min, Seg)" },
  { value: "UTM" as const, label: "UTM (X, Y)" },
];

export const COORDINATE_FUSO_OPTIONS = [
  { value: "22" as const, label: "22S" },
  { value: "23" as const, label: "23S (MG)" },
  { value: "24" as const, label: "24S" },
];
