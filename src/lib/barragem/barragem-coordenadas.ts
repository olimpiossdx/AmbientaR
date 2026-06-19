import type { CoordinateFormat, Datum, Fuso, GeographicLocationFields } from '@/lib/types';
import { decimalToDmsMagnitudes } from '@/lib/coordinates/dms';
import {
  createDefaultMonitoringPontoCoordenadas,
  monitoringCoordenadasToLatLng,
  parseLegacyCoordenadasString,
  type MonitoringPontoCoordenadasForm,
} from '@/lib/monitoring-pontos-form';

/** Converte `geographicLocation` do empreendimento para bloco de formulário. */
export function geographicLocationToBarragemCoordenadas(
  geo?: (GeographicLocationFields & {
    datum?: Datum;
    format?: CoordinateFormat;
  }) | null,
): MonitoringPontoCoordenadasForm {
  const block = createDefaultMonitoringPontoCoordenadas();
  if (!geo) return block;
  if (geo.datum) block.datum = geo.datum;
  if (geo.format) block.format = geo.format;
  if (geo.latLong) {
    block.latLong = {
      lat: {
        grau: geo.latLong.lat?.grau ?? '',
        min: geo.latLong.lat?.min ?? '',
        seg: geo.latLong.lat?.seg ?? '',
      },
      long: {
        grau: geo.latLong.long?.grau ?? '',
        min: geo.latLong.long?.min ?? '',
        seg: geo.latLong.long?.seg ?? '',
      },
    };
  }
  if (geo.utm) {
    block.utm = {
      x: geo.utm.x ?? '',
      y: geo.utm.y ?? '',
      fuso: geo.utm.fuso ?? '23',
    };
  }
  return block;
}

const GMS_AXIS_PATTERN =
  /(\d+)\s*°\s*(\d+)\s*['′]\s*([\d.,]+)\s*["″]?\s*([SOso])/i;

function parseGmsAxisString(
  raw: string | undefined,
  axis: 'lat' | 'lng',
): { grau: string; min: string; seg: string } | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  const match = trimmed.match(GMS_AXIS_PATTERN);
  if (!match) return undefined;
  const suffix = match[4].toUpperCase();
  if (axis === 'lat' && suffix !== 'S') return undefined;
  if (axis === 'lng' && suffix !== 'O') return undefined;
  return { grau: match[1], min: match[2], seg: match[3].replace(',', '.') };
}

/** Reconstrói bloco a partir de `latitude`/`longitude` gravados no memorial. */
export function barragemLatLngStringsToCoordenadas(
  latitude?: string | null,
  longitude?: string | null,
): MonitoringPontoCoordenadasForm {
  const latDms = parseGmsAxisString(latitude ?? undefined, 'lat');
  const lngDms = parseGmsAxisString(longitude ?? undefined, 'lng');
  if (latDms && lngDms) {
    const block = createDefaultMonitoringPontoCoordenadas();
    block.format = 'Lat/Long';
    block.latLong = { lat: latDms, long: lngDms };
    return block;
  }

  const utmLat = latitude?.trim() ?? '';
  const utmLng = longitude?.trim() ?? '';
  const utmMatch = utmLat.match(/E\s*(\d+)/i);
  const northingMatch = utmLng.match(/N\s*(\d+)/i);
  const fusoMatch = utmLat.match(/Fuso\s*(\d+)/i);
  if (utmMatch && northingMatch) {
    const block = createDefaultMonitoringPontoCoordenadas();
    block.format = 'UTM';
    block.utm = {
      x: utmMatch[1],
      y: northingMatch[1],
      fuso: (fusoMatch?.[1] ?? '23') as Fuso,
    };
    return block;
  }

  if (latitude?.trim() && longitude?.trim()) {
    return parseLegacyCoordenadasString(`${latitude.trim()}, ${longitude.trim()}`);
  }

  return createDefaultMonitoringPontoCoordenadas();
}

/** Serializa bloco para strings do memorial (`informacoesBasicas.latitude/longitude`). */
export function barragemCoordenadasToLatLngStrings(
  coordenadas?: MonitoringPontoCoordenadasForm | null,
): { latitude: string; longitude: string } {
  if (!coordenadas?.format) return { latitude: '', longitude: '' };

  if (coordenadas.format === 'Lat/Long') {
    const { lat, lng } = monitoringCoordenadasToLatLng(coordenadas);
    if (lat != null && lng != null) {
      const latDms = decimalToDmsMagnitudes(lat);
      const lngDms = decimalToDmsMagnitudes(lng);
      return {
        latitude: `${latDms.grau}°${latDms.min}'${latDms.seg}"S`,
        longitude: `${lngDms.grau}°${lngDms.min}'${lngDms.seg}"O`,
      };
    }
  }

  if (coordenadas.format === 'UTM' && coordenadas.utm) {
    const { x, y, fuso } = coordenadas.utm;
    if (x?.toString().trim() && y?.toString().trim()) {
      return {
        latitude: `E ${x} (Fuso ${fuso ?? '23'}S)`,
        longitude: `N ${y}`,
      };
    }
  }

  return { latitude: '', longitude: '' };
}

export type { MonitoringPontoCoordenadasForm };
