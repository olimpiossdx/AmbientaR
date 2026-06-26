/** ID sintético para Etapa 2 quando o relatório factual está só na sessão (sem Firestore). */
export const SESSION_GEO_ANALYSIS_ID = "__session_current__";

export function isSessionGeoAnalysisId(id: string | null | undefined): boolean {
  return id === SESSION_GEO_ANALYSIS_ID;
}
