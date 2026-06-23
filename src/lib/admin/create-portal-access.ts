import { FieldValue } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import type { Client, ClientPackage } from "@/lib/types";
import { normalizeDocumentDigits } from "@/lib/document-lookup";

export type CreatePortalAccessInput = {
  clientId: string;
  email: string;
  name: string;
  userCpf?: string;
  package?: ClientPackage;
  invitedByUid: string;
};

export type CreatePortalAccessResult = {
  userId: string;
  email: string;
  status: "pending_invite";
  linkedClientId: string;
  linkedEmpreendedorId: string | null;
  isAdditionalPortalUser: boolean;
};

function randomPassword(): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let out = "";
  for (let i = 0; i < 24; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export async function createPortalAccessForClientGestao(
  db: Firestore,
  auth: Auth,
  input: CreatePortalAccessInput,
): Promise<CreatePortalAccessResult> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const clientId = input.clientId.trim();

  if (!email || !name || !clientId) {
    throw new Error("Informe clientId, e-mail e nome do responsável.");
  }

  const clientSnap = await db.collection("clients").doc(clientId).get();
  if (!clientSnap.exists) {
    throw new Error("Cliente não encontrado.");
  }
  const client = { id: clientSnap.id, ...clientSnap.data() } as Client;

  try {
    const existing = await auth.getUserByEmail(email);
    if (existing?.uid) {
      throw new Error(
        "Este e-mail já possui conta no sistema. Use outro e-mail ou recupere o acesso em Usuários.",
      );
    }
  } catch (e: unknown) {
    const code =
      e && typeof e === "object" && "code" in e
        ? String((e as { code?: string }).code)
        : "";
    if (code !== "auth/user-not-found") {
      if (e instanceof Error && e.message.includes("já possui conta")) {
        throw e;
      }
      throw e instanceof Error ? e : new Error("Falha ao verificar e-mail.");
    }
  }

  const authUser = await auth.createUser({
    email,
    displayName: name,
    password: randomPassword(),
    emailVerified: false,
  });
  const uid = authUser.uid;

  try {
    const userCpfDigits = normalizeDocumentDigits(input.userCpf || "");
    const clientCpfDigits = normalizeDocumentDigits(client.cpfCnpj || "");
    const portalDocument =
      clientCpfDigits.length >= 11 ? clientCpfDigits : userCpfDigits;

    let linkedEmpreendedorId: string | null = null;
    const empSnap = await db
      .collection("empreendedores")
      .where("sourceClientId", "==", clientId)
      .limit(1)
      .get();
    if (!empSnap.empty) {
      linkedEmpreendedorId = empSnap.docs[0].id;
    } else if (portalDocument.length >= 11) {
      const byDoc = await db
        .collection("empreendedores")
        .where("cpfCnpj", "==", portalDocument)
        .limit(1)
        .get();
      if (!byDoc.empty) linkedEmpreendedorId = byDoc.docs[0].id;
    }

    const portalUserIds: string[] = Array.isArray(
      (client as Client & { portalUserIds?: string[] }).portalUserIds,
    )
      ? (client as Client & { portalUserIds?: string[] }).portalUserIds!
      : [];
    const isAdditionalPortalUser =
      portalUserIds.length > 0 || Boolean(client.userId);

    const selectedPackage: ClientPackage = input.package ?? "basico";

    const userDoc = {
      uid,
      name,
      email,
      role: "client" as const,
      status: "pending_invite" as const,
      userCpf: userCpfDigits.length === 11 ? userCpfDigits : "",
      cpf: portalDocument.length >= 11 ? portalDocument : "",
      cnpjs: portalDocument.length === 14 ? [portalDocument] : [],
      package: selectedPackage,
      platformPaymentStatus: "paid" as const,
      contractAcceptedAt: FieldValue.serverTimestamp(),
      cadastroIncompleto: false,
      linkedClientId: clientId,
      ...(linkedEmpreendedorId ? { linkedEmpreendedorId } : {}),
      portalInvitedAt: FieldValue.serverTimestamp(),
      portalInvitedBy: input.invitedByUid,
      createdAt: FieldValue.serverTimestamp(),
      lastLogin: null,
      isOnline: false,
    };

    await db.collection("users").doc(uid).set(userDoc);

    const clientUpdate: Record<string, unknown> = {
      portalUserIds: FieldValue.arrayUnion(uid),
    };
    if (!client.userId) {
      clientUpdate.userId = uid;
    }
    if (!client.email?.trim() && email) {
      clientUpdate.email = email;
    }
    await db.collection("clients").doc(clientId).update(clientUpdate);

    if (linkedEmpreendedorId && !isAdditionalPortalUser) {
      await db
        .collection("empreendedores")
        .doc(linkedEmpreendedorId)
        .set(
          {
            userId: uid,
            email: email || client.email,
            name: client.name || name,
          },
          { merge: true },
        );
    }

    return {
      userId: uid,
      email,
      status: "pending_invite",
      linkedClientId: clientId,
      linkedEmpreendedorId,
      isAdditionalPortalUser,
    };
  } catch (firestoreErr) {
    try {
      await auth.deleteUser(uid);
    } catch (rollbackErr) {
      console.error(
        "createPortalAccess: falha ao reverter usuário Auth após erro Firestore",
        rollbackErr,
      );
    }
    throw firestoreErr;
  }
}
