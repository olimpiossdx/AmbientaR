import { z } from "zod";

export const GeoLayerStatSchema = z.object({
  label: z.string(),
  areaHa: z.number().optional(),
  lengthKm: z.number().optional(),
  pctOfPerimeter: z.number().optional(),
  count: z.number().optional(),
  /** Distância mínima ao perímetro (m) — extrato socioambiental / Sicredi. */
  proximityM: z.number().optional(),
  /** Área no buffer regulatório (ha) — critérios buffer 3 km. */
  bufferOverlapHa: z.number().optional(),
});

export type GeoLayerStat = z.infer<typeof GeoLayerStatSchema>;

export const GeoLayerSourceSchema = z.object({
  name: z.string(),
  url: z.string(),
  layerName: z.string(),
  queriedAtUtc: z.string(),
  method: z.string(),
});

export const GeoLayerResultSchema = z.object({
  layerId: z.string(),
  title: z.string(),
  status: z.enum(["ok", "partial", "unavailable"]),
  stats: z.array(GeoLayerStatSchema),
  summary: z.string(),
  source: GeoLayerSourceSchema.optional(),
  errorMessage: z.string().optional(),
});

export type GeoLayerResult = z.infer<typeof GeoLayerResultSchema>;

export const GeoPerimeterSchema = z.object({
  geojson: z.record(z.unknown()),
  areaHa: z.number(),
  source: z.enum(["car", "polygon", "coordinates", "kml", "shp"]),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
});

export type GeoPerimeter = z.infer<typeof GeoPerimeterSchema>;

export const GeoInfluenceAreaConfigSchema = z.object({
  aidMode: z.enum(["buffer", "manual", "none"]),
  aiiMode: z.enum(["buffer", "manual", "none"]),
  aidBufferKm: z.number(),
  aiiBufferKm: z.number(),
  aidManualGeojson: z.record(z.unknown()).nullable().optional(),
  aiiManualGeojson: z.record(z.unknown()).nullable().optional(),
});

export type GeoInfluenceAreaConfig = z.infer<typeof GeoInfluenceAreaConfigSchema>;

export const GeoInfluenceAreaPolygonSchema = z.object({
  key: z.enum(["ada", "aid", "aii"]),
  title: z.string(),
  geojson: z.record(z.unknown()),
  areaHa: z.number(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  source: z.enum(["perimeter", "buffer", "manual"]),
});

export type GeoInfluenceAreaPolygon = z.infer<typeof GeoInfluenceAreaPolygonSchema>;

export const GeoInfluenceAreasSchema = z.object({
  ada: GeoInfluenceAreaPolygonSchema,
  aid: GeoInfluenceAreaPolygonSchema.nullable(),
  aii: GeoInfluenceAreaPolygonSchema.nullable(),
  config: GeoInfluenceAreaConfigSchema,
});

export type GeoInfluenceAreas = z.infer<typeof GeoInfluenceAreasSchema>;

export const GeoZeeContextSchema = z.object({
  mgZeeClasses: z.array(
    z.object({
      label: z.string(),
      pctOfPerimeter: z.number().optional(),
    }),
  ),
  mgIeeResumo: z.string().optional(),
  zeeBrasilTitulo: z.string(),
  zeeBrasilNota: z.string(),
  zeeBrasilUrl: z.string(),
  ecossistemasNota: z.string(),
  fetchedAtUtc: z.string(),
});

export const GeoHidrologiaContextSchema = z.object({
  raioKm: z.number(),
  estacoesAnaProximas: z.array(
    z.object({
      codigo: z.union([z.number(), z.string()]),
      nome: z.string(),
      latitude: z.number(),
      longitude: z.number(),
      distanciaKm: z.number(),
    }),
  ),
  resumo: z.string(),
  fonteUrl: z.string(),
  fetchedAtUtc: z.string(),
});

export const WaveAAnalysisResultSchema = z.object({
  wave: z.enum(["A", "ABC"]),
  generatedAtUtc: z.string(),
  perimeter: GeoPerimeterSchema,
  layers: z.array(GeoLayerResultSchema),
  factualSummary: z.string(),
  fontesConsultadas: z.array(
    z.object({
      nome: z.string(),
      url: z.string(),
      tipo: z.enum(["ogc", "api", "catalogo", "download"]),
    }),
  ),
  zeeContext: GeoZeeContextSchema.optional(),
  hidrologiaContext: GeoHidrologiaContextSchema.optional(),
  influenceAreas: GeoInfluenceAreasSchema.optional(),
});

export type WaveAAnalysisResult = z.infer<typeof WaveAAnalysisResultSchema>;

export const GeoAnalysisComplementSectionSchema = z.object({
  key: z.string(),
  title: z.string(),
  bodyMarkdown: z.string(),
});

export const GeoAnalysisComplementOutputSchema = z.object({
  geoAnalysisId: z.string(),
  sections: z.array(GeoAnalysisComplementSectionSchema),
  resumoExecutivo: z.string(),
  status: z.enum(["rascunho_ia", "em_revisao", "aprovado"]),
  generatedAtUtc: z.string(),
  disclaimer: z.string(),
});

export type GeoAnalysisComplementOutput = z.infer<
  typeof GeoAnalysisComplementOutputSchema
>;
