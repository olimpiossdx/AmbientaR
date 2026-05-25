import { parseKmlTextToFeaturePolygon } from '@/lib/geospatial/parse-kml-text';
import type { StudyAreaGeoJSON } from '@/components/maps/study-area-map';

/**
 * Converte texto de ficheiro GeoJSON ou KML/XML em geometria para o mapa de estudos.
 */
export function parseStudyAreaFileText(
  text: string,
  fileName: string,
): StudyAreaGeoJSON | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.kml') || lower.endsWith('.xml')) {
    const feature = parseKmlTextToFeaturePolygon(text);
    return feature ? (feature as unknown as StudyAreaGeoJSON) : null;
  }
  try {
    const parsed = JSON.parse(text) as StudyAreaGeoJSON;
    if (parsed && typeof parsed.type === 'string') return parsed;
  } catch {
    /* fall through */
  }
  const fromKml = parseKmlTextToFeaturePolygon(text);
  return fromKml ? (fromKml as unknown as StudyAreaGeoJSON) : null;
}
