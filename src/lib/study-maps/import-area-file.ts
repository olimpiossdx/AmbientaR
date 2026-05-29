import type { StudyAreaGeoJSON } from '@/components/maps/study-area-map';
import { parseKmlTextToFeaturePolygon } from '@/lib/study-maps/parse-kml-text';

/** Converte GeoJSON/KML para o submenu Mapas (Estudos Técnicos). Autónomo de Análise Geoespacial. */
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
