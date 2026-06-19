import type { CoordinateFormat, GeographicLocationFields } from '@/lib/types';
import { enrichCoordinateBlockWithDecimal } from '@/lib/coordinates';
export { formatCoordenadasProject } from '@/lib/coordinates/format-project-display';

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
