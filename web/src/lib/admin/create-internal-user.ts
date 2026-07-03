import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import type { UserRole } from "@/lib/types";
import { normalizeDocumentDigits } from "@/lib/document-lookup";

export type CreateInternalUserInput = {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  status: "active" | "inactive" | "pending_invite";
  userCpf?: string;
  cpf?: string;
  cnpjs?: string[];
  titularDocument?: string;
  titularType?: string;
  photoURL?: string;
  dataNascimento?: string;
  createdByUid: string;
  actorRole: UserRole;
};

export type CreateInternalUserResult = {
  userId: string;
  email: string;
  repairedAuth: boolean;
};

function isAuthUserNotFound(err: unknown): boolean {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code?: string }).code)
      : "";
  return code === "auth/user-not-found";
}

async function findUserDocByEmail(db: Firestore, email: string) {
  const normalized = email.trim().toLowerCase();
  let snap = await db
    .collection("users")
    .where("email", "==", normalized)
    .limit(1)
    .get();
  if (!snap.empty) return snap.docs[0];

  const raw = email.trim();
  if (raw !== normalized) {
    snap = await db
      .collection("users")
      .where("email", "==", raw)
      .limit(1)
      .get();
    if (!snap.empty) return snap.docs[0];
  }
  return null;
}

async function authUserExists(auth: Auth, email: string): Promise<boolean> {
  try {
    await auth.getUserByEmail(email);
    return true;
  } catch (err) {
    if (isAuthUserNotFound(err)) return false;
    throw err;
  }
}

function buildUserDoc(
  uid: string,
  input: CreateInternalUserInput,
  email: string,
) {
  const personalCpf = normalizeDocumentDigits(input.userCpf || "");
  return {
    uid,
    name: input.name.trim(),
    email,
    role: input.role,
    status: input.status,
    userCpf: personalCpf,
    cpf: input.cpf ? normalizeDocumentDigits(input.cpf) : personalCpf,
    cnpjs: input.cnpjs ?? [],
    ...(input.titularDocument
      ? {
          titularDocument: normalizeDocumentDigits(input.titularDocument),
          ...(input.titularType ? { titularType: input.titularType } : {}),
        }
      : {}),
    photoURL: input.photoURL?.trim() || "",
    dataNascimento: input.dataNascimento?.trim() || "",
    isOnline: false,
    createdBy: input.createdByUid,
  };
}

export async function createInternalUser(
  db: Firestore,
  auth: Auth,
  input: CreateInternalUserInput,
): Promise<CreateInternalUserResult> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const password = input.password;

  if (!email || !name) {
    throw new Error("Informe e-mail e nome do usuário.");
  }
  if (!password || password.length < 6) {
    throw new Error("A senha deve ter pelo menos 6 caracteres.");
  }
  if (input.role === "admin" && input.actorRole !== "admin") {
    throw new Error("Apenas administrador pode criar usuários com perfil Admin.");
  }

  const existingDoc = await findUserDocByEmail(db, email);
  const hasAuth = await authUserExists(auth, email);

  if (hasAuth) {
    throw new Error(
      "Este e-mail já possui conta no login. Use outro e-mail ou recupere o acesso em Usuários.",
    );
  }

  if (existingDoc) {
    const uid = existingDoc.id;
    await auth.createUser({
      uid,
      email,
      password,
      displayName: name,
      emailVerified: false,
    });

    const merged = {
      ...existingDoc.data(),
      ...buildUserDoc(uid, input, email),
    };
    await existingDoc.ref.set(merged, { merge: true });

    return { userId: uid, email, repairedAuth: true };
  }

  const authUser = await auth.createUser({
    email,
    password,
    displayName: name,
    emailVerified: false,
  });
  const uid = authUser.uid;

  try {
    await db.collection("users").doc(uid).set(buildUserDoc(uid, input, email));
  } catch (firestoreErr) {
    try {
      await auth.deleteUser(uid);
    } catch (rollbackErr) {
      console.error(
        "createInternalUser: falha ao reverter usuário Auth após erro Firestore",
        rollbackErr,
      );
    }
    throw firestoreErr;
  }

  return { userId: uid, email, repairedAuth: false };
}

export type RepairUserAuthInput = {
  email: string;
  password: string;
  actorRole: UserRole;
};

export type RepairUserAuthResult = {
  userId: string;
  email: string;
};

/** Cria conta Auth para perfil existente no Firestore (sem alterar outros campos). */
export async function repairUserAuth(
  db: Firestore,
  auth: Auth,
  input: RepairUserAuthInput,
): Promise<RepairUserAuthResult> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!email) throw new Error("Informe o e-mail.");
  if (!password || password.length < 6) {
    throw new Error("A senha deve ter pelo menos 6 caracteres.");
  }
  if (input.actorRole !== "admin") {
    throw new Error("Apenas administrador pode reparar login de usuários.");
  }

  const existingDoc = await findUserDocByEmail(db, email);
  if (!existingDoc) {
    throw new Error(
      "Nenhum perfil encontrado no Firestore para este e-mail. Crie o usuário normalmente.",
    );
  }

  const hasAuth = await authUserExists(auth, email);
  if (hasAuth) {
    throw new Error("Este e-mail já possui conta no login (Firebase Auth).");
  }

  const uid = existingDoc.id;
  const displayName =
    typeof existingDoc.data()?.name === "string"
      ? existingDoc.data()!.name
      : email;

  await auth.createUser({
    uid,
    email,
    password,
    displayName,
    emailVerified: false,
  });

  await existingDoc.ref.set(
    {
      uid,
      email,
    },
    { merge: true },
  );

  return { userId: uid, email };
}
