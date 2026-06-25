import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { HecRasResultadosEstudo } from '@/lib/types';

export const HEC_RAS_RESULTADOS_FORMAT = 'AmbientaR-HEC-RAS-resultados' as const;
export const HEC_RAS_RESULTADOS_VERSION = '1.0' as const;
/** Limite para guardar GeoJSON inline no Firestore (~50 KB). */
export const HEC_RAS_GEOJSON_MAX_INLINE_BYTES = 50_000;

export type HecRasResultadosPackage = {
  format: typeof HEC_RAS_RESULTADOS_FORMAT;
  version: typeof HEC_RAS_RESULTADOS_VERSION;
  exportedAt?: string;
  software?: string;
  cenario?: string;
  resumo?: {
    areaInundadaM2?: number;
    profundidadeMaxM?: number;
    velocidadeMaxMs?: number;
    tempoChegadaMinMin?: number;
    tempoChegadaMaxH?: number;
    vazaoPicoModeladaM3s?: number;
    dataSimulacao?: string;
  };
  pontosInteresse?: Array<{
    label?: string;
    lat?: number;
    lng?: number;
    profundidadeMaxM?: number;
    velocidadeMaxMs?: number;
    tempoChegadaMin?: number;
  }>;
  geojson?: FeatureCollection;
  observacoes?: string;
};

export type HecRasImportIssue = {
  field: string;
  message: string;
  severity: 'error' | 'warning';
};

export type HecRasParsedImport = {
  data: HecRasResultadosEstudo;
  warnings: string[];
  formatoOrigem: 'ambientar' | 'geojson' | 'csv';
};

function numToStr(n: number | undefined | null, digits = 4): string {
  if (n == null || !Number.isFinite(n)) return '';
  return n.toFixed(digits).replace(/\.?0+$/, (m) => (m === '.' ? '' : m));
}

function parseNum(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function pickProp(props: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const v = parseNum(props[k]);
    if (v != null) return v;
  }
  return null;
}

function pickStr(props: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = props[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return undefined;
}

function bboxFromFeatures(features: Feature[]): string | undefined {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  const visit = (coords: unknown): void => {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      const [lng, lat] = coords as [number, number];
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      return;
    }
    for (const c of coords) visit(c);
  };

  for (const f of features) {
    if (f.geometry) visit((f.geometry as Geometry).coordinates);
  }

  if (!Number.isFinite(minLng)) return undefined;
  return `${minLat.toFixed(6)},${minLng.toFixed(6)} — ${maxLat.toFixed(6)},${maxLng.toFixed(6)}`;
}

function summarizeGeoJson(fc: FeatureCollection): {
  resumo: HecRasResultadosEstudo['resumo'];
  pontos: NonNullable<HecRasResultadosEstudo['pontos']>;
  geojsonStats: NonNullable<HecRasResultadosEstudo['geojsonStats']>;
} {
  const features = fc.features ?? [];
  let profMax = 0;
  let velMax = 0;
  let tMin = Infinity;
  let tMax = 0;
  let areaSum = 0;
  const pontos: NonNullable<HecRasResultadosEstudo['pontos']> = [];

  for (const f of features) {
    const p = (f.properties ?? {}) as Record<string, unknown>;
    const depth =
      pickProp(p, [
        'profundidade_max_m',
        'profundidadeMaxM',
        'depth_max_m',
        'max_depth_m',
        'depth_m',
        'profundidade_m',
        'Depth',
        'Max Depth',
      ]) ?? 0;
    const vel =
      pickProp(p, [
        'velocidade_max_ms',
        'velocidadeMaxMs',
        'velocity_max_ms',
        'max_velocity_ms',
        'velocity_ms',
        'velocidade_ms',
        'Velocity',
      ]) ?? 0;
    const tArr = pickProp(p, [
      'tempo_chegada_min',
      'tempoChegadaMin',
      'arrival_time_min',
      'arrival_min',
      'time_to_peak_min',
    ]);

    if (depth > profMax) profMax = depth;
    if (vel > velMax) velMax = vel;
    if (tArr != null) {
      tMin = Math.min(tMin, tArr);
      tMax = Math.max(tMax, tArr);
    }

    const area = pickProp(p, ['area_inundada_m2', 'area_m2', 'flooded_area_m2']);
    if (area != null) areaSum += area;

    const label = pickStr(p, ['label', 'nome', 'name', 'id', 'tipo']);
    const geom = f.geometry;
    if (geom?.type === 'Point' && Array.isArray(geom.coordinates)) {
      const [lng, lat] = geom.coordinates as [number, number];
      pontos.push({
        label: label ?? `Ponto ${pontos.length + 1}`,
        lat: numToStr(lat, 6),
        lng: numToStr(lng, 6),
        profundidadeMaxM: depth > 0 ? numToStr(depth, 2) : '',
        velocidadeMaxMs: vel > 0 ? numToStr(vel, 2) : '',
        tempoChegadaMin: tArr != null ? numToStr(tArr, 1) : '',
      });
    }
  }

  return {
    resumo: {
      areaInundadaM2: areaSum > 0 ? numToStr(areaSum, 0) : '',
      profundidadeMaxM: profMax > 0 ? numToStr(profMax, 2) : '',
      velocidadeMaxMs: velMax > 0 ? numToStr(velMax, 2) : '',
      tempoChegadaMinMin: Number.isFinite(tMin) ? numToStr(tMin, 1) : '',
      tempoChegadaMaxH: tMax > 0 ? numToStr(tMax / 60, 2) : '',
      software: 'HEC-RAS (GeoJSON)',
    },
    pontos,
    geojsonStats: {
      featureCount: String(features.length),
      bbox: bboxFromFeatures(features),
      storedInline: 'false',
    },
  };
}

