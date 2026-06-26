import {
  deleteField,
  doc,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import type { Request } from "@/lib/types";
import type { ConsultoriaProject, OfficeProcess } from "@/lib/gestao-processos/types";

/** IDs de trâmites referenciados em `officeProcesses.requestId`. */
export function collectRequestIdsLinkedViaProcesses(
  processes: OfficeProcess[],
): Set<string> {
  const ids = new Set<string>();
  for (const p of processes) {
    const rid = p.requestId?.trim();
    if (rid) ids.add(rid);
  }
  return ids;
}

/** Trâmite activo sem projeto de consultoria nem vínculo via processo formal. */
export function isOrphanLicenciamentoRequest(
  request: Request,
  processLinkedIds: Set<string>,
): boolean {
  if (request.status === "Completed") return false;
  if (request.consultoriaProjectId?.trim()) return false;
  if (processLinkedIds.has(request.id)) return false;
  return true;
}

export function filterOrphanLicenciamentoRequests(
  requests: Request[],
  processes: OfficeProcess[],
): Request[] {
  const processLinkedIds = collectRequestIdsLinkedViaProcesses(processes);
  return requests.filter((r) => isOrphanLicenciamentoRequest(r, processLinkedIds));
}

export function filterRequestsForConsultoriaProject(
  requests: Request[],
  consultoriaProjectId: string,
): Request[] {
  return requests.filter((r) => r.consultoriaProjectId === consultoriaProjectId);
}

/** Pré-seleciona trâmites do mesmo empreendedor do projeto de consultoria. */
export function suggestOrphanRequestsForProject(
  requests: Request[],
  processes: OfficeProcess[],
  project: ConsultoriaProject,
): Set<string> {
  const orphans = filterOrphanLicenciamentoRequests(requests, processes);
  const suggested = new Set<string>();
  if (!project.empreendedorId) return suggested;
  for (const r of orphans) {
    if (r.empreendedorId === project.empreendedorId) suggested.add(r.id);
  }
  return suggested;
}

export async function linkRequestsToConsultoriaProject(
  firestore: Firestore,
  requestIds: string[],
  consultoriaProjectId: string,
): Promise<number> {
  if (requestIds.length === 0) return 0;
  const batch = writeBatch(firestore);
  for (const id of requestIds) {
    batch.update(doc(firestore, "requests", id), {
      consultoriaProjectId,
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
  return requestIds.length;
}

export async function unlinkRequestFromConsultoriaProject(
  firestore: Firestore,
  requestId: string,
): Promise<void> {
  await updateDoc(doc(firestore, "requests", requestId), {
    consultoriaProjectId: deleteField(),
    updatedAt: serverTimestamp(),
  });
}
