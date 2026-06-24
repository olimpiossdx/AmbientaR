import { adminAuth, adminDb, formatFirebaseAdminError } from "@/lib/firebase-admin";
import type { UserRole } from "@/lib/types";

export type VerifiedAdmin = { uid: string; role: UserRole };

const STAFF_USER_MANAGER_ROLES: UserRole[] = ["admin", "supervisor"];

export async function verifyAdminOrSupervisorBearer(
  authHeader: string | null,
): Promise<VerifiedAdmin> {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Token em falta. Envie Authorization: Bearer <idToken>.");
  }
  const idToken = authHeader.slice("Bearer ".length).trim();
  if (!idToken) throw new Error("Token vazio.");

  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    const profile = await adminDb()
      .collection("users")
      .doc(decoded.uid)
      .get();
    const role = profile.data()?.role as UserRole | undefined;
    if (!role || !STAFF_USER_MANAGER_ROLES.includes(role)) {
      throw new Error(
        "Sem permissão. Apenas administrador ou supervisor pode gerir usuários.",
      );
    }
    return { uid: decoded.uid, role };
  } catch (err) {
    throw formatFirebaseAdminError(err);
  }
}

export async function verifyAdminBearer(
  authHeader: string | null,
): Promise<VerifiedAdmin> {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Token em falta. Envie Authorization: Bearer <idToken>.");
  }
  const idToken = authHeader.slice("Bearer ".length).trim();
  if (!idToken) throw new Error("Token vazio.");

  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    const profile = await adminDb()
      .collection("users")
      .doc(decoded.uid)
      .get();
    const role = profile.data()?.role as UserRole | undefined;
    if (role !== "admin") {
      throw new Error(
        "Sem permissão. Apenas administrador pode excluir usuários.",
      );
    }
    return { uid: decoded.uid, role };
  } catch (err) {
    throw formatFirebaseAdminError(err);
  }
}
