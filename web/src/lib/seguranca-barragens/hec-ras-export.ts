import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { EstudoSegurancaBarragem, ProjetoTecnicoBarragem } from '@/lib/types';
import { parseNumeroFormulario } from '@/lib/barragem/calculos';
import { DAM_BREAK_CENARIOS } from '@/lib/seguranca-barragens/config';
import { buildSegurancaExportBaseName } from '@/lib/seguranca-barragens/export-filename';

export const HEC_RAS_INSUMOS_FORMAT = 'AmbientaR-HEC-RAS-insumos' as const;
export const HEC_RAS_INSUMOS_VERSION = '1.0' as const;

export type HecRasHydrographPoint = {
  tempo_s: number;
  vazao_m3s: number;
};

export type HecRasInsumosPackage = {
  format: typeof HEC_RAS_INSUMOS_FORMAT;
  version: typeof HEC_RAS_INSUMOS_VERSION;
  generatedAt: string;
  disclaimer: string;
  empreendimento: {
    nome: string;
    municipio?: string;
    uf?: string;
    car?: string;
  };
  classificacao?: {
    categoriaRisco?: string;
    danoPotencialAssociado?: string;
    volumeReservatorioM3?: string;
    alturaBarragemM?: string;
  };
  reservatorio: {
    volumeReservatorioM3?: number;
    volumeMobilizadoM3?: number;
    capacidadeArmazenamentoM3?: number;
  };
  brecha: {
    cenario?: string;
    cenarioLabel?: string;
    larguraM?: number;
    tempoFormacaoH?: number;
    observacoes?: string;
  };
  hidrogramaTriangular: {
    qpM3s: number;
    tempoBaseS: number;
    volumeM3: number;
    pontos: HecRasHydrographPoint[];
    nota: string;
  };
  referencias: {
    estudoSegurancaId: string;
    projetoTecnicoBarragemId?: string;
    geoAnalysisId?: string;
    outorgaProcessoId?: string;
  };
  hecRasChecklist: string[];
};

export type HecRasExportContext = {
  projeto?: ProjetoTecnicoBarragem | null;
  perimeterGeoJson?: Record<string, unknown> | null;
};

export type HecRasExportIssue = {
  field: string;
  message: string;
};

function labelCenario(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return DAM_BREAK_CENARIOS.find((c) => c.value === value)?.label ?? value;
}

/** Hidrograma triangular Qp = 2V/T (manual §13.5). */
export function buildTriangularHydrograph(
  volumeM3: number,
  tempoFormacaoH: number,
  qpOverrideM3s?: number | null,
  steps = 24,
): { qpM3s: number; tempoBaseS: number; volumeM3: number; pontos: HecRasHydrographPoint[] } {
  const T_s = tempoFormacaoH * 3600;
  if (volumeM3 <= 0 || T_s <= 0) {
    return { qpM3s: 0, tempoBaseS: T_s, volumeM3, pontos: [] };
  }
  const Qp = qpOverrideM3s != null && qpOverrideM3s > 0 ? qpOverrideM3s : (2 * volumeM3) / T_s;
  const pontos: HecRasHydrographPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (T_s * i) / steps;
    const q = t <= T_s / 2 ? Qp * ((2 * t) / T_s) : Qp * (2 - (2 * t) / T_s);
    pontos.push({ tempo_s: Number(t.toFixed(2)), vazao_m3s: Number(Math.max(0, q).toFixed(4)) });
  }
  return { qpM3s: Qp, tempoBaseS: T_s, volumeM3, pontos };
}

export function validateHecRasExport(estudo: EstudoSegurancaBarragem): HecRasExportIssue[] {
  const issues: HecRasExportIssue[] = [];
  const db = estudo.damBreak;
  const V = parseNumeroFormulario(db?.volumeMobilizadoM3);
  const T = parseNumeroFormulario(db?.tempoFormacaoH);
  const Qp = parseNumeroFormulario(db?.vazaoPicoM3s);

  if (V == null || V <= 0) {
    issues.push({
      field: 'damBreak.volumeMobilizadoM3',
      message: 'Informe o volume mobilizado (m³) na aba Dam Break.',
    });
  }
  if (T == null || T <= 0) {
    issues.push({
      field: 'damBreak.tempoFormacaoH',
      message: 'Informe o tempo de formação da brecha (h).',
    });
  }
  if ((V == null || T == null) && (Qp == null || Qp <= 0)) {
    issues.push({
      field: 'damBreak.vazaoPicoM3s',
      message: 'Ou informe a vazão de pico Qp (m³/s) já calculada.',
    });
  }
  return issues;
}

