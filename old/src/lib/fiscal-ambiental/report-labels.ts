import type { FadReportType } from "./types";

export const FAD_REPORT_DISCLAIMER =
  "Este relatório possui caráter técnico auxiliar e não substitui vistoria em campo, " +
  "parecer profissional habilitado, manifestação de órgão ambiental competente ou " +
  "classificação oficial de bases públicas como PRODES, MapBiomas, SICAR ou IDE-Sisema.";

export const REPORT_TYPE_LABELS: Record<FadReportType, string> = {
  acervo: "Relatório de acervo satelital",
  mudancas: "Relatório de mudanças ambientais",
  fiscalizacao: "Relatório de fiscalização preventiva",
  consolidado: "Relatório consolidado do imóvel",
};

export const REPORT_METHODOLOGY =
  "Dados de imagens CBERS/INPE obtidos via catálogo STAC (BDC/INPE), recortes e previews " +
  "armazenados no acervo do workspace. Análises de mudanças e achados preventivos são " +
  "derivados de comparação visual automatizada sobre previews já arquivadas.";
