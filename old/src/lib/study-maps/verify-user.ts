import { verifyIdTokenAndLoadUser } from "@/lib/package-enforcement-server";

export type VerifiedUser = { uid: string };

/** Valida Bearer Firebase (mesmo fluxo das demais APIs autenticadas). */
export async function verifyBearerUid(
  authHeader: string | null,
): Promise<VerifiedUser> {
  const idToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;
  const user = await verifyIdTokenAndLoadUser(idToken);
  return { uid: user.uid || user.id };
}
