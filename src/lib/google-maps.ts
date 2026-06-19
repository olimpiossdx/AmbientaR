import { firebaseConfig } from "@/firebase/config";

/**
 * Chave da API Google Maps (Maps JavaScript API).
 * Preferência: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no `.env.local`.
 * Fallback: apiKey do projeto Firebase (mesmo projeto GCP).
 * Usada em: Telemetrico-Leitura (mapa de situação) e demais telas com mapa.
 */
function readEnvMapsKey(): string {
  const fromEnv = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (typeof fromEnv === "string" && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }
  const fromFirebase =
    typeof firebaseConfig.apiKey === "string" ? firebaseConfig.apiKey.trim() : "";
  return fromFirebase;
}

export const GOOGLE_MAPS_API_KEY = readEnvMapsKey();

export function hasGoogleMapsApiKey(): boolean {
  return GOOGLE_MAPS_API_KEY.length > 0;
}
