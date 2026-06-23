
import { z } from 'zod';

// Definição do Esquema de Entrada
export const AnaliseAmbientalInputSchema = z.object({
  dataType: z.enum(['car', 'kml', 'shp', 'polygon', 'coordinates']),
  data: z.string().describe('O dado de entrada. Pode ser um número de CAR, conteúdo de arquivo KML/SHP (base64) ou coordenadas de um polígono.'),
});
export type AnaliseAmbientalInput = z.infer<typeof AnaliseAmbientalInputSchema>;

export const GeoFactualItemSchema = z.object({
  camada: z.string().describe('Nome da camada consultada.'),
  fonte: z.string().describe('Fonte governamental da camada.'),
  metodo: z.string().describe('Método utilizado (interseção, proximidade, consulta de metadado, etc.).'),
  resultado: z.string().describe('Resumo textual do resultado factual.'),
  areaHa: z.number().optional().describe('Área aproximada em hectares quando aplicável.'),
});
export type GeoFactualItem = z.infer<typeof GeoFactualItemSchema>;

export const GeoFonteSchema = z.object({
  nome: z.string(),
  url: z.string(),
  tipo: z.enum(['ogc', 'api', 'catalogo', 'download']),
});
export type GeoFonte = z.infer<typeof GeoFonteSchema>;

// Definição do Esquema de Saída
const AnaliseDetalhadaSchema = z.object({
  titulo: z.string().describe("Título da seção da análise (ex: 'Recursos Hídricos')."),
  relatorio: z.string().describe("Análise textual detalhada, dados e conclusões da IA para esta seção."),
});

export const AnaliseAmbientalOutputSchema = z.object({
  resumoIA: z.string().describe("Um resumo executivo de 2 a 3 frases com as conclusões mais importantes da análise completa."),
  analises: z.array(AnaliseDetalhadaSchema).describe("Uma lista de análises detalhadas para cada camada de informação."),
  generatedAtUtc: z.string().describe('Timestamp UTC da geração da análise.'),
  factualData: z.array(GeoFactualItemSchema).describe('Evidências factuais usadas no relatório.'),
  fontesConsultadas: z.array(GeoFonteSchema).describe('Fontes consultadas durante a análise.'),
});
export type AnaliseAmbientalOutput = z.infer<typeof AnaliseAmbientalOutputSchema>;