function parseAmbientarPackage(pkg: HecRasResultadosPackage): HecRasParsedImport {
  const warnings: string[] = [];
  const resumo = pkg.resumo ?? {};
  const pontos =
    pkg.pontosInteresse?.map((p) => ({
      label: p.label,
      lat: p.lat != null ? numToStr(p.lat, 6) : '',
      lng: p.lng != null ? numToStr(p.lng, 6) : '',
      profundidadeMaxM: p.profundidadeMaxM != null ? numToStr(p.profundidadeMaxM, 2) : '',
      velocidadeMaxMs: p.velocidadeMaxMs != null ? numToStr(p.velocidadeMaxMs, 2) : '',
      tempoChegadaMin: p.tempoChegadaMin != null ? numToStr(p.tempoChegadaMin, 1) : '',
    })) ?? [];

  let geojsonInline: Record<string, unknown> | undefined;
  let geojsonStats: HecRasResultadosEstudo['geojsonStats'];

  if (pkg.geojson?.features?.length) {
    const serialized = JSON.stringify(pkg.geojson);
    if (serialized.length <= HEC_RAS_GEOJSON_MAX_INLINE_BYTES) {
      geojsonInline = pkg.geojson as unknown as Record<string, unknown>;
      geojsonStats = {
        featureCount: String(pkg.geojson.features.length),
        bbox: bboxFromFeatures(pkg.geojson.features),
        storedInline: 'true',
      };
    } else {
      warnings.push(
        `GeoJSON omitido do cadastro (${Math.round(serialized.length / 1024)} KB > limite ${Math.round(HEC_RAS_GEOJSON_MAX_INLINE_BYTES / 1024)} KB). Resumo numérico importado.`,
      );
      const summary = summarizeGeoJson(pkg.geojson);
      geojsonStats = summary.geojsonStats;
    }
  }

  const data: HecRasResultadosEstudo = {
    importedAt: new Date().toISOString(),
    sourceFile: '',
    formatoOrigem: 'ambientar',
    resumo: {
      areaInundadaM2: resumo.areaInundadaM2 != null ? numToStr(resumo.areaInundadaM2, 0) : '',
      profundidadeMaxM: resumo.profundidadeMaxM != null ? numToStr(resumo.profundidadeMaxM, 2) : '',
      velocidadeMaxMs: resumo.velocidadeMaxMs != null ? numToStr(resumo.velocidadeMaxMs, 2) : '',
      tempoChegadaMinMin:
        resumo.tempoChegadaMinMin != null ? numToStr(resumo.tempoChegadaMinMin, 1) : '',
      tempoChegadaMaxH: resumo.tempoChegadaMaxH != null ? numToStr(resumo.tempoChegadaMaxH, 2) : '',
      vazaoPicoModeladaM3s:
        resumo.vazaoPicoModeladaM3s != null ? numToStr(resumo.vazaoPicoModeladaM3s, 2) : '',
      cenarioModelado: pkg.cenario,
      software: pkg.software ?? 'HEC-RAS',
      dataSimulacao: resumo.dataSimulacao,
    },
    pontos,
    geojsonStats,
    geojsonInline,
    observacoes: pkg.observacoes,
    memorial: '',
  };
  data.memorial = formatHecRasResultadosMemorial(data);

  return { data, warnings, formatoOrigem: 'ambientar' };
}

