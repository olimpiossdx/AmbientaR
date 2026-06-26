/** Consulta pública SICAR — mapa por município (D6). */
export const CAR_PORTAL_PUBLICO_URL =
  "https://consultapublica.car.gov.br/publico/imoveis/index";

/** Portal nacional — demonstrativo por número de recibo CAR. */
export const CAR_PORTAL_CONSULTAR_URL = "https://www.car.gov.br/#/consultar";

export const CAR_PORTAL_HOME_URL = "https://www.car.gov.br/";

/** Link principal para abrir consulta pública (mapa). */
export function buildCarPortalPublicoUrl(): string {
  return CAR_PORTAL_PUBLICO_URL;
}

/** Link para página de consulta de demonstrativo (utilizador cola o recibo CAR). */
export function buildCarDemonstrativoUrl(_codImovel?: string): string {
  return CAR_PORTAL_CONSULTAR_URL;
}
