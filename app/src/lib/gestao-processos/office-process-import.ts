import {
  collection,
  deleteField,
  doc,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import type { Empreendedor } from "@/lib/types";
import type {
  ConsultoriaProject,
  ConsultoriaProjectPlannedProcessType,
  OfficeProcess,
  OfficeProcessImportPreview,
  OfficeProcessPipeline,
} from "@/lib/gestao-processos/types";
import { resolveEmpreendedorIdByName } from "@/lib/gestao-processos/match-empreendedor";
import {
  inferPlannedProcessType,
  inferProcessGroup,
  resolveImportRows,
  suggestConsultoriaProjectForProcess,
  type ImportResolutionContext,
} from "@/lib/gestao-processos/consultoria-project-utils";
import { inferPipelineFieldsFromImportRow, syncFaseFromPipeline } from "@/lib/gestao-processos/pipeline-utils";
import {
  buildOfficeProcessExternalKey,
  detectTipoProcesso,
} from "@/lib/gestao-processos/utils";

function omitUndefined(values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined),
  );
}

export type OfficeProcessImportResult = {
  created: number;
  updated: number;
  linked: number;
  unresolvedProjects: { rowNumber: number; projetoRef: string }[];
};

export async function commitOfficeProcessImport(
  firestore: Firestore,
  preview: OfficeProcessImportPreview,
  options: {
    seedValidation: boolean;
    empreendedores?: Empreendedor[];
    consultoriaProjects?: ConsultoriaProject[];
    existingByKey: Map<string, OfficeProcess>;
  },
): Promise<OfficeProcessImportResult> {
  const context: ImportResolutionContext = {
    empreendedores: options.empreendedores,
    consultoriaProjects: options.consultoriaProjects,
  };
  const { resolved, unresolvedProjects } = resolveImportRows(preview, context);

  const batch = writeBatch(firestore);
  let created = 0;
  let updated = 0;
  let linked = 0;

  for (const { row, consultoriaProjectId } of resolved) {
    const tipoProcesso =
      row.tipoProcesso ?? detectTipoProcesso(row.numeroProcesso);
    const externalKey = buildOfficeProcessExternalKey(
      tipoProcesso,
      row.numeroProcesso,
    );
    const empreendedorId = resolveEmpreendedorIdByName(
      row.empreendedorName,
      options.empreendedores,
    );

    const pipelineFields = inferPipelineFieldsFromImportRow(
      row.fase,
      tipoProcesso,
      row.numeroProcesso,
      row.statusDetalhe,
    );
    const processGroup = inferProcessGroup(row.tipoIntervencao);

    const payload = omitUndefined({
      externalKey,
      tipoProcesso,
      numeroProcesso: row.numeroProcesso,
      empreendedorName: row.empreendedorName,
      empreendimentoName: row.empreendimentoName,
      municipio: row.municipio,
      tipoIntervencao: row.tipoIntervencao,
      fase: pipelineFields.fase,
      pipeline: pipelineFields.pipeline,
      etapa: pipelineFields.etapa,
      processGroup,
      plannedProcessType: inferPlannedProcessType({
        processGroup,
        tipoIntervencao: row.tipoIntervencao,
      }),
      statusDetalhe: row.statusDetalhe,
      prazo: row.prazo,
      empreendedorId,
      consultoriaProjectId,
      fonte: "excel" as const,
      seedValidation: options.seedValidation,
      updatedAt: serverTimestamp(),
    });

    const existing = options.existingByKey.get(externalKey);
    if (existing) {
      batch.update(doc(firestore, "officeProcesses", existing.id), payload);
      updated++;
      if (consultoriaProjectId) linked++;
    } else {
      const ref = doc(collection(firestore, "officeProcesses"));
      batch.set(ref, { ...payload, createdAt: serverTimestamp() });
      created++;
      if (consultoriaProjectId) linked++;
    }
  }

  await batch.commit();
  return { created, updated, linked, unresolvedProjects };
}

export async function linkProcessToConsultoriaProject(
  firestore: Firestore,
  processId: string,
  consultoriaProjectId: string | null,
  plannedProcessType?: ConsultoriaProjectPlannedProcessType | null,
): Promise<void> {
  const payload: Record<string, unknown> = {
    consultoriaProjectId: consultoriaProjectId
      ? consultoriaProjectId
      : deleteField(),
    updatedAt: serverTimestamp(),
  };
  if (!consultoriaProjectId) {
    payload.plannedProcessType = deleteField();
  } else if (plannedProcessType) {
    payload.plannedProcessType = plannedProcessType;
  }
  await updateDoc(doc(firestore, "officeProcesses", processId), payload);
}

export async function linkProcessesToConsultoriaProject(
  firestore: Firestore,
  processIds: string[],
  consultoriaProjectId: string,
  plannedProcessType?: ConsultoriaProjectPlannedProcessType | null,
): Promise<number> {
  if (!processIds.length) return 0;
  const batch = writeBatch(firestore);
  for (const id of processIds) {
    batch.update(doc(firestore, "officeProcesses", id), {
      consultoriaProjectId,
      ...(plannedProcessType ? { plannedProcessType } : {}),
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
  return processIds.length;
}

export async function clearConsultoriaProjectLinks(
  firestore: Firestore,
  consultoriaProjectId: string,
  processes: OfficeProcess[],
): Promise<number> {
  const toClear = processes.filter(
    (p) => p.consultoriaProjectId === consultoriaProjectId,
  );
  if (!toClear.length) return 0;

  const batch = writeBatch(firestore);
  for (const p of toClear) {
    batch.update(doc(firestore, "officeProcesses", p.id), {
      consultoriaProjectId: deleteField(),
      plannedProcessType: deleteField(),
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
  return toClear.length;
}

export async function autoLinkProcessesToProjects(
  firestore: Firestore,
  processes: OfficeProcess[],
  projects: ConsultoriaProject[],
): Promise<number> {
  const toLink: {
    processId: string;
    projectId: string;
    plannedProcessType: ConsultoriaProjectPlannedProcessType;
  }[] = [];

  for (const process of processes) {
    if (process.consultoriaProjectId) continue;
    const suggested = suggestConsultoriaProjectForProcess(process, projects);
    if (suggested) {
      toLink.push({
        processId: process.id,
        projectId: suggested.id,
        plannedProcessType: inferPlannedProcessType(process),
      });
    }
  }

  if (!toLink.length) return 0;

  const batch = writeBatch(firestore);
  for (const { processId, projectId, plannedProcessType } of toLink) {
    batch.update(doc(firestore, "officeProcesses", processId), {
      consultoriaProjectId: projectId,
      plannedProcessType,
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
  return toLink.length;
}

export async function moveProcessEtapa(
  firestore: Firestore,
  processId: string,
  pipeline: OfficeProcessPipeline,
  etapa: OfficeProcess["etapa"],
  extras?: Partial<
    Pick<
      OfficeProcess,
      "numeroProcesso" | "dataProtocolo" | "prioridade" | "processGroup"
    >
  >,
): Promise<void> {
  if (!etapa) return;
  const fase = syncFaseFromPipeline(pipeline, etapa);
  await updateDoc(doc(firestore, "officeProcesses", processId), {
    pipeline,
    etapa,
    fase,
    ...extras,
    updatedAt: serverTimestamp(),
  });
}
