import { z } from "zod";

export const GeoLayerStatSchema = z.object({
  label: z.string(),
  areaHa: z.number().optional(),
  lengthKm: z.number().optional(),
  pctOfPerimeter: z.number().optional(),
  count: z.number().optional(),
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
