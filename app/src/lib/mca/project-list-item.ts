import type { McaEtapaStatus, McaProjectDoc } from "@/lib/mca/types";

/** Item leve para a lista de projetos MCA (sem perímetro nem tabelas). */
export type McaProjectListItem = {
  id: string;
  title: string;
  currentEtapa: number;
  etapaStatus: Record<string, McaEtapaStatus>;
  meta: {
    propertyName?: string;
    car?: string;
    areaTotalHa?: number;
    municipality?: string;
  };
  createdAt?: string;
  updatedAt?: string;
};

export function toMcaProjectListItem(
  id: string,
  data: McaProjectDoc & { createdAt?: unknown; updatedAt?: unknown },
): McaProjectListItem {
  return {
    id,
    title: data.title,
    currentEtapa: data.currentEtapa,
    etapaStatus: data.etapaStatus,
    meta: {
      propertyName: data.meta?.propertyName,
      car: data.meta?.car,
      areaTotalHa: data.meta?.areaTotalHa,
      municipality: data.meta?.municipality,
    },
    createdAt:
      typeof data.createdAt === "string"
        ? data.createdAt
        : data.createdAt != null &&
            typeof data.createdAt === "object" &&
            "toDate" in data.createdAt
          ? (data.createdAt as { toDate: () => Date }).toDate().toISOString()
          : undefined,
    updatedAt:
      typeof data.updatedAt === "string"
        ? data.updatedAt
        : data.updatedAt != null &&
            typeof data.updatedAt === "object" &&
            "toDate" in data.updatedAt
          ? (data.updatedAt as { toDate: () => Date }).toDate().toISOString()
          : undefined,
  };
}
