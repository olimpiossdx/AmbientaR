import type { Project } from "@/lib/types";
import { formatProjectCoordinatesDisplay } from "@/lib/coordinates/format-project-display";
import { officeProcessSearchBlob } from "./utils";
import type { ConsultoriaProject, OfficeProcess } from "./types";

type OfficeProcessCadastroRef = Pick<
  OfficeProcess,
  "projectId" | "consultoriaProjectId"
>;

/** Resolve `projects/{id}` a partir do processo ou do projeto de consultoria vinculado. */
export function resolveOfficeProcessCadastroProjectId(
  process: OfficeProcessCadastroRef,
  consultoriaProjects: ConsultoriaProject[],
): string | undefined {
  const direct = process.projectId?.trim();
  if (direct) return direct;
  if (!process.consultoriaProjectId) return undefined;
  return consultoriaProjects.find((cp) => cp.id === process.consultoriaProjectId)
    ?.projectId;
}

/** Resumo read-only SIRGAS 2000 para processos / kanban / sheet. */
export function formatOfficeProcessCoordinates(
  process: OfficeProcessCadastroRef,
  cadastroById: ReadonlyMap<string, Project>,
  consultoriaProjects: ConsultoriaProject[],
): string {
  const cadastroId = resolveOfficeProcessCadastroProjectId(
    process,
    consultoriaProjects,
  );
  if (!cadastroId) return "";
  return formatProjectCoordinatesDisplay(cadastroById.get(cadastroId));
}

type OfficeProcessSearchFields = Parameters<typeof officeProcessSearchBlob>[0] &
  OfficeProcessCadastroRef;

/** Texto de busca do fluxo incluindo coordenadas do cadastro vinculado. */
export function officeProcessSearchBlobWithCadastro(
  process: OfficeProcessSearchFields,
  cadastroById: ReadonlyMap<string, Project>,
  consultoriaProjects: ConsultoriaProject[],
): string {
  const coords = formatOfficeProcessCoordinates(
    process,
    cadastroById,
    consultoriaProjects,
  );
  return [officeProcessSearchBlob(process), coords]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
