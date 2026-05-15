import { studyMapsAdminAuth, studyMapsAdminDb } from "@/lib/study-maps/admin";
import type { UserRole } from "@/lib/types";

export type VerifiedAdmin = { uid: string; role: UserRole };

export async function verifyAdminBearer(
  authHeader: string | null,
): Promise<VerifiedAdmin> {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Token em falta. Envie Authorization: Bearer <idToken>.");
  }
  const idToken = authHeader.slice("Bearer ".length).trim();
  if (!idToken) throw new Error("Token vazio.");

  const decoded = await studyMapsAdminAuth().verifyIdToken(idToken);
  const profile = await studyMapsAdminDb()
    .collection("users")
    .doc(decoded.uid)
    .get();
  const role = profile.data()?.role as UserRole | undefined;
  if (role !== "admin") {
    throw new Error("Sem permissão. Apenas administrador pode excluir usuários.");
  }
  return { uid: decoded.uid, role };
}
