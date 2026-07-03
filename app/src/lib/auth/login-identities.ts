import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import {
  buildCpfCnpjVariants,
  normalizeDocumentDigits,
} from "@/lib/auth/document-lookup.server";
import { detectCpfCnpjKind, isValidCpfCnpj } from "@/lib/cpf-cnpj";

export const LOGIN_IDENTITIES_COLLECTION = "login_identities";

export type LoginIdentityDoc = {
  uid: string;
  email: string;
  documentDigits: string;
  documentType: "cpf" | "cnpj";
  createdAt: string;
  updatedAt?: string;
};

export function parseLoginIdentifier(raw: string): {
  kind: "email" | "document";
  email?: string;
  documentDigits?: string;
  documentType?: "cpf" | "cnpj";
} {
  const trimmed = raw.trim();
  if (trimmed.includes("@")) {
    return { kind: "email", email: trimmed.toLowerCase() };
  }

  const digits = normalizeDocumentDigits(trimmed);
  if (!isValidCpfCnpj(digits)) {
    throw new Error("Informe um e-mail, CPF ou CNPJ válido.");
  }

  const docKind = detectCpfCnpjKind(digits);
  if (docKind !== "cpf" && docKind !== "cnpj") {
    throw new Error("Informe um e-mail, CPF ou CNPJ válido.");
  }

  return {
    kind: "document",
    documentDigits: digits,
    documentType: docKind,
  };
}

export async function findUidByDocument(
  db: Firestore,
  documentDigits: string,
): Promise<string | null> {
  const identitySnap = await db
    .collection(LOGIN_IDENTITIES_COLLECTION)
    .doc(documentDigits)
    .get();

  if (identitySnap.exists) {
    const data = identitySnap.data() as LoginIdentityDoc;
    return data.uid || null;
  }

  const variants = buildCpfCnpjVariants(documentDigits).slice(0, 10);
  if (variants.length === 0) return null;

  const fields = ["cpf", "userCpf", "titularDocument"] as const;
  for (const field of fields) {
    const snap = await db
      .collection("users")
      .where(field, "in", variants)
      .limit(1)
      .get();
    if (!snap.empty) return snap.docs[0].id;
  }

  return null;
}

export async function findEmailByDocument(
  db: Firestore,
  documentDigits: string,
): Promise<string | null> {
  const uid = await findUidByDocument(db, documentDigits);
  if (!uid) return null;
  const userSnap = await db.collection("users").doc(uid).get();
  if (!userSnap.exists) return null;
  const email = userSnap.data()?.email as string | undefined;
  return email?.trim() ? email.trim().toLowerCase() : null;
}

export async function isDocumentAvailable(
  db: Firestore,
  documentDigits: string,
  excludeUid?: string,
): Promise<boolean> {
  const existingUid = await findUidByDocument(db, documentDigits);
  if (!existingUid) return true;
  if (excludeUid && existingUid === excludeUid) return true;
  return false;
}

export async function registerLoginIdentity(
  db: Firestore,
  params: {
    uid: string;
    email: string;
    documentDigits: string;
    documentType: "cpf" | "cnpj";
  },
): Promise<void> {
  const email = params.email.trim().toLowerCase();
  const digits = normalizeDocumentDigits(params.documentDigits);
  if (!isValidCpfCnpj(digits)) {
    throw new Error("Documento inválido para login.");
  }

  const available = await isDocumentAvailable(db, digits, params.uid);
  if (!available) {
    throw new Error("Este CPF/CNPJ já está vinculado a outra conta.");
  }

  const now = new Date().toISOString();
  await db
    .collection(LOGIN_IDENTITIES_COLLECTION)
    .doc(digits)
    .set(
      {
        uid: params.uid,
        email,
        documentDigits: digits,
        documentType: params.documentType,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true },
    );
}

export async function resolveLoginEmail(
  db: Firestore,
  identifier: string,
): Promise<string> {
  const parsed = parseLoginIdentifier(identifier);
  if (parsed.kind === "email" && parsed.email) {
    return parsed.email;
  }
  if (parsed.kind === "document" && parsed.documentDigits) {
    const email = await findEmailByDocument(db, parsed.documentDigits);
    if (!email) {
      throw new Error("INVALID_CREDENTIALS");
    }
    return email;
  }
  throw new Error("INVALID_CREDENTIALS");
}
