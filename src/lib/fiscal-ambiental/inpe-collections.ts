/** Coleções STAC INPE por ano (ver docs/CBERS-ARQUIVO-INPE-PLANO.md). */
export function resolvePreferredCollections(year: number): string[] {
  if (year >= 2023) {
    return ["CB4A-WPM-PCA-FUSED-1", "CB4A-WPM-L4-DN-1", "CB4-PAN5M-L4-DN-1"];
  }
  if (year >= 2019) {
    return ["CB4A-WPM-L4-DN-1", "CB4-PAN5M-L4-DN-1", "CB4-PAN10M-L4-DN-1"];
  }
  if (year >= 2014) {
    return ["CB4-PAN5M-L4-DN-1", "CB4-PAN10M-L4-DN-1", "CB4-MUX-L4-SR-1"];
  }
  if (year >= 2008 && year <= 2010) {
    return ["CB2B-HRC-L2-DN-1", "CB2B-CCD-L2-DN-1"];
  }
  return ["CB4-MUX-L4-SR-1"];
}

export const INPE_STAC_BASE = "https://data.inpe.br/bdc/stac/v1";

export function collectionLabel(collection: string): string {
  if (collection.includes("CB4A") && collection.includes("FUSED")) {
    return "CBERS-4A · ~2 m";
  }
  if (collection.includes("CB4A")) return "CBERS-4A";
  if (collection.includes("PAN5M")) return "CBERS-4 · ~5 m";
  if (collection.includes("HRC")) return "CBERS-2B · ~2,5 m";
  if (collection.includes("MUX")) return "CBERS · arquivo";
  return "CBERS/INPE";
}

export function resolutionMForCollection(collection: string): number {
  if (collection.includes("FUSED") || collection.includes("CB4A-WPM")) return 2;
  if (collection.includes("PAN5M")) return 5;
  if (collection.includes("HRC")) return 2.5;
  return 10;
}
