import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import type { AccessRequest, AccessRequestType, AppUser } from "@/lib/types";
import { normalizeDocumentDigits } from "@/lib/document-lookup";
import { getAccessRequestType } from "@/lib/consultor-assignments";
import { NOTIFICATION_LINKS, NOTIFICATION_SOURCE } from "@/lib/notification-events";
import { getTitularUserIdsByDocument } from "@/lib/notification-recipients";
import { ensureUnreadNotification } from "@/lib/notifications";

async function notifyTitularOfAccessRequest(
  firestore: Firestore,
  params: {
    requestId: string;
    document: string;
    requesterName: string;
    requestType: AccessRequestType;
  },
): Promise<boolean> {
  const titularIds = await getTitularUserIdsByDocument(firestore, params.document);
  if (titularIds.length === 0) return false;

  const roleLabel =
    params.requestType === "consultor_representante"
      ? "consultor-representante"
      : "representante";

  let notified = false;
  await Promise.all(
    titularIds.map(async (titularId) => {
      const ok = await ensureUnreadNotification(firestore, titularId, {
        title: "Pedido de acesso pendente",
        description: `${params.requesterName} solicitou acesso como ${roleLabel}.`,
        link: NOTIFICATION_LINKS.usersAccessRequests,
        sourceType: NOTIFICATION_SOURCE.access_request_pending,
        sourceId: params.requestId,
        actorRole: params.requestType,
      });
      if (ok) notified = true;
    }),
  );
  return notified;
}

/** Garante notificação para pedidos pendentes visíveis ao titular (backfill). */
export async function ensureTitularNotificationsForPendingRequests(
  firestore: Firestore,
  requests: Pick<
    AccessRequest,
    "id" | "requestedByName" | "cpfOfInterested" | "requestType"
  >[],
): Promise<void> {
  for (const req of requests) {
    const requestType = getAccessRequestType(req);
    await notifyTitularOfAccessRequest(firestore, {
      requestId: req.id,
      document: req.cpfOfInterested,
      requesterName: req.requestedByName,
      requestType,
    });
  }
}

export async function createAccessRequestsForDelegate(
  firestore: Firestore,
  params: {
    requesterUserId: string;
    email: string;
    name: string;
    role: AccessRequestType;
    documents: string[];
    existingDigits?: Set<string>;
  },
): Promise<{ created: number; titularNotified: boolean }> {
  const existingSet = params.existingDigits ?? new Set<string>();
  const requestType = params.role;
  let created = 0;
  let titularNotified = false;

  for (const cpfOuCnpj of params.documents) {
    const normalized = normalizeDocumentDigits(cpfOuCnpj);
    if (normalized.length < 11 || existingSet.has(normalized)) continue;
    existingSet.add(normalized);
    try {
      const ref = await addDoc(collection(firestore, "access_requests"), {
        requestedByUserId: params.requesterUserId,
        requestedByEmail: params.email,
        requestedByName: params.name,
        cpfOfInterested: normalized,
        targetDocument: normalized,
        requestType,
        status: "pending",
        createdAt: new Date().toISOString(),
      } as Omit<AccessRequest, "id">);
      created += 1;
      const notified = await notifyTitularOfAccessRequest(firestore, {
        requestId: ref.id,
        document: normalized,
        requesterName: params.name,
        requestType,
      });
      if (notified) titularNotified = true;
    } catch (e) {
      console.warn("Erro ao criar pedido de acesso para", normalized, e);
    }
  }
  return { created, titularNotified };
}

/** Pedidos do próprio representante ou consultor (exclui tipo de outro perfil). */
export function filterAccessRequestsForDelegate(
  requests: AccessRequest[] | null | undefined,
  role: "representative" | "consultor_representante",
): AccessRequest[] {
  if (!requests?.length) return [];
  return requests.filter((r) => getAccessRequestType(r) === role);
}

/** Documentos já solicitados (evita recriar pedidos ao salvar o perfil do representante). */
export async function collectExistingDelegateRequestDigits(
  firestore: Firestore,
  requesterUserId: string,
  options?: {
    extraDigits?: string[];
    profile?: Pick<AppUser, "cpf" | "cnpjs"> | null;
  },
): Promise<Set<string>> {
  const set = new Set<string>();
  const add = (raw: string | undefined | null) => {
    const digits = normalizeDocumentDigits(raw ?? "");
    if (digits.length >= 11) set.add(digits);
  };

  options?.extraDigits?.forEach(add);
  options?.profile?.cnpjs?.forEach(add);
  add(options?.profile?.cpf);

  try {
    const snap = await getDocs(
      query(
        collection(firestore, "access_requests"),
        where("requestedByUserId", "==", requesterUserId),
      ),
    );
    for (const docSnap of snap.docs) {
      const data = docSnap.data() as Pick<
        AccessRequest,
        "cpfOfInterested" | "status"
      >;
      if (data.status === "pending" || data.status === "approved") {
        add(data.cpfOfInterested);
      }
    }
  } catch (e) {
    console.warn("Não foi possível carregar pedidos de acesso existentes:", e);
  }

  return set;
}

export function collectRequestedDocumentDigits(
  requests: Pick<AccessRequest, "cpfOfInterested" | "status">[],
): Set<string> {
  const set = new Set<string>();
  for (const r of requests) {
    if (r.status !== "pending" && r.status !== "approved") continue;
    const d = normalizeDocumentDigits(r.cpfOfInterested);
    if (d.length >= 11) set.add(d);
  }
  return set;
}
