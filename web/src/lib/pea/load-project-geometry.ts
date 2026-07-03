'use client';

import type { Firestore } from 'firebase/firestore';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
} from 'firebase/firestore';
import type { Feature, Polygon } from 'geojson';
import area from '@turf/area';
import bbox from '@turf/bbox';
import { parseKmlTextToFeaturePolygon } from '@/lib/geospatial/parse-kml-text';
import { parsePerimeterPolygon, parseGeoJsonObject } from '@/lib/geospatial/perimeter';
import { fetchStorageImageProxyBlob, isFirebaseStorageHttpsUrl } from '@/lib/storage-image-proxy-client';
import type { ProjectPerimetroReferencia } from '@/lib/types';
import {
  parsePerimetroReferenciaFile,
  resolvePerimetroReferenciaFromProject,
} from '@/lib/project-perimetro-referencia';
import type { GeoAnalysisBundle } from '@/lib/geospatial/load-geo-analysis-bundle';

export type ProjectGeometrySourceKind =
  | 'geo_analysis'
  | 'georef'
  | 'car_shp'
  | 'kml_upload'
  | 'perimetro_referencia';

export type ProjectGeometryCandidate = {
  id: string;
  label: string;
  source: ProjectGeometrySourceKind;
  areaHa?: number;
  analysisId?: string;
  georefId?: string;
  shpUrl?: string;
  perimetroReferencia?: ProjectPerimetroReferencia;
};

