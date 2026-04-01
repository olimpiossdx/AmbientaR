/**
 * Chave da API Google Maps (Maps JavaScript API).
 * Definida em .env como NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
 * Usada em: Telemetrico-Leitura (mapa de situação) e demais telas com mapa.
 */
export const GOOGLE_MAPS_API_KEY =
  typeof process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY === 'string'
    ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.trim()
    : '';

export function hasGoogleMapsApiKey(): boolean {
  return GOOGLE_MAPS_API_KEY.length > 0;
}
