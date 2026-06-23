/**
 * Constantes leves para UI cliente — evita importar catálogos SIG completos.
 * Valor espelha GEO_ALL_LAYER_COUNT em geo-all-layers.ts (bbox MG continental).
 * Se alterar camadas no catálogo, atualizar com:
 * npx tsx -e "import { GEO_ALL_LAYER_COUNT } from './src/lib/geospatial/geo-all-layers.ts'; console.log(GEO_ALL_LAYER_COUNT)"
 */
export const WAVE_ALL_LAYER_COUNT = 53;