export type ResolvedProjectPolygon = {
  polygon: Feature<Polygon>;
  areaHa: number;
  bbox: [number, number, number, number];
  sourceLabel: string;
  source: ProjectGeometrySourceKind;
};

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(buf).toString('base64');
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve(String(dataUrl).replace(/^data:[^;]+;base64,/, ''));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function fetchBlobFromUrl(url: string): Promise<Blob> {
  if (isFirebaseStorageHttpsUrl(url)) {
    return fetchStorageImageProxyBlob(url);
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Não foi possível baixar o arquivo (HTTP ${res.status}).`);
  return res.blob();
}

function featureFromUnknownGeojson(raw: unknown): Feature<Polygon> | null {
  return parseGeoJsonObject(raw);
}

/** Lista fontes de geometria disponíveis para um empreendimento (projeto). */
export async function listProjectGeometryCandidates(
  firestore: Firestore,
  userId: string,
  projectId?: string,
): Promise<ProjectGeometryCandidate[]> {
  const out: ProjectGeometryCandidate[] = [];
  const pid = projectId?.trim();
  if (!pid) return out;

  const projectSnap = await getDoc(doc(firestore, 'projects', pid));
  if (projectSnap.exists()) {
    const data = projectSnap.data() as Record<string, unknown>;
    const perimetroReferencia = data.perimetroReferencia as
      | ProjectPerimetroReferencia
      | undefined;
    if (perimetroReferencia?.geojson || perimetroReferencia?.fileUrl) {
      out.push({
        id: `perimetro-ref-${pid}`,
        label: `Perímetro de referência (cadastro)${
          typeof perimetroReferencia.areaHa === 'number'
            ? ` · ${perimetroReferencia.areaHa.toFixed(2)} ha`
            : ''
        }`,
        source: 'perimetro_referencia',
        areaHa: perimetroReferencia.areaHa,
        perimetroReferencia,
      });
    }
    const car = data.car as { shpUrl?: string } | undefined;
    if (car?.shpUrl) {
      out.push({
        id: `car-shp-${pid}`,
        label: 'Geometria CAR (SHP/ZIP no cadastro do empreendimento)',
        source: 'car_shp',
        shpUrl: car.shpUrl,
      });
    }
  }

  const georefSnap = await getDocs(
    query(
      collection(firestore, 'georef_projects'),
      where('projectId', '==', pid),
      limit(8),
    ),
  );
  for (const d of georefSnap.docs) {
    const data = d.data() as Record<string, unknown>;
    const title = (data.title as string) || 'Processo georreferenciamento';
    const areaHa = typeof data.areaHa === 'number' ? data.areaHa : undefined;
    if (data.polygonGeojson || (Array.isArray(data.vertices) && data.vertices.length >= 3)) {
      out.push({
        id: `georef-${d.id}`,
        label: `Georef: ${title}`,
        source: 'georef',
        georefId: d.id,
        areaHa,
      });
    }
  }

  const geoSnap = await getDocs(
    query(collection(firestore, 'geo_analyses'), where('createdBy', '==', userId), limit(30)),
  );
  for (const d of geoSnap.docs) {
    const data = d.data();
    if (data.empreendimentoId !== pid) continue;
    const wave = data.wave as string | undefined;
    if (wave !== 'A' && wave !== 'ABC') continue;
    const per = data.perimeter as { areaHa?: number } | undefined;
    out.push({
      id: `geo-${d.id}`,
      label: `Análise geoespacial ${per?.areaHa?.toFixed(2) ?? '?'} ha`,
      source: 'geo_analysis',
      analysisId: d.id,
      areaHa: per?.areaHa,
    });
  }

  return out;
}

export async function resolveGeometryFromCandidate(
  firestore: Firestore,
  candidate: ProjectGeometryCandidate,
  userId: string,
): Promise<ResolvedProjectPolygon | null> {
  if (candidate.source === 'perimetro_referencia' && candidate.perimetroReferencia) {
    return resolvePerimetroReferenciaFromProject(candidate.perimetroReferencia);
  }

  if (candidate.source === 'car_shp' && candidate.shpUrl) {
    const blob = await fetchBlobFromUrl(candidate.shpUrl);
    const b64 = await blobToBase64(blob);
    const parsed = await parsePerimeterPolygon({ dataType: 'shp', data: b64 });
    if (!parsed) return null;
    return {
      polygon: parsed.polygon,
      areaHa: parsed.areaHa,
      bbox: parsed.bbox,
      sourceLabel: candidate.label,
      source: 'car_shp',
    };
  }

  if (candidate.source === 'georef' && candidate.georefId) {
    const snap = await getDoc(doc(firestore, 'georef_projects', candidate.georefId));
    if (!snap.exists()) return null;
    const data = snap.data() as Record<string, unknown>;
    let feature: Feature<Polygon> | null = null;
    if (data.polygonGeojson) {
      feature = featureFromUnknownGeojson(data.polygonGeojson);
    }
    if (!feature && Array.isArray(data.vertices) && data.vertices.length >= 3) {
      const { verticesToPolygonGeoJSON } = await import(
        '@/lib/georeferenciamento/vertices-to-geojson'
      );
      feature = verticesToPolygonGeoJSON(
        data.vertices as import('@/lib/georeferenciamento/types').GeorefVertice[],
      ) as Feature<Polygon> | null;
    }
    if (!feature) return null;
    const areaHa = area(feature) / 10_000;
    return {
      polygon: feature,
      areaHa,
      bbox: bbox(feature) as [number, number, number, number],
      sourceLabel: candidate.label,
      source: 'georef',
    };
  }

  if (candidate.source === 'geo_analysis' && candidate.analysisId) {
    const { loadGeoAnalysisBundle } = await import('@/lib/geospatial/load-geo-analysis-bundle');
    const bundle = await loadGeoAnalysisBundle(firestore, candidate.analysisId, userId);
    if (!bundle) return null;
    return polygonFromGeoAnalysisBundle(bundle);
  }

  return null;
}

export function polygonFromGeoAnalysisBundle(
  bundle: GeoAnalysisBundle,
): ResolvedProjectPolygon | null {
  const feature = featureFromUnknownGeojson(bundle.wave.perimeter.geojson);
  if (!feature) return null;
  return {
    polygon: feature,
    areaHa: bundle.wave.perimeter.areaHa,
    bbox: bundle.wave.perimeter.bbox,
    sourceLabel: `Análise geoespacial ${bundle.analysisId.slice(0, 10)}…`,
    source: 'geo_analysis',
  };
}

/** Importa ficheiro KML, KMZ (doc.kml), GeoJSON, ZIP SHP ou XML de coordenadas. */
export async function parseGeometryUploadFile(file: File): Promise<ResolvedProjectPolygon | null> {
  const name = file.name.toLowerCase();
  const ext = name.split('.').pop() ?? '';

  if (ext === 'kmz') {
    try {
      const parsed = await parsePerimetroReferenciaFile(file);
      return { ...parsed, source: 'kml_upload' };
    } catch (e) {
      throw e instanceof Error ? e : new Error('Falha ao ler KMZ.');
    }
  }

  if (ext === 'kml' || ext === 'xml') {
    const text = await file.text();
    const feature = parseKmlTextToFeaturePolygon(text);
    if (!feature) return null;
    const areaHa = area(feature) / 10_000;
    return {
      polygon: feature,
      areaHa,
      bbox: bbox(feature) as [number, number, number, number],
      sourceLabel: `KML: ${file.name}`,
      source: 'kml_upload',
    };
  }

  if (ext === 'geojson' || ext === 'json') {
    const text = await file.text();
    const feature = parseKmlTextToFeaturePolygon(text);
    if (!feature) return null;
    const areaHa = area(feature) / 10_000;
    return {
      polygon: feature,
      areaHa,
      bbox: bbox(feature) as [number, number, number, number],
      sourceLabel: `GeoJSON: ${file.name}`,
      source: 'kml_upload',
    };
  }

  if (ext === 'zip' || ext === 'shp') {
    const buf = await file.arrayBuffer();
    let b64: string;
    if (typeof Buffer !== 'undefined') {
      b64 = Buffer.from(buf).toString('base64');
    } else {
      const bytes = new Uint8Array(buf);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
      b64 = btoa(binary);
    }
    const parsed = await parsePerimeterPolygon({ dataType: 'shp', data: b64 });
    if (!parsed) return null;
    return {
      polygon: parsed.polygon,
      areaHa: parsed.areaHa,
      bbox: parsed.bbox,
      sourceLabel: `SHP/ZIP: ${file.name}`,
      source: 'kml_upload',
    };
  }

  throw new Error('Formato não suportado. Use KML, GeoJSON, XML ou ZIP/SHP.');
}
