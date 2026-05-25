import { INTERVENTION_SERVICE_LABEL } from "@/lib/intervention-checklist";
import {
  PIA_LICENSING_DOC_ID,
  PIA_LICENSING_DOC_LABEL,
} from "@/lib/pia/pia-licensing-doc";
import { sortByLabelPt, sortByNamePt, sortByPropertyNamePt, sortStringsPt } from "@/lib/sort-pt-br";
/** Serviços disponíveis ao criar/editar processo (ordem alfabética). */
export const PROCESSOS_SERVICES = sortStringsPt([
  INTERVENTION_SERVICE_LABEL,
  "Licenciamento ambiental",
  "Outorga",
  "Reserva legal (Averbação, Compensação e/ou Relocação)",
  "Uso Insignificante",
]);

export const PROCESSOS_STATUS_OPTIONS = sortByLabelPt(
  [
    { value: "Draft" as const, label: "Rascunho" },
    { value: "Submitted" as const, label: "Enviado" },
    { value: "In Progress" as const, label: "Em Andamento" },
    { value: "Completed" as const, label: "Concluído" },
  ],
  (o) => o.label,
);

export type LicensingDocTemplate = { id: string; label: string };

export type LicensingDocState = LicensingDocTemplate & {
  checked: boolean;
  fileName?: string;
  fileUrl?: string;
  source?: string;
  piaId?: string;
};

/** Documentos da fase 2 do licenciamento (ordem alfabética por rótulo). */
export const LICENSING_DOCS_TEMPLATE: LicensingDocTemplate[] = sortByLabelPt(
  [
    { id: "lic_req", label: "Requerimento e FCE/FCEI" },
    { id: "lic_doc_emp", label: "Documentos do empreendedor (CPF/CNPJ e endereço)" },
    { id: "lic_caract", label: "Caracterização do empreendimento e atividade" },
    { id: "lic_uso_solo", label: "Comprovação de uso/ocupação do solo e zoneamento" },
    { id: "lic_car_ambiental", label: "CAR/regularidade ambiental da área (quando aplicável)" },
    { id: "lic_art", label: "ART e responsável técnico" },
    { id: "lic_taxas", label: "Comprovantes de taxas/emolumentos" },
    { id: "lic_estudos", label: "Estudos exigidos (RAS/PCA/RCA/EIA, conforme enquadramento)" },
    { id: PIA_LICENSING_DOC_ID, label: PIA_LICENSING_DOC_LABEL },
  ],
  (d) => d.label,
);

/** Garante novos itens do template (ex.: PIA) em processos antigos. */
export function mergeLicensingDocumentsSaved(
  saved: LicensingDocState[] | undefined,
): LicensingDocState[] {
  const byId = new Map((saved ?? []).map((d) => [d.id, d]));
  return LICENSING_DOCS_TEMPLATE.map((t) => {
    const existing = byId.get(t.id);
    if (existing) {
      return { ...existing, id: t.id, label: t.label };
    }
    return { ...t, checked: false };
  });
}

export const LICENSING_SIZE_UNIT_OPTIONS = sortByLabelPt(
  [
    { value: "ha" as const, label: "ha" },
    { value: "m2" as const, label: "m²" },
    { value: "un" as const, label: "unidade" },
  ],
  (o) => o.label,
);

export const LICENSING_CRITERIO_LOCACIONAL_OPTIONS = sortByLabelPt(
  [
    { value: "0" as const, label: "0 - Sem critério" },
    { value: "1" as const, label: "1 - Médio" },
    { value: "2" as const, label: "2 - Alto" },
  ],
  (o) => o.label,
);

export function sortSelectedProcessosServices(services: string[]): string[] {
  return sortStringsPt(services);
}

/** @deprecated Preferir sortByNamePt */
export function sortEmpreendedoresByName<T extends { name?: string | null }>(
  items: readonly T[],
): T[] {
  return sortByNamePt(items);
}

/** @deprecated Preferir sortByPropertyNamePt */
export function sortProjectsByPropertyName<T extends { propertyName?: string | null }>(
  items: readonly T[],
): T[] {
  return sortByPropertyNamePt(items);
}

export function sortClientsByName<T extends { name?: string | null }>(
  items: readonly T[],
): T[] {
  return sortByNamePt(items);
}

export function sortSuppliersByName<T extends { name?: string | null }>(
  items: readonly T[],
): T[] {
  return sortByNamePt(items);
}

/** Empreendimentos filtrados por empreendedor, ordenados A–Z (pt-BR). */
export function filterProjectsByEmpreendedorId<
  T extends { empreendedorId?: string | null; propertyName?: string | null },
>(
  projects: readonly T[] | null | undefined,
  empreendedorId: string | null | undefined,
  normalizeId: (id: unknown) => string = (id) => String(id ?? "").trim(),
): T[] {
  if (!projects?.length || !empreendedorId) return [];
  const eid = normalizeId(empreendedorId);
  if (!eid) return [];
  const filtered = projects.filter(
    (p) => normalizeId(p.empreendedorId) === eid,
  );
  return sortByPropertyNamePt(filtered);
}

export function sortNavSubItemsByLabel<T extends { label: string }>(
  items: readonly T[],
): T[] {
  return sortByLabelPt(items, (i) => i.label);
}
