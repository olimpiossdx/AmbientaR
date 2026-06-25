import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";
import type {
  AccessRequestType,
  AppUser,
  Client,
  Empreendedor,
} from "@/lib/types";
import {
  buildCpfCnpjVariants,
  lookupClientAndEmpreendedorByDocument,
  normalizeDocumentDigits,
} from "@/lib/document-lookup";
import { createConsultorAssignment } from "@/lib/consultor-assignments";
import { createNotificationWithPush } from "@/lib/notifications";
import { NOTIFICATION_SOURCE } from "@/lib/notification-events";

export type DelegateInviteStatus =
  | "pending"
  | "pending_professional_ack"
  | "accepted"
  | "expired";

export type DelegateInvite = {
  id: string;
  createdByUserId: string;
  createdByName?: string;
  titularDocument: string;
  targetEmail?: string;
  targetCpf?: string;
  targetUserId?: string;
  targetUserName?: string;
  role: AccessRequestType;
  status: DelegateInviteStatus;
  createdAt: string;
  acceptedAt?: string;
  acceptedByUserId?: string;
};

export type CreateDelegateInviteInput = {
  firestore: Firestore;
  titularUser: Pick<AppUser, "id" | "uid" | "name">;
  titularDocument: string;
  role: AccessRequestType;
  targetEmail?: string;
  targetCpf?: string;
  myClients?: Pick<Client, "id" | "cpfCnpj">[] | null;
  myEmpreendedores?: Pick<Empreendedor, "id" | "cpfCnpj">[] | null;
};

export async function findPortalUserByEmailOrCpf(
  firestore: Firestore,
  params: { email?: string; cpf?: string },
): Promise<(AppUser & { id: string }) | null> {
  const usersRef = collection(firestore, "users");
  const normalizedEmail = params.email?.trim().toLowerCase();
  if (normalizedEmail) {
    const snap = await getDocs(
      query(usersRef, where("email", "==", normalizedEmail)),
    );
    const match = snap.docs[0];
    if (match) return { ...(match.data() as AppUser), id: match.id };
  }

  const cpfDigits = normalizeDocumentDigits(params.cpf);
  if (cpfDigits.length >= 11) {
    const variants = buildCpfCnpjVariants(cpfDigits).slice(0, 10);
    for (const field of ["userCpf", "cpf"] as const) {
      for (const variant of variants) {
        const snap = await getDocs(query(usersRef, where(field, "==", variant)));
        const match = snap.docs[0];
        if (match) return { ...(match.data() as AppUser), id: match.id };
      }
    }
  }

  return null;
}

async function grantAccessForTitularDocument(
  firestore: Firestore,
  params: {
    professionalUserId: string;
    role: AccessRequestType;
    titularDocument: string;
    titularUid: string;
    myClients?: Pick<Client, "id" | "cpfCnpj">[] | null;
    myEmpreendedores?: Pick<Empreendedor, "id" | "cpfCnpj">[] | null;
  },
): Promise<void> {
  const cpfNorm = normalizeDocumentDigits(params.titularDocument);
  const matchesDoc = (entity: { cpfCnpj?: string }) =>
    normalizeDocumentDigits(entity.cpfCnpj) === cpfNorm;

  let clientsToUpdate = (params.myClients ?? []).filter(matchesDoc);
  let empreendedoresToUpdate = (params.myEmpreendedores ?? []).filter(matchesDoc);

  if (clientsToUpdate.length === 0 && empreendedoresToUpdate.length === 0) {
    const lookup = await lookupClientAndEmpreendedorByDocument(
      firestore,
      params.titularDocument,
    );
    if (lookup.client?.id) {
      clientsToUpdate = [
        { id: lookup.client.id, cpfCnpj: lookup.client.cpfCnpj ?? params.titularDocument },
      ];
    }
    if (lookup.empreendedor?.id) {
      empreendedoresToUpdate = [
        {
          id: lookup.empreendedor.id,
          cpfCnpj: lookup.empreendedor.cpfCnpj ?? params.titularDocument,
        },
      ];
    }
  }

  const isConsultor = params.role === "consultor_representante";
  for (const c of clientsToUpdate) {
    await updateDoc(
      doc(firestore, "clients", c.id),
      isConsultor
        ? {
            approvedConsultorIds: arrayUnion(params.professionalUserId),
            primaryConsultorUid: params.professionalUserId,
          }
        : { approvedUserIds: arrayUnion(params.professionalUserId) },
    );
  }
  for (const e of empreendedoresToUpdate) {
    await updateDoc(
      doc(firestore, "empreendedores", e.id),
      isConsultor
        ? {
            approvedConsultorIds: arrayUnion(params.professionalUserId),
            primaryConsultorUid: params.professionalUserId,
          }
        : { approvedUserIds: arrayUnion(params.professionalUserId) },
    );
  }

  if (isConsultor) {
    await createConsultorAssignment(firestore, {
      consultorUid: params.professionalUserId,
      titularUid: params.titularUid,
      clientId: clientsToUpdate[0]?.id,
      empreendedorIds: empreendedoresToUpdate.map((e) => e.id),
      assignedByUid: params.titularUid,
    });
  }
}

