import area from '@turf/area';
import bbox from '@turf/bbox';
import type { Feature, Polygon } from 'geojson';
import type { GeoToPeaImportMode } from '@/lib/pea/build-abea-from-geo';

export type PolygonToPeaOptions = {
  modo: GeoToPeaImportMode;
  /** Rótulo da origem (KML, CAR, georef, etc.) */
  sourceLabel: string;
  /** Sugerir ABEA ampliada em relação à ADA (nota técnica) */
  sugerirAbeaAmpliada?: boolean;
  /** km sugeridos de buffer conceitual para ABEA (apenas texto orientativo) */
  abeaBufferKmNota?: number;
};

export type PolygonToPeaTexts = {
  abeaDescricao: string;
  adaGeometriaNotas: string;
  abeaGeometriaNotas: string;
  resumoLinha: string;
  areaHa: number;
  bbox: [number, number, number, number];
  vertexCount: number;
};

function mergeText(
  modo: GeoToPeaImportMode,
  existing: string | undefined,
  generated: string,
): string {
  const prev = existing?.trim() ?? '';
  const gen = generated.trim();
  if (!gen) return prev;
  if (!prev || modo === 'substituir') return gen;
  return `${prev}\n\n---\nGeometria importada (${new Date().toLocaleDateString('pt-BR')}):\n\n${gen}`;
}

function ringVertexCount(feature: Feature<Polygon>): number {
  const ring = feature.geometry.coordinates[0] ?? [];
  return ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] ? ring.length - 1 : ring.length;
}

/**
 * Preenche campos ABEA/ADA a partir de um polígono (KML, SHP, georef, perímetro da análise).
 */
export function buildPeaTextsFromPolygon(
  feature: Feature<Polygon>,
  existing: Partial<Pick<PolygonToPeaTexts, 'abeaDescricao' | 'adaGeometriaNotas' | 'abeaGeometriaNotas'>>,
  options: PolygonToPeaOptions,
): PolygonToPeaTexts {
  const areaHa = area(feature) / 10_000;
  const box = bbox(feature) as [number, number, number, number];
  const verts = ringVertexCount(feature);
  const [minX, minY, maxX, maxY] = box;
  const extLng = (maxX - minX).toFixed(4);
  const extLat = (maxY - minY).toFixed(4);

  const adaParts = [
    `Área Diretamente Afetada (ADA) — delimitação a partir de: ${options.sourceLabel}.`,
    `Área do polígono: ${areaHa.toFixed(2)} ha.`,
    `Extensão aproximada do envelope: ${extLng}° (longitude) × ${extLat}° (latitude).`,
    `Vértices do anel externo: ${verts}.`,
    'Coordenadas em SIRGAS2000 geográficas (conforme arquivo de origem).',
    'Anexar ao processo o mesmo arquivo em KML ou shapefile (SIRGAS 2000 UTM), com legenda e escala, conforme TR FEAM.',
  ];

  const abeaParts = [
    `Área de Abrangência da Educação Ambiental (ABEA) — base cartográfica: ${options.sourceLabel}.`,
    `Área de referência do perímetro importado: ${areaHa.toFixed(2)} ha.`,
    options.sugerirAbeaAmpliada !== false
      ? 'A ABEA deve abranger comunidades e agrupamentos habitacionais potencialmente afetados além do perímetro estrito da ADA; confirmar em campo (DSP) e ajustar o polígono antes do protocolo.'
      : '',
    options.abeaBufferKmNota
      ? `Orientação: considerar faixa de influência de até ${options.abeaBufferKmNota} km em torno da ADA para definição final da ABEA, conforme diagnóstico participativo.`
      : '',
    'Identificar no mapa as comunidades, povoados e núcleos urbanos na ABEA; exportar KML/SHP da ADA e da ABEA para anexo digital ao SLA/FEAM.',
  ];

  const abeaGeoNotes = [
    `Origem: ${options.sourceLabel}`,
    `Área: ${areaHa.toFixed(2)} ha`,
    `BBox: [${minX.toFixed(5)}, ${minY.toFixed(5)}] — [${maxX.toFixed(5)}, ${maxY.toFixed(5)}]`,
    `Vértices: ${verts}`,
  ].join('\n');

  const generatedAda = adaParts.filter(Boolean).join('\n\n');
  const generatedAbea = abeaParts.filter(Boolean).join('\n\n');

  return {
    abeaDescricao: mergeText(options.modo, existing.abeaDescricao, generatedAbea),
    adaGeometriaNotas: mergeText(options.modo, existing.adaGeometriaNotas, generatedAda),
    abeaGeometriaNotas: mergeText(options.modo, existing.abeaGeometriaNotas, abeaGeoNotes),
    resumoLinha: `${areaHa.toFixed(2)} ha · ${verts} vértices`,
    areaHa,
    bbox: box,
    vertexCount: verts,
  };
}
