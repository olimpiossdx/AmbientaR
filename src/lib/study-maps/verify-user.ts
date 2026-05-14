import { studyMapsAdminAuth } from "@/lib/study-maps/admin";

export type VerifiedUser = { uid: string };

export async function verifyBearerUid(
  authHeader: string | null,
): Promise<VerifiedUser> {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Token em falta. Envie Authorization: Bearer <idToken>.");
  }
  const idToken = authHeader.slice("Bearer ".length).trim();
  if (!idToken) throw new Error("Token vazio.");
  const decoded = await studyMapsAdminAuth().verifyIdToken(idToken);
  return { uid: decoded.uid };
}
