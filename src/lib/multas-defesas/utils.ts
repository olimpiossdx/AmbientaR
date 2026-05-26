import type { Project } from "@/lib/types";
import type { AutoInfracaoDefesaRecord, MultaDefesaFase } from "@/lib/multas-defesas/types";
import { inferMultaStatus, type MultaDefesaStatus } from "@/lib/multas-defesas";

export function getNextProcessNumber(
  existing: Array<{ processYear: number; processSequence?: number }>,
  year: number,
): { sequence: number; processNumber: string } {
  const maxSeq = existing
    .filter((d) => d.processYear === year)
    .reduce((acc, item) => Math.max(acc, Number(item.processSequence || 0)), 0);
  const sequence = maxSeq + 1;
  return { sequence, processNumber: `${String(sequence).padStart(4, "0")}/${year}` };
}

export function formatProjectCoordinates(project?: Project | null): string {
  if (!project?.geographicLocation) return "";
  const geo = project.geographicLocation;
  if (geo.format === "UTM" && geo.utm) {
    const x = geo.utm.x || "";
    const y = geo.utm.y || "";
    const fuso = geo.utm.fuso || "";
    const parts = [
      x ? `X: ${x}` : "",
      y ? `Y: ${y}` : "",
      fuso ? `Fuso: ${fuso}` : "",
    ].filter(Boolean);
    return parts.length > 0 ? `UTM ${parts.join(" | ")}` : "";
  }
  if (geo.format === "Lat/Long" && geo.latLong) {
    const lat = geo.latLong.lat || {};
    const lng = geo.latLong.long || {};
    const latTxt = [lat.grau, lat.min, lat.seg].filter(Boolean).join(" ");
    const lngTxt = [lng.grau, lng.min, lng.seg].filter(Boolean).join(" ");
    const parts = [
      latTxt ? `Lat: ${latTxt}` : "",
      lngTxt ? `Long: ${lngTxt}` : "",
    ].filter(Boolean);
    return parts.join(" | ");
  }
  return "";
}

export function inferMultaDefesaFase(record: AutoInfracaoDefesaRecord): MultaDefesaFase {
  if (record.faseAtual) return record.faseAtual;
  const status = inferMultaStatus(record);
  if (
    status === "encerrada_pagamento" ||
    status === "encerrada_parcelamento" ||
    status === "encerrada_pecma"
  ) {
    return "encerrado";
  }
  if (status === "defesa_concluida") return "protocolo";
  if (status === "defesa_em_elaboracao") return "elaboracao";
  if (status === "demanda_defesa_pendente") return "instrucao";
  if (status === "aguardando_opcao") return "abertura";
  return "abertura";
}

export function statusToDefaultFase(status: MultaDefesaStatus): MultaDefesaFase {
  switch (status) {
    case "defesa_em_elaboracao":
      return "elaboracao";
    case "defesa_concluida":
      return "protocolo";
    case "demanda_defesa_pendente":
      return "instrucao";
    case "encerrada_pagamento":
    case "encerrada_parcelamento":
    case "encerrada_pecma":
      return "encerrado";
    default:
      return "abertura";
  }
}

export const STORAGE_PREFIX = "autos-infracao-defesa/";

export const ACCEPTED_DEFESA_EXTENSIONS = [".pdf", ".docx", ".jpg", ".jpeg", ".png"];

export const AUTO_MULTA_ACCEPTED_EXTENSIONS = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
];

export function getExt(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}
