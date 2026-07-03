import type { ResultadoCriterioStatus } from "@/lib/types/analise-socioambiental";

export type ListaAgenteRegistro = {
  rotulo: string;
  data?: string;
  uf?: string;
};

export type ListaAgenteHit = {
  criterioId: string;
  resultado: ResultadoCriterioStatus;
  detalhe: string;
  fonte?: {
    nome: string;
    url: string;
    consultadoEmUtc: string;
  };
  registros?: ListaAgenteRegistro[];
};

export type ListasAgenteResult = {
  documento: string;
  documentoMascarado: string;
  consultadoEmUtc: string;
  hits: ListaAgenteHit[];
};
