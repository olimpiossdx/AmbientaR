import type { Auth } from "firebase/auth";
import {
  fetchApiWithRetry,
  type FetchApiWithRetryOptions,
} from "@/lib/safe-fetch-api";

/** Cabeçalhos `Authorization: Bearer` para rotas `/api/*` autenticadas. */
export async function getBearerApiHeaders(
  auth: Auth | null | undefined,
  extra?: HeadersInit,
): Promise<HeadersInit> {
  const token = await auth?.currentUser?.getIdToken();
  if (!token) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  return {
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

/** `fetchApiWithRetry` com Bearer Firebase (evita esquecer auth em novas chamadas). */
export async function fetchApiWithAuth(
  auth: Auth | null | undefined,
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: FetchApiWithRetryOptions,
): Promise<Response> {
  const headers = await getBearerApiHeaders(auth, init?.headers);
  return fetchApiWithRetry(input, { ...init, headers }, options);
}