function parseCsvContent(content: string): HecRasParsedImport {
  const lines = content
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim());
  if (lines.length < 2) {
    throw new Error('CSV deve ter cabeçalho e ao menos uma linha de dados.');
  }

  const sep = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(sep).map((h) => h.trim().toLowerCase());
  const idx = (names: string[]) => headers.findIndex((h) => names.some((n) => h.includes(n)));

  const iLabel = idx(['label', 'nome', 'name', 'ponto']);
  const iLat = idx(['lat', 'latitude']);
  const iLng = idx(['lng', 'lon', 'longitude']);
  const iDepth = idx(['profundidade', 'depth', 'h_max']);
  const iVel = idx(['velocidade', 'velocity', 'vel']);
  const iTime = idx(['chegada', 'arrival', 'tempo']);

  const pontos: NonNullable<HecRasResultadosEstudo['pontos']> = [];
  let profMax = 0;
  let velMax = 0;
  let tMin = Infinity;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map((c) => c.trim());
    const depth = iDepth >= 0 ? parseNum(cols[iDepth]) : null;
    const vel = iVel >= 0 ? parseNum(cols[iVel]) : null;
    const t = iTime >= 0 ? parseNum(cols[iTime]) : null;
    if (depth != null && depth > profMax) profMax = depth;
    if (vel != null && vel > velMax) velMax = vel;
    if (t != null) tMin = Math.min(tMin, t);

    pontos.push({
      label: iLabel >= 0 ? cols[iLabel] : `Ponto ${i}`,
      lat: iLat >= 0 ? cols[iLat] : '',
      lng: iLng >= 0 ? cols[iLng] : '',
      profundidadeMaxM: depth != null ? numToStr(depth, 2) : '',
      velocidadeMaxMs: vel != null ? numToStr(vel, 2) : '',
      tempoChegadaMin: t != null ? numToStr(t, 1) : '',
    });
  }

  const data: HecRasResultadosEstudo = {
    importedAt: new Date().toISOString(),
    sourceFile: '',
    formatoOrigem: 'csv',
    resumo: {
      profundidadeMaxM: profMax > 0 ? numToStr(profMax, 2) : '',
      velocidadeMaxMs: velMax > 0 ? numToStr(velMax, 2) : '',
      tempoChegadaMinMin: Number.isFinite(tMin) ? numToStr(tMin, 1) : '',
      software: 'HEC-RAS (CSV)',
    },
    pontos,
    memorial: '',
  };
  data.memorial = formatHecRasResultadosMemorial(data);

  return { data, warnings: [], formatoOrigem: 'csv' };
}

export function parseHecRasResultadosFile(
  content: string,
  fileName: string,
): HecRasParsedImport {
  const lower = fileName.toLowerCase();

  if (lower.endsWith('.csv')) {
    const parsed = parseCsvContent(content);
    parsed.data.sourceFile = fileName;
    return parsed;
  }

  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch {
    throw new Error('Arquivo JSON inválido.');
  }

  if (json && typeof json === 'object') {
    const obj = json as Record<string, unknown>;
    if (obj.format === HEC_RAS_RESULTADOS_FORMAT) {
      const parsed = parseAmbientarPackage(obj as HecRasResultadosPackage);
      parsed.data.sourceFile = fileName;
      return parsed;
    }
    if (obj.type === 'FeatureCollection' && Array.isArray(obj.features)) {
      const summary = summarizeGeoJson(obj as FeatureCollection);
      let geojsonInline: Record<string, unknown> | undefined;
      const warnings: string[] = [];
      const serialized = content;
      if (serialized.length <= HEC_RAS_GEOJSON_MAX_INLINE_BYTES) {
        geojsonInline = obj;
        summary.geojsonStats.storedInline = 'true';
      } else {
        warnings.push(
          `GeoJSON grande (${Math.round(serialized.length / 1024)} KB) — apenas resumo importado.`,
        );
      }
      const data: HecRasResultadosEstudo = {
        importedAt: new Date().toISOString(),
        sourceFile: fileName,
        formatoOrigem: 'geojson',
        resumo: summary.resumo,
        pontos: summary.pontos,
        geojsonStats: summary.geojsonStats,
        geojsonInline,
        memorial: '',
      };
      data.memorial = formatHecRasResultadosMemorial(data);
      return { data, warnings, formatoOrigem: 'geojson' };
    }
  }

  throw new Error(
    'Formato não reconhecido. Use JSON AmbientaR-HEC-RAS-resultados, GeoJSON (mapa de inundação) ou CSV de pontos.',
  );
}

