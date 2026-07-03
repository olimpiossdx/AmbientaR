/**
 * Exclusão definitiva de utilizador (Firestore + Auth + referências).
 *
 * Uso:
 *   set GOOGLE_APPLICATION_CREDENTIALS=C:\caminho\service-account.json
 *   node scripts/delete-user-by-email.mjs financeiro@consultoriapimenta.com.br
 *
 * Variáveis:
 *   FIREBASE_PROJECT_ID  (padrão: studio-316805764-e4d13)
 *   DRY_RUN=true           só mostra o que seria apagado (não implementado — use com cuidado)
 */

import admin from "firebase-admin";

const email = process.argv[2]?.trim();
if (!email) {
  console.error(
    "Uso: node scripts/delete-user-by-email.mjs <email@dominio.com>",
  );
  process.exit(1);
}

const PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID || "studio-316805764-e4d13";

if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}

const db = admin.firestore();
const authAdmin = admin.auth();

// Reutiliza lógica espelhada (script autónomo, sem TS build)
async function deleteCollection(collectionPath) {
  let total = 0;
  while (true) {
    const snap = await db.collection(collectionPath).limit(400).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    total += snap.size;
    if (snap.size < 400) break;
  }
  return total;
}

async function deleteAccessRequests(uid, userEmail) {
  const refs = new Map();
  if (uid) {
    const byUid = await db
      .collection("access_requests")
      .where("requestedByUserId", "==", uid)
      .get();
    byUid.docs.forEach((d) => refs.set(d.id, d.ref));
  }
  if (userEmail) {
    const byEmail = await db
      .collection("access_requests")
      .where("requestedByEmail", "==", userEmail)
      .get();
    byEmail.docs.forEach((d) => refs.set(d.id, d.ref));
  }
  if (refs.size === 0) return 0;
  const batch = db.batch();
  refs.forEach((ref) => batch.delete(ref));
  await batch.commit();
  return refs.size;
}

async function removeFromApprovedLists(uid) {
  let clients = 0;
  let empreendedores = 0;
  const clientsSnap = await db
    .collection("clients")
    .where("approvedUserIds", "array-contains", uid)
    .get();
  for (const docSnap of clientsSnap.docs) {
    await docSnap.ref.update({
      approvedUserIds: (docSnap.data().approvedUserIds || []).filter(
        (id) => id !== uid,
      ),
    });
    clients++;
  }
  const empSnap = await db
    .collection("empreendedores")
    .where("approvedUserIds", "array-contains", uid)
    .get();
  for (const docSnap of empSnap.docs) {
    await docSnap.ref.update({
      approvedUserIds: (docSnap.data().approvedUserIds || []).filter(
        (id) => id !== uid,
      ),
    });
    empreendedores++;
  }
  return { clients, empreendedores };
}

async function main() {
  console.log(`Projeto: ${PROJECT_ID}`);
  console.log(`E-mail: ${email}`);

  let uid = null;
  let resolvedEmail = email;

  const usersSnap = await db
    .collection("users")
    .where("email", "==", email)
    .limit(5)
    .get();

  if (!usersSnap.empty) {
    uid = usersSnap.docs[0].id;
    resolvedEmail = usersSnap.docs[0].data().email || email;
    console.log(`Firestore users/${uid} encontrado.`);
  } else {
    console.log("Nenhum doc em users/ com este e-mail.");
    try {
      const authUser = await authAdmin.getUserByEmail(email);
      uid = authUser.uid;
      resolvedEmail = authUser.email || email;
      console.log(`Firebase Auth uid=${uid} encontrado.`);
    } catch (e) {
      if (e.code !== "auth/user-not-found") throw e;
      console.log("Nenhum utilizador no Firebase Auth com este e-mail.");
    }
  }

  if (!uid) {
    const ar = await deleteAccessRequests(null, email);
    console.log(`Pedidos access_requests removidos: ${ar}`);
    if (ar === 0) {
      console.error("Nada encontrado para apagar.");
      process.exit(2);
    }
    console.log("Concluído (apenas access_requests órfãos).");
    return;
  }

  const notifications = await deleteCollection(`users/${uid}/notifications`);
  console.log(`Notificações removidas: ${notifications}`);

  const accessRequests = await deleteAccessRequests(uid, resolvedEmail);
  console.log(`Pedidos access_requests removidos: ${accessRequests}`);

  const approved = await removeFromApprovedLists(uid);
  console.log(
    `approvedUserIds limpos — clients: ${approved.clients}, empreendedores: ${approved.empreendedores}`,
  );

  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  if (userSnap.exists) {
    await userRef.delete();
    console.log(`Doc users/${uid} apagado.`);
  }

  try {
    await authAdmin.deleteUser(uid);
    console.log(`Utilizador Auth ${uid} apagado.`);
  } catch (e) {
    if (e.code === "auth/user-not-found") {
      console.log("Auth: utilizador já não existia.");
    } else {
      throw e;
    }
  }

  console.log("Exclusão definitiva concluída.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
