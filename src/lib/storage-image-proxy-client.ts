"use client";

import { getAuth } from "firebase/auth";

const STORAGE_HOST_SNIPPETS = [
  "firebasestorage.googleapis.com",
  "firebasestorage.app",
];

export function isFirebaseStorageHttpsUrl(url: string): boolean {
  return STORAGE_HOST_SNIPPETS.some((h) => url.includes(h));
}

/** URL do proxy same-origin (requer Bearer na chamada `fetch`). */
export function storageImageProxyUrl(storageUrl: string): string {
  return `/api/branding/image?url=${encodeURIComponent(storageUrl)}`;
}

/** Obtém blob via proxy autenticado (evita CORS no canvas/jsPDF). */
export async function fetchStorageImageProxyBlob(
  storageUrl: string,
): Promise<Blob> {
  const token = await getAuth().currentUser?.getIdToken();
  if (!token) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  const res = await fetch(storageImageProxyUrl(storageUrl), {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "same-origin",
    cache: "default",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const blob = await res.blob();
  if (!blob.size) throw new Error("Resposta vazia");
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    throw new Error("Proxy devolveu JSON em vez de imagem.");
  }
  return blob;
}
