'use client';

import type { Feature, Polygon } from 'geojson';
import type {
  Project,
  ProjectPerimetroReferencia,
  ProjectPerimetroReferenciaFileType,
} from '@/lib/types';
import { parseKmlTextToFeaturePolygon } from '@/lib/geospatial/parse-kml-text';
import type { ResolvedProjectPolygon } from '@/lib/pea/load-project-geometry';

const MAX_KML_KMZ_BYTES = 4 * 1024 * 1024;
const MAX_SHP_ZIP_BYTES = 8 * 1024 * 1024;

export function inferPerimetroReferenciaFileType(
  fileName: string,
): ProjectPerimetroReferenciaFileType {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.kmz')) return 'kmz';
  if (lower.endsWith('.kml') || lower.endsWith('.xml')) return 'kml';
  return 'shp';
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(buf).toString('base64');
  }
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

export async function extractKmlTextFromKmzBytes(bytes: Uint8Array): Promise<string> {
  const { iter } = await import('but-unzip');
  const entries = [...iter(bytes)];
  const kmlEntry =
    entries.find((e) => e.filename.toLowerCase().endsWith('.kml')) ??
    entries.find((e) => e.filename.toLowerCase().includes('doc.kml'));
  if (!kmlEntry) {
    throw new Error('KMZ sem arquivo KML interno.');
  }
  const kmlBytes = await kmlEntry.read();
  return new TextDecoder().decode(kmlBytes);
}

async function fetchBlobFromUrl(url: string): Promise<Blob> {
  if (isFirebaseStorageHttpsUrl(url)) {
    return fetchStorageImageProxyBlob(url);
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Não foi possível baixar o arquivo (HTTP ${res.status}).`);
  return res.blob();
}

import { fetchStorageImageProxyBlob, isFirebaseStorageHttpsUrl } from '@/lib/storage-image-proxy-client';

async function polygonFromFeature(feature: Feature<Polygon>): Promise<ResolvedProjectPolygon> {
  const [{ default: turfArea }, { default: turfBbox }] = await Promise.all([
    import('@turf/area'),
    import('@turf/bbox'),
  ]);
  const areaHa = turfArea(feature) / 10_000;
  return {
    polygon: feature,
    areaHa,
    bbox: turfBbox(feature) as [number, number, number, number],
    sourceLabel: 'Perímetro de referência',
    source: 'perimetro_referencia',
  };
}

/** Interpreta KML, KMZ ou SHP/ZIP e devolve polígono + metadados. */
export async function parsePerimetroReferenciaFile(
  file: File,
): Promise<ResolvedProjectPolygon> {
  const fileType = inferPerimetroReferenciaFileType(file.name);
  const lower = file.name.toLowerCase();

  if (fileType === 'kmz') {
    if (file.size > MAX_KML_KMZ_BYTES) {
      throw new Error('KMZ grande demais (máx. 4 MB).');
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const kmlText = await extractKmlTextFromKmzBytes(bytes);
    const feature = parseKmlTextToFeaturePolygon(kmlText);
    if (!feature) throw new Error('Não foi possível ler polígono do KMZ.');
    return {
      ...(await polygonFromFeature(feature)),
      sourceLabel: `KMZ: ${file.name}`,
    };
  }

  if (fileType === 'kml') {
    if (file.size > MAX_KML_KMZ_BYTES) {
      throw new Error('KML grande demais (máx. 4 MB).');
    }
    const text = await file.text();
    const feature = parseKmlTextToFeaturePolygon(text);
    if (!feature) throw new Error('Não foi possível ler polígono do KML.');
    return {
      ...(await polygonFromFeature(feature)),
      sourceLabel: `KML: ${file.name}`,
    };
  }

  if (file.size > MAX_SHP_ZIP_BYTES) {
    throw new Error('ZIP/SHP grande demais (máx. 8 MB).');
  }
  const b64 = await blobToBase64(file);
  const { parsePerimeterPolygon } = await import('@/lib/geospatial/perimeter');
  const parsed = await parsePerimeterPolygon({ dataType: 'shp', data: b64 });
  if (!parsed) {
    throw new Error('Não foi possível ler polígono do shapefile (ZIP com .shp, .shx e .dbf).');
  }
  return {
    polygon: parsed.polygon,
    areaHa: parsed.areaHa,
    bbox: parsed.bbox,
    sourceLabel: lower.endsWith('.shp') ? `SHP: ${file.name}` : `SHP/ZIP: ${file.name}`,
    source: 'perimetro_referencia',
  };
}

export function buildPerimetroReferenciaPayload(
  parsed: ResolvedProjectPolygon,
  file: File,
  fileUrl: string | undefined,
  uploadedBy: string | undefined,
): ProjectPerimetroReferencia {
  return {
    fileUrl,
    fileName: file.name,
    fileType: inferPerimetroReferenciaFileType(file.name),
    geojson: parsed.polygon,
    areaHa: parsed.areaHa,
    uploadedAt: new Date().toISOString(),
    uploadedBy,
  };
}

export async function resolvePerimetroReferenciaFromProject(
  perimetro: ProjectPerimetroReferencia | undefined,
): Promise<ResolvedProjectPolygon | null> {
  if (!perimetro) return null;

  if (perimetro.geojson) {
    const { parseGeoJsonObject } = await import('@/lib/geospatial/perimeter');
    const feature = parseGeoJsonObject(perimetro.geojson);
    if (!feature) return null;
    const label = perimetro.fileName
      ? `Cadastro empreendimento: ${perimetro.fileName}`
      : 'Perímetro de referência (cadastro do empreendimento)';
    return {
      ...(await polygonFromFeature(feature)),
      sourceLabel: label,
    };
  }

  if (!perimetro.fileUrl) return null;

  const blob = await fetchBlobFromUrl(perimetro.fileUrl);
  const fileName = perimetro.fileName || 'perimetro.zip';
  const file = new File([blob], fileName, { type: blob.type || 'application/octet-stream' });
  const parsed = await parsePerimetroReferenciaFile(file);
  return {
    ...parsed,
    sourceLabel: `Cadastro empreendimento: ${fileName}`,
  };
}

export function projectHasPerimetroReferencia(project: Pick<Project, 'perimetroReferencia'>): boolean {
  const p = project.perimetroReferencia;
  return Boolean(p?.geojson || p?.fileUrl);
}

export function buildPerimetroReferenciaStoragePath(projectId: string, safeFileName: string): string {
  return `projects/${projectId}/perimetro-referencia/${Date.now()}-${safeFileName}`;
}
