import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";
import type { AppUser, Condicionante } from "@/lib/types";
import { hasAnyRoleOrAdmin, isAdminRole } from "@/lib/role-guards";

function canSkipBackupOnFailure(user: AppUser | null | undefined): boolean {
  return (
    isAdminRole(user?.role) ||
    hasAnyRoleOrAdmin(user?.role, ["gestor", "supervisor"])
  );
}

type SupportedParentCollection = "licenses" | "tacs" | "outorgas" | "intervencoes";

const REFERENCE_TYPE_BY_COLLECTION: Record<
  SupportedParentCollection,
  Condicionante["referenceType"]
> = {
  licenses: "licenca",
  tacs: "tac",
  outorgas: "outorga",
  intervencoes: "intervencao",
};

function sanitizeForBackup<T>(input: T): T {
  return JSON.parse(JSON.stringify(input)) as T;
}

function getActor(user: AppUser | null | undefined) {
  return {
    uid: user?.uid || user?.id || null,
    name: user?.name || null,
    email: user?.email || null,
    role: user?.role || null,
  };
}

export async function backupAndDeleteParentWithCondicionantes(params: {
  firestore: Firestore;
  collectionName: SupportedParentCollection;
  documentId: string;
  user: AppUser | null | undefined;
  reason?: string;
}) {
  const { firestore, collectionName, documentId, user, reason } = params;
  const parentRef = doc(firestore, collectionName, documentId);
  const parentSnap = await getDoc(parentRef);
  if (!parentSnap.exists()) {
    throw new Error("Documento não encontrado para exclusão.");
  }

  const referenceType = REFERENCE_TYPE_BY_COLLECTION[collectionName];
  const condQuery = query(
    collection(firestore, "condicionantes"),
    where("referenceType", "==", referenceType),
    where("referenceId", "==", documentId),
  );
  const condSnap = await getDocs(condQuery);
  const relatedCondicionantes = condSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Condicionante[];

  try {
    await addDoc(collection(firestore, "deleted_data_backups"), {
      sourceCollection: collectionName,
      sourceType: referenceType,
      sourceId: documentId,
      sourceData: sanitizeForBackup(parentSnap.data()),
      relatedCollection: "condicionantes",
      relatedIds: relatedCondicionantes.map((c) => c.id),
      relatedData: sanitizeForBackup(relatedCondicionantes),
      relatedCount: relatedCondicionantes.length,
      deletedBy: getActor(user),
      reason: reason || null,
      deletedAt: serverTimestamp(),
    });
  } catch (backupError) {
    if (!canSkipBackupOnFailure(user)) {
      throw backupError;
    }
  }

  for (const condicionante of relatedCondicionantes) {
    await deleteDoc(doc(firestore, "condicionantes", condicionante.id));
  }
  await deleteDoc(parentRef);
}

export async function backupAndDeleteSingleCondicionante(params: {
  firestore: Firestore;
  condicionanteId: string;
  user: AppUser | null | undefined;
  reason?: string;
}) {
  const { firestore, condicionanteId, user, reason } = params;
  const condRef = doc(firestore, "condicionantes", condicionanteId);
  const condSnap = await getDoc(condRef);
  if (!condSnap.exists()) {
    throw new Error("Condicionante não encontrada para exclusão.");
  }

  try {
    await addDoc(collection(firestore, "deleted_data_backups"), {
      sourceCollection: "condicionantes",
      sourceType: "condicionante",
      sourceId: condicionanteId,
      sourceData: sanitizeForBackup(condSnap.data()),
      relatedCollection: null,
      relatedIds: [],
      relatedData: [],
      relatedCount: 0,
      deletedBy: getActor(user),
      reason: reason || null,
      deletedAt: serverTimestamp(),
    });
  } catch (backupError) {
    if (!canSkipBackupOnFailure(user)) {
      throw backupError;
    }
  }

  await deleteDoc(condRef);
}

/** Exclusão direta (sem backup) — fallback quando backup falha mas delete é permitido. */
export async function deleteCondicionanteDirect(
  firestore: Firestore,
  condicionanteId: string,
): Promise<void> {
  await deleteDoc(doc(firestore, "condicionantes", condicionanteId));
}

export async function restoreDeletedBackup(params: {
  firestore: Firestore;
  backupId: string;
  user: AppUser | null | undefined;
}) {
  const { firestore, backupId, user } = params;
  const backupRef = doc(firestore, "deleted_data_backups", backupId);
  const backupSnap = await getDoc(backupRef);
  if (!backupSnap.exists()) {
    throw new Error("Backup não encontrado.");
  }

  const backup = backupSnap.data() as {
    sourceCollection?: string;
    sourceId?: string;
    sourceData?: Record<string, unknown>;
    relatedCollection?: string | null;
    relatedData?: Array<{ id?: string } & Record<string, unknown>>;
    restoredAt?: unknown;
  };

  if (backup.restoredAt) {
    throw new Error("Este backup já foi restaurado.");
  }
  if (!backup.sourceCollection || !backup.sourceId || !backup.sourceData) {
    throw new Error("Backup inválido para restauração.");
  }

  await setDoc(
    doc(firestore, backup.sourceCollection, backup.sourceId),
    sanitizeForBackup(backup.sourceData),
    { merge: true },
  );

  if (
    backup.relatedCollection &&
    backup.relatedCollection === "condicionantes" &&
    Array.isArray(backup.relatedData)
  ) {
    for (const item of backup.relatedData) {
      if (!item?.id) continue;
      const { id, ...data } = item;
      await setDoc(
        doc(firestore, "condicionantes", id),
        sanitizeForBackup(data),
        { merge: true },
      );
    }
  }

  await updateDoc(backupRef, {
    restoredAt: serverTimestamp(),
    restoredBy: getActor(user),
  });
}
