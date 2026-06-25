import { collection, doc, getDoc, getDocs, query, where, type Firestore } from "firebase/firestore";
import type { License } from "@/lib/types";

type PortalEntityFields = {
  userId?: string;
  approvedUserIds?: string[];
  approvedConsultorIds?: string[];
};

function collectPortalRecipientIds(data: PortalEntityFields): string[] {
  const ids = new Set<string>();
  if (data.userId?.trim()) ids.add(data.userId.trim());
  for (const uid of data.approvedUserIds || []) {
    if (typeof uid === "string" && uid.trim()) ids.add(uid.trim());
  }
  for (const uid of data.approvedConsultorIds || []) {
    if (typeof uid === "string" && uid.trim()) ids.add(uid.trim());
  }
  return Array.from(ids);
}

/** UIDs que devem ver alertas no portal (titular + representantes + consultores aprovados). */
export async function getRecipientUserIdsForEmpreendedor(
  firestore: Firestore,
  empreendedorId: string | undefined | null,
): Promise<string[]> {
  if (!empreendedorId?.trim()) return [];
  const snap = await getDoc(doc(firestore, "empreendedores", empreendedorId.trim()));
  if (!snap.exists()) return [];
  return collectPortalRecipientIds(snap.data() as PortalEntityFields);
}

export async function getRecipientUserIdsForProject(
  firestore: Firestore,
  projectId: string | undefined | null,
): Promise<string[]> {
  if (!projectId?.trim()) return [];
  const snap = await getDoc(doc(firestore, "projects", projectId.trim()));
  if (!snap.exists()) return [];
  const data = snap.data() as { userId?: string; empreendedorId?: string };
  const ids = new Set<string>();
  if (data.userId?.trim()) ids.add(data.userId.trim());
  const fromEmp = await getRecipientUserIdsForEmpreendedor(firestore, data.empreendedorId);
  fromEmp.forEach((id) => ids.add(id));
  return Array.from(ids);
}

/** Cliente financeiro (`clients/{id}`) → titular, representantes e consultores. */
export async function getRecipientUserIdsForClient(
  firestore: Firestore,
  clientId: string | undefined | null,
): Promise<string[]> {
  if (!clientId?.trim()) return [];
  const snap = await getDoc(doc(firestore, "clients", clientId.trim()));
  if (!snap.exists()) return [];
  const ids = new Set(collectPortalRecipientIds(snap.data() as PortalEntityFields));
  if (ids.size === 0 && clientId.trim()) {
    ids.add(clientId.trim());
  }
  return Array.from(ids);
}

/**
 * Ofícios: destinatário é texto — tenta casar com nome em `clients` e `empreendedores`.
 */
export async function getRecipientUserIdsByRecipientName(
  firestore: Firestore,
  recipientName: string | undefined | null,
): Promise<string[]> {
  const name = recipientName?.trim();
  if (!name) return [];
  const ids = new Set<string>();

  const tryCollection = async (col: "clients" | "empreendedores") => {
    const snap = await getDocs(
      query(collection(firestore, col), where("name", "==", name)),
    );
    for (const d of snap.docs) {
      collectPortalRecipientIds(d.data() as PortalEntityFields).forEach((id) =>
        ids.add(id),
      );
    }
  };

  await Promise.all([tryCollection("clients"), tryCollection("empreendedores")]);
  return Array.from(ids);
}

/** Destinatários do portal para uma condicionante (licença, outorga ou intervenção). */
export async function getRecipientUserIdsFromCondicionanteReference(
  firestore: Firestore,
  referenceType: "licenca" | "outorga" | "intervencao",
  referenceId: string,
): Promise<string[]> {
  if (!referenceId?.trim()) return [];

  if (referenceType === "licenca") {
    const licenseSnap = await getDoc(doc(firestore, "licenses", referenceId.trim()));
    const license = licenseSnap.data() as License | undefined;
    if (!license?.projectId) return [];
    return getRecipientUserIdsForProject(firestore, license.projectId);
  }

  if (referenceType === "outorga") {
    const outorgaSnap = await getDoc(doc(firestore, "outorgas", referenceId.trim()));
    const outorga = outorgaSnap.data() as { empreendedorId?: string } | undefined;
    return getRecipientUserIdsForEmpreendedor(firestore, outorga?.empreendedorId);
  }

  if (referenceType === "intervencao") {
    const intervSnap = await getDoc(doc(firestore, "intervencoes", referenceId.trim()));
    const interv = intervSnap.data() as { empreendedorId?: string } | undefined;
    return getRecipientUserIdsForEmpreendedor(firestore, interv?.empreendedorId);
  }

  return [];
}

/** Titular(es) vinculados a um CPF/CNPJ (cliente ou empreendedor). */
export async function getTitularUserIdsByDocument(
  firestore: Firestore,
  rawDocument: string,
): Promise<string[]> {
  const { lookupClientAndEmpreendedorByDocument } = await import(
    "@/lib/document-lookup"
  );
  const { client, empreendedor } = await lookupClientAndEmpreendedorByDocument(
    firestore,
    rawDocument,
  );
  const ids = new Set<string>();
  if (client?.userId?.trim()) ids.add(client.userId.trim());
  if (empreendedor?.userId?.trim()) ids.add(empreendedor.userId.trim());
  return Array.from(ids);
}
