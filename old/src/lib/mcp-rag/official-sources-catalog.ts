import type { McpRagOfficialSource, OfficialSourceType } from "@/lib/mcp-rag/types";

type SeedSource = {
  id: string;
  name: string;
  sourceType: OfficialSourceType;
  baseUrl: string;
  issuingBody: string;
  notes?: string;
};

/** Catálogo inicial — espelha o plano enterprise (ALMG Dados Abertos como primário). */
export const DEFAULT_OFFICIAL_SOURCES: SeedSource[] = [
  {
    id: "almg-open-data",
    name: "ALMG Dados Abertos — Legislação mineira",
    sourceType: "open_data",
    baseUrl: "https://dadosabertos.almg.gov.br",
    issuingBody: "ALMG",
    notes: "Fonte principal para coleta em massa (desde 1947). Scraping do portal apenas como fallback.",
  },
  {
    id: "almg-portal",
    name: "ALMG Portal — Legislação (fallback)",
    sourceType: "html",
    baseUrl: "https://www.almg.gov.br/atividade-parlamentar/leis/legislacao-mineira/",
    issuingBody: "ALMG",
    notes: "Usar só para lacunas quando Dados Abertos não trouxer texto integral.",
  },
  {
    id: "semad-mg",
    name: "SEMAD / FEAM / normas estaduais MG",
    sourceType: "html",
    baseUrl: "https://www.meioambiente.mg.gov.br",
    issuingBody: "SEMAD",
    notes: "Integração planejada — COPAM, FEAM, IEF, IGAM.",
  },
  {
    id: "diario-oficial-mg",
    name: "Diário Oficial MG",
    sourceType: "pdf",
    baseUrl: "https://www.jornalminasgerais.mg.gov.br",
    issuingBody: "Estado MG",
    notes: "Publicações oficiais — OCR fallback quando PDF escaneado.",
  },
];

export function buildSeedOfficialSource(
  seed: SeedSource,
  now: string,
): Omit<McpRagOfficialSource, "id"> & { id: string } {
  return {
    id: seed.id,
    name: seed.name,
    sourceType: seed.sourceType,
    baseUrl: seed.baseUrl,
    official: true,
    enabled: seed.id === "almg-open-data",
    issuingBody: seed.issuingBody,
    documentCount: 0,
    chunkCount: 0,
    notes: seed.notes,
    createdAt: now,
    updatedAt: now,
  };
}
