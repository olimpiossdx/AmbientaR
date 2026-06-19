import {
  dispensaLatLngToInputString,
  inputStringToDispensaLatLng,
} from '@/lib/pea/dispensa-coordenadas';

export type InventoryUnitLatLngPair = {
  lat?: string;
  lon?: string;
};

/** Converte par legado lat/lon (strings decimais) para entrada GMS/UTM. */
export function inventoryUnitLatLngToInputString(
  coord?: InventoryUnitLatLngPair | null,
): string {
  return dispensaLatLngToInputString({
    latitude: coord?.lat,
    longitude: coord?.lon,
  });
}

/** Deriva lat/lon decimais (strings) a partir da entrada GMS/UTM. */
export function inputStringToInventoryUnitLatLng(raw: string): InventoryUnitLatLngPair {
  const pair = inputStringToDispensaLatLng(raw);
  return {
    lat: pair.latitude ?? '',
    lon: pair.longitude ?? '',
  };
}
