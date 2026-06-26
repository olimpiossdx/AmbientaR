import type { Feature, MultiPolygon, Polygon } from "geojson";

/** Registro de imóvel rural retornado pelo WFS público do SICAR (camada área do imóvel). */
export type SicarCarRecord = {
  codImovel: string;
  statusCodigo: string;
  statusLabel: string;
  condicao: string;
  /** Status legível para relatórios (código + condição). */
  situacao: string;
  areaHa: number;
  municipio: string;
  uf: string;
  tipoImovel?: string;
  modFiscal?: number;
  dataCriacao?: string;
  dataAtualizacao?: string;
  geometry?: Feature<Polygon | MultiPolygon>;
};

export type SicarCarQueryResult = {
  ok: boolean;
  imoveis: SicarCarRecord[];
  resumo: string;
  error?: string;
  fonte: {
    nome: string;
    url: string;
    metodo: string;
    queriedAtUtc: string;
  };
};
