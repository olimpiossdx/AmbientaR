import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";
import { lookupClientAndEmpreendedorByDocument, normalizeDocumentDigits } from "@/lib/document-lookup";

const getEntityTypeFromDocument = (value: string) =>
  normalizeDocumentDigits(value).length === 14
    ? ("Pessoa Jurídica" as const)
    : ("Pessoa Física" as const);

/** Vincula `userId` em clientes/empreendedores já cadastrados (perfil Cliente Gestão / titular). */
export async function linkClientGestaoToExistingRecords(
  firestore: Firestore,
  userId: string,
  portalDocument: string,
  profile: { name: string; email: string },
  linkedClientId: string | null,
  linkedEmpreendedorId: string | null,
): Promise<{ linkedClientId: string | null; linkedEmpreendedorId: string | null }> {
  const digits = normalizeDocumentDigits(portalDocument);
  if (digits.length !== 11 && digits.length !== 14) {
    return { linkedClientId, linkedEmpreendedorId };
  }

  const { client, empreendedor } = await lookupClientAndEmpreendedorByDocument(
    firestore,
    portalDocument,
  );
  const clientDocId = linkedClientId || client?.id;
  const empreendedorDocId = linkedEmpreendedorId || empreendedor?.id;

  if (!clientDocId && !empreendedorDocId) {
    return { linkedClientId, linkedEmpreendedorId };
  }

  const entityType = getEntityTypeFromDocument(portalDocument);
  const linkedData = {
    name: profile.name,
    email: profile.email,
    cpfCnpj: portalDocument,
    entityType,
    userId,
  };
  const linkedEmpreendedorData = {
    name: profile.name,
    email: profile.email,
    cpfCnpj: portalDocument,
    entityType: [entityType],
    userId,
  };

  if (clientDocId) {
    await setDoc(doc(firestore, "clients", clientDocId), linkedData, { merge: true });
  }
  if (empreendedorDocId) {
    await setDoc(doc(firestore, "empreendedores", empreendedorDocId), linkedEmpreendedorData, {
      merge: true,
    });
  }

  const existingClients = await getDocs(
    query(collection(firestore, "clients"), where("userId", "==", userId)),
  );
  const existingEmpreendedores = await getDocs(
    query(collection(firestore, "empreendedores"), where("userId", "==", userId)),
  );
  for (const snap of existingClients.docs) {
    await updateDoc(doc(firestore, "clients", snap.id), linkedData);
  }
  for (const snap of existingEmpreendedores.docs) {
    await updateDoc(doc(firestore, "empreendedores", snap.id), linkedEmpreendedorData);
  }

  return {
    linkedClientId: clientDocId ?? linkedClientId,
    linkedEmpreendedorId: empreendedorDocId ?? linkedEmpreendedorId,
  };
}
