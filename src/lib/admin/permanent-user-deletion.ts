import type { Auth } from "firebase-admin/auth";
import type {
  DocumentData,
  DocumentReference,
  Firestore,
  QuerySnapshot,
} from "firebase-admin/firestore";

const BATCH_LIMIT = 400;

async function deleteQueryBatch(
  db: Firestore,
  querySnap: QuerySnapshot<DocumentData>,
): Promise<number> {
  if (querySnap.empty) return 0;
  const batch = db.batch();
  querySnap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return querySnap.size;
}

async function deleteCollection(
  db: Firestore,
  collectionPath: string,
): Promise<number> {
  let total = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const snap = await db.collection(collectionPath).limit(BATCH_LIMIT).get();
    if (snap.empty) break;
    total += await deleteQueryBatch(db, snap);
    if (snap.size < BATCH_LIMIT) break;
  }
  return total;
}

async function removeUidFromApprovedLists(
  db: Firestore,
  uid: string,
): Promise<{ clients: number; empreendedores: number }> {
  let clients = 0;
  let empreendedores = 0;

  const clientsSnap = await db
    .collection("clients")
    .where("approvedUserIds", "array-contains", uid)
    .get();
  for (const docSnap of clientsSnap.docs) {
    await docSnap.ref.update({
      approvedUserIds: (docSnap.data().approvedUserIds as string[]).filter(
        (id) => id !== uid,
      ),
    });
    clients += 1;
  }

  const empSnap = await db
    .collection("empreendedores")
    .where("approvedUserIds", "array-contains", uid)
    .get();
  for (const docSnap of empSnap.docs) {
    await docSnap.ref.update({
      approvedUserIds: (docSnap.data().approvedUserIds as string[]).filter(
        (id) => id !== uid,
      ),
    });
    empreendedores += 1;
  }

  const clientsConsultorSnap = await db
    .collection("clients")
    .where("approvedConsultorIds", "array-contains", uid)
    .get();
  for (const docSnap of clientsConsultorSnap.docs) {
    const data = docSnap.data();
    await docSnap.ref.update({
      approvedConsultorIds: (data.approvedConsultorIds as string[]).filter(
        (id) => id !== uid,
      ),
      ...(data.primaryConsultorUid === uid ? { primaryConsultorUid: "" } : {}),
    });
    clients += 1;
  }

  const empConsultorSnap = await db
    .collection("empreendedores")
    .where("approvedConsultorIds", "array-contains", uid)
    .get();
  for (const docSnap of empConsultorSnap.docs) {
    const data = docSnap.data();
    await docSnap.ref.update({
      approvedConsultorIds: (data.approvedConsultorIds as string[]).filter(
        (id) => id !== uid,
      ),
      ...(data.primaryConsultorUid === uid ? { primaryConsultorUid: "" } : {}),
    });
    empreendedores += 1;
  }

  return { clients, empreendedores };
}

async function deleteAccessRequestsForUser(
  db: Firestore,
  uid: string,
  email?: string,
): Promise<number> {
  const refs = new Map<string, DocumentReference>();

  if (uid) {
    const byUid = await db
      .collection("access_requests")
      .where("requestedByUserId", "==", uid)
      .get();
    byUid.docs.forEach((d) => refs.set(d.id, d.ref));
  }

  if (email) {
    const byEmail = await db
      .collection("access_requests")
      .where("requestedByEmail", "==", email)
      .get();
    byEmail.docs.forEach((d) => refs.set(d.id, d.ref));
  }

  if (refs.size === 0) return 0;

  const batch = db.batch();
  refs.forEach((ref) => batch.delete(ref));
  await batch.commit();
  return refs.size;
}

export type PermanentDeleteResult = {
  uid: string | null;
  email: string;
  firestoreUserDeleted: boolean;
  authUserDeleted: boolean;
  accessRequestsDeleted: number;
  notificationsDeleted: number;
  approvedListsCleared: { clients: number; empreendedores: number };
};

export async function permanentlyDeleteUser(
  db: Firestore,
  authAdmin: Auth,
  options: { userId?: string; email?: string },
): Promise<PermanentDeleteResult> {
  const emailInput = (options.email ?? "").trim();
  let uid = (options.userId ?? "").trim() || null;
  let resolvedEmail = emailInput;

  if (!uid && emailInput) {
    const usersByEmail = await db
      .collection("users")
      .where("email", "==", emailInput)
      .limit(5)
      .get();
    if (!usersByEmail.empty) {
      uid = usersByEmail.docs[0]!.id;
      resolvedEmail =
        (usersByEmail.docs[0]!.data().email as string) || emailInput;
    }
  }

  if (!uid && emailInput) {
    try {
      const authUser = await authAdmin.getUserByEmail(emailInput);
      uid = authUser.uid;
      resolvedEmail = authUser.email ?? emailInput;
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: string }).code)
          : "";
      if (code !== "auth/user-not-found") throw err;
    }
  }

  if (uid && !resolvedEmail) {
    const userSnap = await db.collection("users").doc(uid).get();
    resolvedEmail = (userSnap.data()?.email as string) ?? "";
  }

  const result: PermanentDeleteResult = {
    uid,
    email: resolvedEmail || emailInput,
    firestoreUserDeleted: false,
    authUserDeleted: false,
    accessRequestsDeleted: 0,
    notificationsDeleted: 0,
    approvedListsCleared: { clients: 0, empreendedores: 0 },
  };

  if (uid) {
    result.notificationsDeleted = await deleteCollection(
      db,
      `users/${uid}/notifications`,
    );
    result.accessRequestsDeleted = await deleteAccessRequestsForUser(
      db,
      uid,
      resolvedEmail || undefined,
    );
    result.approvedListsCleared = await removeUidFromApprovedLists(db, uid);

    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    if (userSnap.exists) {
      await userRef.delete();
      result.firestoreUserDeleted = true;
    }

    try {
      await authAdmin.deleteUser(uid);
      result.authUserDeleted = true;
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: string }).code)
          : "";
      if (code !== "auth/user-not-found") throw err;
    }
  } else if (resolvedEmail || emailInput) {
    result.accessRequestsDeleted = await deleteAccessRequestsForUser(
      db,
      "",
      resolvedEmail || emailInput,
    );
  }

  if (!uid && !result.firestoreUserDeleted && !result.authUserDeleted) {
    if (result.accessRequestsDeleted === 0) {
      throw new Error(
        "Utilizador não encontrado no Firestore nem no Firebase Auth.",
      );
    }
  }

  return result;
}