export async function createDelegateInviteFromTitular(
  input: CreateDelegateInviteInput,
): Promise<{ inviteId: string; status: DelegateInviteStatus }> {
  const titularUid = input.titularUser.uid || input.titularUser.id;
  const titularDocument = normalizeDocumentDigits(input.titularDocument);
  if (titularDocument.length < 11) {
    throw new Error("Documento do titular inválido.");
  }

  const targetEmail = input.targetEmail?.trim().toLowerCase();
  const targetCpf = normalizeDocumentDigits(input.targetCpf);
  if (!targetEmail && targetCpf.length < 11) {
    throw new Error("Informe o e-mail ou CPF do profissional.");
  }

  const existingUser = await findPortalUserByEmailOrCpf(input.firestore, {
    email: targetEmail,
    cpf: targetCpf || undefined,
  });

  const base = {
    createdByUserId: titularUid,
    createdByName: input.titularUser.name,
    titularDocument,
    role: input.role,
    createdAt: new Date().toISOString(),
    ...(targetEmail ? { targetEmail } : {}),
    ...(targetCpf.length >= 11 ? { targetCpf } : {}),
  };

  if (existingUser) {
    const professionalId = existingUser.uid || existingUser.id;
    const ref = await addDoc(collection(input.firestore, "delegate_invites"), {
      ...base,
      targetUserId: professionalId,
      targetUserName: existingUser.name,
      status: "pending_professional_ack",
    });

    await createNotificationWithPush(input.firestore, professionalId, {
      title: "Convite de vínculo com titular",
      description: `${input.titularUser.name} indicou você como ${
        input.role === "consultor_representante" ? "consultor-representante" : "representante"
      }. Confirme ciência do vínculo em Usuários.`,
      link: "/users#delegate-invite-ack",
      sourceType: NOTIFICATION_SOURCE.delegate_invite,
      sourceId: ref.id,
      actorRole: "client",
    });

    return { inviteId: ref.id, status: "pending_professional_ack" };
  }

  const ref = await addDoc(collection(input.firestore, "delegate_invites"), {
    ...base,
    status: "pending",
  });
  return { inviteId: ref.id, status: "pending" };
}

export async function acceptDelegateInvite(
  firestore: Firestore,
  params: {
    invite: DelegateInvite;
    acceptingUser: Pick<AppUser, "id" | "uid" | "name" | "email">;
  },
): Promise<void> {
  const acceptingUid = params.acceptingUser.uid || params.acceptingUser.id;
  const titularUid = params.invite.createdByUserId;

  await grantAccessForTitularDocument(firestore, {
    professionalUserId: acceptingUid,
    role: params.invite.role,
    titularDocument: params.invite.titularDocument,
    titularUid,
  });

  await updateDoc(doc(firestore, "delegate_invites", params.invite.id), {
    status: "accepted",
    acceptedAt: new Date().toISOString(),
    acceptedByUserId: acceptingUid,
    targetUserId: acceptingUid,
    targetUserName: params.acceptingUser.name,
  });

  await createNotificationWithPush(firestore, titularUid, {
    title: "Vínculo confirmado",
    description: `${params.acceptingUser.name} aceitou operar como ${
      params.invite.role === "consultor_representante"
        ? "consultor-representante"
        : "representante"
    } do titular ${params.invite.titularDocument}.`,
    link: "/users#delegate-invites-sent",
    sourceType: NOTIFICATION_SOURCE.delegate_invite,
    sourceId: params.invite.id,
  });
}

export async function rejectDelegateInvite(
  firestore: Firestore,
  inviteId: string,
): Promise<void> {
  await updateDoc(doc(firestore, "delegate_invites", inviteId), {
    status: "expired",
  });
}

export function filterPendingInvitesForProfessional(
  invites: DelegateInvite[] | null | undefined,
  user: Pick<AppUser, "id" | "uid" | "email">,
): DelegateInvite[] {
  if (!invites?.length) return [];
  const uid = user.uid || user.id;
  const email = user.email?.trim().toLowerCase();
  return invites.filter((inv) => {
    if (inv.status !== "pending_professional_ack") return false;
    if (inv.targetUserId && inv.targetUserId === uid) return true;
    if (email && inv.targetEmail?.trim().toLowerCase() === email) return true;
    return false;
  });
}

export function filterInvitesCreatedByTitular(
  invites: DelegateInvite[] | null | undefined,
  titularUid: string,
): DelegateInvite[] {
  if (!invites?.length) return [];
  return invites.filter((inv) => inv.createdByUserId === titularUid);
}
