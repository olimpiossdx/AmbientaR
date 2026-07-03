import { adminAuth, adminDb } from "@/lib/firebase-admin";
import type { AppUser, UserRole } from "@/lib/types";

export type VerifiedRequestUser = {
  uid: string;
  email: string;
  role: UserRole;
  name?: string;
};

export async function verifyPlatformContractRequestUser(
  authHeader: string | null,
): Promise<VerifiedRequestUser> {
  const idToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;
  if (!idToken) throw new Error("Token ausente.");
  const decoded = await adminAuth().verifyIdToken(idToken);
  const snap = await adminDb().collection("users").doc(decoded.uid).get();
  const data = snap.data();
  return {
    uid: decoded.uid,
    email: decoded.email ?? (data?.email as string) ?? "",
    role: (data?.role as UserRole) ?? "client",
    name: data?.name as string | undefined,
  };
}

export function canReadPlatformAcceptance(
  reader: VerifiedRequestUser,
  ownerUserId: string,
): boolean {
  if (reader.uid === ownerUserId) return true;
  return (
    reader.role === "admin" ||
    reader.role === "financial" ||
    reader.role === "supervisor"
  );
}

export async function loadAppUser(uid: string): Promise<AppUser | null> {
  const snap = await adminDb().collection("users").doc(uid).get();
  if (!snap.exists) return null;
  return { id: snap.id, uid, ...snap.data() } as AppUser;
}