export function formatHecRasResultadosMemorial(data: HecRasResultadosEstudo): string {
  const r = data.resumo ?? {};
  const lines = [
    '— Resultados importados HEC-RAS —',
    data.sourceFile ? `Arquivo: ${data.sourceFile}` : '',
    data.importedAt ? `Importado em: ${data.importedAt}` : '',
    r.cenarioModelado ? `Cenário: ${r.cenarioModelado}` : '',
    r.software ? `Software: ${r.software}` : '',
    r.dataSimulacao ? `Data simulação: ${r.dataSimulacao}` : '',
    r.areaInundadaM2 ? `Área inundada: ${r.areaInundadaM2} m²` : '',
    r.profundidadeMaxM ? `Profundidade máxima: ${r.profundidadeMaxM} m` : '',
    r.velocidadeMaxMs ? `Velocidade máxima: ${r.velocidadeMaxMs} m/s` : '',
    r.tempoChegadaMinMin ? `Tempo de chegada (mín.): ${r.tempoChegadaMinMin} min` : '',
    r.tempoChegadaMaxH ? `Tempo de chegada (máx.): ${r.tempoChegadaMaxH} h` : '',
    r.vazaoPicoModeladaM3s ? `Vazão de pico modelada: ${r.vazaoPicoModeladaM3s} m³/s` : '',
  ].filter(Boolean);

  if (data.pontos?.length) {
    lines.push('', 'Pontos de interesse:');
    for (const p of data.pontos.slice(0, 20)) {
      lines.push(
        `• ${p.label ?? '—'}: h=${p.profundidadeMaxM || '—'} m, V=${p.velocidadeMaxMs || '—'} m/s, t=${p.tempoChegadaMin || '—'} min`,
      );
    }
    if (data.pontos.length > 20) {
      lines.push(`… e mais ${data.pontos.length - 20} ponto(s).`);
    }
  }

  if (data.geojsonStats?.featureCount) {
    lines.push(
      '',
      `GeoJSON: ${data.geojsonStats.featureCount} feição(ões)${data.geojsonStats.bbox ? `; bbox ${data.geojsonStats.bbox}` : ''}.`,
    );
  }

  if (data.observacoes) lines.push('', data.observacoes);
  lines.push(
    '',
    'Dados importados para registro no estudo — validar com o RT e com a metodologia do HEC-RAS.',
  );
  return lines.join('\n');
}

export function buildHecRasResultadosExportTemplate(
  estudoId: string,
): HecRasResultadosPackage {
  return {
    format: HEC_RAS_RESULTADOS_FORMAT,
    version: HEC_RAS_RESULTADOS_VERSION,
    exportedAt: new Date().toISOString(),
    software: 'HEC-RAS',
    cenario: 'brecha_sudden',
    resumo: {
      areaInundadaM2: 0,
      profundidadeMaxM: 0,
      velocidadeMaxMs: 0,
      tempoChegadaMinMin: 0,
      dataSimulacao: new Date().toISOString().slice(0, 10),
    },
    pontosInteresse: [
      {
        label: 'Jusante imediato',
        lat: 0,
        lng: 0,
        profundidadeMaxM: 0,
        velocidadeMaxMs: 0,
        tempoChegadaMin: 0,
      },
    ],
    observacoes: `Referência estudoSegurancaId: ${estudoId}. Preencher após simulação no HEC-RAS e reimportar.`,
  };
}

export function downloadHecRasResultadosTemplate(estudoId: string, fileName: string) {
  const tpl = buildHecRasResultadosExportTemplate(estudoId);
  const blob = new Blob([JSON.stringify(tpl, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
