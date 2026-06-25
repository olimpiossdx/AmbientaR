import type { Empreendedor, Project } from "@/lib/types";
import {
  filterProjectsByEmpreendedorId,
  sortEmpreendedoresByName,
  sortProjectsByPropertyName,
} from "@/lib/processos-form-order";

export function onlyDigitsCpfCnpj(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

/** IDs de empreendedores cujo CPF/CNPJ coincide com o do cliente titular. */
export function empreendedorIdsMatchingClientCpfCnpj(
  empreendedores: readonly { id: string; cpfCnpj?: string | null }[],
  clientCpfCnpj: string | null | undefined,
): string[] {
  const clientDigits = onlyDigitsCpfCnpj(clientCpfCnpj);
  if (clientDigits.length < 11) return [];
  return empreendedores
    .filter((e) => {
      if (!e.cpfCnpj) return false;
      const digits = onlyDigitsCpfCnpj(e.cpfCnpj);
      return digits === clientDigits || e.cpfCnpj === clientCpfCnpj;
    })
    .map((e) => e.id);
}

/** Empreendimentos vinculados ao cliente (via CPF/CNPJ do empreendedor). */
export function filterProjectsForClientCpfCnpj(
  projects: readonly Project[] | null | undefined,
  empreendedores: readonly { id: string; cpfCnpj?: string | null }[],
  clientCpfCnpj: string | null | undefined,
): Project[] {
  if (!projects?.length) return [];
  const empIds = empreendedorIdsMatchingClientCpfCnpj(
    empreendedores,
    clientCpfCnpj,
  );
  if (empIds.length === 0) return [];
  return sortProjectsByPropertyName(
    projects.filter(
      (p) => p.empreendedorId && empIds.includes(p.empreendedorId),
    ),
  );
}

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