export function buildHecRasInsumosJson(
  estudo: EstudoSegurancaBarragem,
  context?: HecRasExportContext,
): HecRasInsumosPackage {
  const db = estudo.damBreak ?? {};
  const V =
    parseNumeroFormulario(db.volumeMobilizadoM3) ??
    parseNumeroFormulario(estudo.classificacao?.volumeReservatorioM3) ??
    parseNumeroFormulario(context?.projeto?.capacidadeArmazenamentoM3) ??
    0;
  const T = parseNumeroFormulario(db.tempoFormacaoH) ?? 1;
  const QpStored = parseNumeroFormulario(db.vazaoPicoM3s);
  const hidro = buildTriangularHydrograph(V, T, QpStored);

  const volRes =
    parseNumeroFormulario(estudo.classificacao?.volumeReservatorioM3) ??
    parseNumeroFormulario(context?.projeto?.capacidadeReservatorio?.volumeArmazenadoM3) ??
    undefined;

  return {
    format: HEC_RAS_INSUMOS_FORMAT,
    version: HEC_RAS_INSUMOS_VERSION,
    generatedAt: new Date().toISOString(),
    disclaimer:
      'Pacote de insumos preliminares para importação manual no HEC-RAS. Não substitui modelagem hidrodinâmica formal, MDT, malha 2D e validação do RT.',
    empreendimento: {
      nome: estudo.empreendimento?.nome ?? '',
      municipio: estudo.empreendimento?.municipio,
      uf: estudo.empreendimento?.uf,
      car: estudo.empreendimento?.car,
    },
    classificacao: estudo.classificacao
      ? {
          categoriaRisco: estudo.classificacao.categoriaRisco,
          danoPotencialAssociado: estudo.classificacao.danoPotencialAssociado,
          volumeReservatorioM3: estudo.classificacao.volumeReservatorioM3,
          alturaBarragemM: estudo.classificacao.alturaBarragemM,
        }
      : undefined,
    reservatorio: {
      volumeReservatorioM3: volRes,
      volumeMobilizadoM3: V > 0 ? V : undefined,
      capacidadeArmazenamentoM3:
        parseNumeroFormulario(context?.projeto?.capacidadeArmazenamentoM3) ?? undefined,
    },
    brecha: {
      cenario: db.cenario,
      cenarioLabel: labelCenario(db.cenario),
      larguraM: parseNumeroFormulario(db.larguraBrechaM) ?? undefined,
      tempoFormacaoH: T,
      observacoes: db.observacoes,
    },
    hidrogramaTriangular: {
      ...hidro,
      nota: 'Hidrograma triangular de triagem (§13.5). Importar como condição de contorno ou lateral inflow no HEC-RAS.',
    },
    referencias: {
      estudoSegurancaId: estudo.id,
      projetoTecnicoBarragemId: estudo.projetoTecnicoBarragemId,
      geoAnalysisId: estudo.geoAnalysisId,
      outorgaProcessoId: estudo.outorgaProcessoId,
    },
    hecRasChecklist: [
      'Preparar MDT do vale a jusante',
      'Corrigir hidrografia (eixo principal)',
      'Criar geometria 1D/2D e malha',
      'Inserir barragem e cenário de brecha',
      'Importar hidrograma de ruptura (pontos em hidrogramaTriangular.pontos)',
      'Definir condições de contorno a jusante',
      'Rodar simulação não permanente',
      'Exportar mapas de profundidade, velocidade e tempo de chegada',
    ],
  };
}

function parseCoord(value: string | undefined): number | null {
  const n = parseNumeroFormulario(value);
  return n != null && Number.isFinite(n) ? n : null;
}

function geometryFromUnknown(geo: unknown): Geometry | null {
  if (!geo || typeof geo !== 'object') return null;
  const g = geo as { type?: string; coordinates?: unknown; geometry?: Geometry };
  if (g.type === 'Feature' && g.geometry) return g.geometry;
  if (g.type && g.coordinates) return geo as Geometry;
  if (g.geometry?.type) return g.geometry;
  return null;
}

export function buildHecRasGeoJson(
  estudo: EstudoSegurancaBarragem,
  context?: HecRasExportContext,
): FeatureCollection {
  const features: Feature[] = [];

  const lat = parseCoord(context?.projeto?.informacoesBasicas?.latitude);
  const lng = parseCoord(context?.projeto?.informacoesBasicas?.longitude);

  if (lat != null && lng != null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
    features.push({
      type: 'Feature',
      properties: {
        tipo: 'barragem_empreendimento',
        nome: estudo.empreendimento?.nome ?? '',
        estudoSegurancaId: estudo.id,
      },
      geometry: { type: 'Point', coordinates: [lng, lat] },
    });
  }

  if (context?.perimeterGeoJson) {
    const geom = geometryFromUnknown(context.perimeterGeoJson);
    if (geom) {
      features.push({
        type: 'Feature',
        properties: {
          tipo: 'perimetro_empreendimento',
          geoAnalysisId: estudo.geoAnalysisId ?? '',
          fonte: 'geo_analyses',
        },
        geometry: geom,
      });
    }
  }

  const db = estudo.damBreak;
  const metaCoords =
    lat != null && lng != null ? ([lng, lat] as [number, number]) : ([0, 0] as [number, number]);
  features.push({
    type: 'Feature',
    properties: {
      tipo: 'dam_break_triagem',
      cenario: db?.cenario ?? '',
      larguraBrechaM: db?.larguraBrechaM ?? '',
      volumeMobilizadoM3: db?.volumeMobilizadoM3 ?? '',
      tempoFormacaoH: db?.tempoFormacaoH ?? '',
      vazaoPicoM3s: db?.vazaoPicoM3s ?? '',
      nota: 'Metadados de triagem — associar ao ponto da barragem no QGIS/HEC-RAS',
    },
    geometry: { type: 'Point', coordinates: metaCoords },
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}

export function buildHecRasExportFileNames(estudo: EstudoSegurancaBarragem): {
  json: string;
  geojson: string;
} {
  const base = buildSegurancaExportBaseName(estudo);
  return {
    json: `${base}_HEC-RAS_insumos.json`,
    geojson: `${base}_HEC-RAS_contexto.geojson`,
  };
}

export function downloadTextFile(content: string, fileName: string, mime: string) {
  const blob = new Blob([content], { type: mime });
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
