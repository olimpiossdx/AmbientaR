import {
  formatCoordinateBlockForLegacyString,
  latLngToMonitoringCoordenadas,
  monitoringCoordenadasToLatLng,
  parseLegacyCoordenadasString,
} from '@/lib/monitoring-pontos-form';

export type DispensaCoordenadasPair = {
  latitude?: string;
  longitude?: string;
};

function parseOptionalNumber(raw?: string | null): number | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  const normalized = trimmed.replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
}

/** Converte par legado latitude/longitude para string editável no CoordinateStringField. */
export function dispensaLatLngToInputString(
  coord?: DispensaCoordenadasPair | null,
): string {
  const lat = parseOptionalNumber(coord?.latitude);
  const lng = parseOptionalNumber(coord?.longitude);
  if (lat == null || lng == null) return '';
  return formatCoordinateBlockForLegacyString(latLngToMonitoringCoordenadas(lat, lng));
}

/** Deriva latitude/longitude decimais (strings) a partir da entrada GMS/UTM. */
export function inputStringToDispensaLatLng(raw: string): DispensaCoordenadasPair {
  const { lat, lng } = monitoringCoordenadasToLatLng(parseLegacyCoordenadasString(raw));
  if (lat == null || lng == null) {
    return { latitude: '', longitude: '' };
  }
  return {
    latitude: String(lat),
    longitude: String(lng),
  };
}
