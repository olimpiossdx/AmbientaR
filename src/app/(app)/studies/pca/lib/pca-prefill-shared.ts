import type { Project, CoordinateFormat, GeographicLocationFields } from '@/lib/types';
import { enrichCoordinateBlockWithDecimal } from '@/lib/coordinates';

export function formatCoordenadasProject(project: Project): string {
  const geo = project.geographicLocation;
  if (!geo) return '';
  if (geo.format === 'UTM' && geo.utm) {
    const { x, y, fuso } = geo.utm;
    if (x || y) return `E ${x ?? ''} N ${y ?? ''} Fuso ${fuso ?? ''}`.trim();
  }
  if (geo.format === 'Lat/Long' && geo.latLong) {
    const lat = geo.latLong.lat;
    const lng = geo.latLong.long;
    const fmt = (c: { grau?: string; min?: string; seg?: string } | undefined) =>
      [c?.grau, c?.min, c?.seg].filter(Boolean).join('° ');
    return `Lat ${fmt(lat)} / Long ${fmt(lng)}`.trim();
  }
  return '';
}

export function shouldPrefillPcaFromProject(
  status?: string,
  hasSnapshot?: boolean,
): boolean {
  if (status === 'Aprovado' && hasSnapshot) return false;
  return status !== 'Aprovado';
}

/** Cópia profunda segura para prefill a partir do cadastro do empreendimento. */
export function deepCloneRecord<T>(value: T | undefined | null): T | undefined {
  if (value === undefined || value === null) return undefined;
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return undefined;
  }
}

export function cloneProjectListagemBlock(
  project: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  const block = project[key];
  if (!block || typeof block !== 'object') return {};
  return deepCloneRecord(block as Record<string, unknown>) ?? {};
}

/** Deriva `geographicLocation.decimal` no save quando o bloco estruturado está preenchido. */
export function enrichPcaGeographicLocationForFirestore<T extends Record<string, unknown>>(
  values: T,
): T {
  const geo = values.geographicLocation as
    | (Pick<GeographicLocationFields, 'latLong' | 'utm' | 'decimal'> & {
        format?: CoordinateFormat;
      })
    | undefined;
  if (geo?.format == null) return values;
  return {
    ...values,
    geographicLocation: enrichCoordinateBlockWithDecimal(geo, 'format'),
  };
}
