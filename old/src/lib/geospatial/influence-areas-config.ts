import type { GeoInfluenceAreaConfig } from "@/lib/types/geo-wave-a";

/** Valores padrão das áreas de influência (sem Turf — seguro para o cliente). */
export const DEFAULT_INFLUENCE_CONFIG: GeoInfluenceAreaConfig = {
  aidMode: "buffer",
  aiiMode: "buffer",
  aidBufferKm: 1,
  aiiBufferKm: 5,
  aidManualGeojson: null,
  aiiManualGeojson: null,
};
