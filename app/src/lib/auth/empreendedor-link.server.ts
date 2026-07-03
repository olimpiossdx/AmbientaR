import { FieldValue } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import { lookupClientAndEmpreendedorByDocumentAdmin } from "@/lib/auth/document-lookup.server";
import { buildTitularProfileDocumentFields } from "@/lib/titular-profile-document";
import { isTitularPortalRole } from "@/lib/titular-profile-document";
import type { AppUser, UserRole } from "@/lib/types";

export type EmpreendedorLinkResult = {
  linkedClientId?: string;
  linkedEmpreendedorId?: string;
  titularDocument?: string;
  titularType?: "pessoa_fisica" | "pessoa_juridica";
  cpf?: string;
  cnpjs?: string[];
};

export async function resolveEmpreendedorLinkByDocument(
  db: Firestore,
  documentDigits: string,
  role?: UserRole,
): Promise<EmpreendedorLinkResult | undefined> {
  if (role && !isTitularPortalRole(role)) return undefined;

  const titularFields = buildTitularProfileDocumentFields(documentDigits);
  if (!titularFields) return undefined;

  const { client, empreendedor } =
    await lookupClientAndEmpreendedorByDocumentAdmin(db, documentDigits);

  let linkedEmpreendedorId = empreendedor?.id;
  if (!linkedEmpreendedorId && client?.id) {
    const empByClient = await db
      .collection("empreendedores")
      .where("sourceClientId", "==", client.id)
      .limit(1)
      .get();
    if (!empByClient.empty) {
      linkedEmpreendedorId = empByClient.docs[0].id;
    }
  }

  return {
    linkedClientId: client?.id,
    linkedEmpreendedorId,
    titularDocument: titularFields.titularDocument,
    titularType: titularFields.titularType ?? undefined,
    cpf: titularFields.cpf || undefined,
    cnpjs: titularFields.cnpjs.length ? titularFields.cnpjs : undefined,
  };
}

export async function syncEmpreendedorLinkForUser(
  db: Firestore,
  user: AppUser,
): Promise<AppUser> {
  if (!isTitularPortalRole(user.role)) return user;

  const documentDigits =
    user.titularDocument?.replace(/\D/g, "") ||
    user.cpf?.replace(/\D/g, "") ||
    user.userCpf?.replace(/\D/g, "") ||
    user.cnpjs?.[0]?.replace(/\D/g, "") ||
    "";

  if (documentDigits.length !== 11 && documentDigits.length !== 14) {
    return user;
  }

  if (user.linkedEmpreendedorId && user.linkedClientId) {
    return user;
  }

  const link = await resolveEmpreendedorLinkByDocument(
    db,
    documentDigits,
    user.role,
  );
  if (!link) return user;

  const patch: Record<string, unknown> = { lastLogin: FieldValue.serverTimestamp() };
  let changed = false;

  if (link.linkedClientId && !user.linkedClientId) {
    patch.linkedClientId = link.linkedClientId;
    changed = true;
  }
  if (link.linkedEmpreendedorId && !user.linkedEmpreendedorId) {
    patch.linkedEmpreendedorId = link.linkedEmpreendedorId;
    changed = true;
  }
  if (!user.titularDocument && link.titularDocument) {
    patch.titularDocument = link.titularDocument;
    patch.titularType = link.titularType;
    changed = true;
  }
  if (!user.cpf && link.cpf) {
    patch.cpf = link.cpf;
    patch.userCpf = link.cpf;
    changed = true;
  }
  if ((!user.cnpjs || user.cnpjs.length === 0) && link.cnpjs?.length) {
    patch.cnpjs = link.cnpjs;
    changed = true;
  }

  if (!changed) return user;

  await db.collection("users").doc(user.uid).set(patch, { merge: true });

  return {
    ...user,
    linkedClientId: (patch.linkedClientId as string) ?? user.linkedClientId,
    linkedEmpreendedorId:
      (patch.linkedEmpreendedorId as string) ?? user.linkedEmpreendedorId,
    titularDocument: (patch.titularDocument as string) ?? user.titularDocument,
    titularType: (patch.titularType as AppUser["titularType"]) ?? user.titularType,
    cpf: (patch.cpf as string) ?? user.cpf,
    userCpf: (patch.userCpf as string) ?? user.userCpf,
    cnpjs: (patch.cnpjs as string[]) ?? user.cnpjs,
  };
}
