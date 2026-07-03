import type { Auth } from "firebase/auth";

/** Cabeçalhos para rotas `/api/**` que exigem admin (Bearer idToken). */
export async function getAdminApiRequestHeaders(
  auth: Auth | null | undefined,
  extra?: HeadersInit,
): Promise<HeadersInit> {
  const token = await auth?.currentUser?.getIdToken();
  if (!token) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}
