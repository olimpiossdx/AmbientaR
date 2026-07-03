/**
 * Preenche login_identities para utilizadores existentes (CPF/CNPJ no perfil).
 *
 * Uso:
 *   set GOOGLE_APPLICATION_CREDENTIALS=C:\caminho\service-account.json
 *   node scripts/backfill-login-identities.mjs
 *
 * DRY_RUN=true — apenas lista o que seria gravado.
 */

import admin from "firebase-admin";

const PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID || "studio-316805764-e4d13";
const DRY_RUN = process.env.DRY_RUN === "true";
const COLLECTION = "login_identities";

if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}

const db = admin.firestore();

function normalizeDigits(raw) {
  return (raw ?? "").replace(/\D/g, "").trim();
}

function pickDocument(data) {
  const candidates = [
    data.titularDocument,
    data.cpf,
    data.userCpf,
    ...(Array.isArray(data.cnpjs) ? data.cnpjs : []),
  ];
  for (const c of candidates) {
    const digits = normalizeDigits(c);
    if (digits.length === 11 || digits.length === 14) return digits;
  }
  return null;
}

function documentType(digits) {
  return digits.length === 14 ? "cnpj" : "cpf";
}

async function main() {
  const snap = await db.collection("users").get();
  let created = 0;
  let skipped = 0;
  let conflicts = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const uid = docSnap.id;
    const email = (data.email ?? "").trim().toLowerCase();
    const digits = pickDocument(data);

    if (!digits || !email) {
      skipped++;
      continue;
    }

    const ref = db.collection(COLLECTION).doc(digits);
    const existing = await ref.get();
    if (existing.exists) {
      const otherUid = existing.data()?.uid;
      if (otherUid && otherUid !== uid) {
        console.warn(
          `Conflito: documento ${digits} já pertence a ${otherUid} (ignorando ${uid})`,
        );
        conflicts++;
        continue;
      }
      skipped++;
      continue;
    }

    const payload = {
      uid,
      email,
      documentDigits: digits,
      documentType: documentType(digits),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      backfilled: true,
    };

    if (DRY_RUN) {
      console.log(`[dry-run] ${digits} -> ${email} (${uid})`);
    } else {
      await ref.set(payload);
    }
    created++;
  }

  console.log(
    `Concluído. Criados: ${created}, ignorados: ${skipped}, conflitos: ${conflicts}${
      DRY_RUN ? " (DRY_RUN)" : ""
    }`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
