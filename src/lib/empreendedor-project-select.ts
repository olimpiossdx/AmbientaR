import type { Empreendedor, Project } from "@/lib/types";
import {
  filterProjectsByEmpreendedorId,
  sortEmpreendedoresByName,
  sortProjectsByPropertyName,
} from "@/lib/processos-form-order";

/** Normaliza IDs vindos do Firestore ou de selects. */
export function normalizeEntityId(raw: unknown): string {
  if (raw == null) return "";
  return String(raw).trim();
}

/**
 * Garante que o empreendedor já gravado aparece na lista do Select
 * (evita campo “vazio” ao reabrir rascunho antes da coleção carregar).
 */
export function buildEmpreendedorSelectOptions(params: {
  list: readonly Empreendedor[] | null | undefined;
  selectedId: string;
  linkedDoc?: Empreendedor | null;
  /** Em modo leitura, restringe à entidade do registo. */
  restrictToId?: string;
}): Empreendedor[] {
  const selected = normalizeEntityId(params.selectedId);
  let base = [...(params.list ?? [])];

  if (params.restrictToId) {
    const rid = normalizeEntityId(params.restrictToId);
    base = base.filter((e) => e.id === rid);
  }

  if (selected && !base.some((e) => e.id === selected)) {
    const linked =
      params.linkedDoc && params.linkedDoc.id === selected
        ? params.linkedDoc
        : ({
            id: selected,
            name: "Empreendedor (vinculado)",
            email: "",
            phone: "",
            address: "",
          } satisfies Empreendedor);
    base = [linked, ...base];
  }

  return sortEmpreendedoresByName(base);
}

/**
 * Lista de empreendimentos para o Select, incluindo o já vinculado ao registo
 * mesmo que o filtro por empreendedor ou a coleção ainda não tenham carregado.
 */
export function buildProjectSelectOptions(params: {
  allProjects: readonly Project[] | null | undefined;
  empreendedorId: string;
  selectedProjectId?: string | null;
  linkedDoc?: Project | null;
}): Project[] {
  const empreendedorId = normalizeEntityId(params.empreendedorId);
  const selectedProjectId = normalizeEntityId(params.selectedProjectId);

  const filtered = filterProjectsByEmpreendedorId(
    params.allProjects,
    empreendedorId,
    normalizeEntityId,
  );

  if (!selectedProjectId) return filtered;

  if (filtered.some((p) => p.id === selectedProjectId)) return filtered;

  const fromAll = params.allProjects?.find((p) => p.id === selectedProjectId);
  const linked =
    params.linkedDoc && params.linkedDoc.id === selectedProjectId
      ? params.linkedDoc
      : fromAll;

  if (linked) {
    return sortProjectsByPropertyName([linked, ...filtered]);
  }

  return sortProjectsByPropertyName([
    {
      id: selectedProjectId,
      empreendedorId: empreendedorId || "",
      activity: "",
      propertyName: "Empreendimento (vinculado)",
    } satisfies Project,
    ...filtered,
  ]);
}
