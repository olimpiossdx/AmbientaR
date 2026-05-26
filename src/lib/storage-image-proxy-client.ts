"use client";

import { getAuth } from "firebase/auth";
import { storagePathFromDownloadUrl } from "@/lib/storage-upload";

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

/**
 * URL segura para `<Image>` / preview no browser (evita CORS do Storage).
 * URLs do Firebase Storage passam pelo proxy `/api/branding/image`.
 */
export function brandingImageDisplayUrl(
  url: string | null | undefined,
): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('/') || trimmed.startsWith('data:')) return trimmed;
  if (isFirebaseStorageHttpsUrl(trimmed)) return storageImageProxyUrl(trimmed);
  return trimmed;
}

function isBrandingStorageUrl(storageUrl: string): boolean {
  const path = storagePathFromDownloadUrl(storageUrl);
  return Boolean(path?.startsWith("branding/"));
}

/** Obtém blob via proxy same-origin (evita CORS no canvas/jsPDF). */
export async function fetchStorageImageProxyBlob(
  storageUrl: string,
): Promise<Blob> {
  const proxyUrl = storageImageProxyUrl(storageUrl);
  const token = await getAuth().currentUser?.getIdToken();
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  let res = await fetch(proxyUrl, {
    headers,
    credentials: "same-origin",
    cache: "default",
  });

  if (!res.ok && res.status === 401 && isBrandingStorageUrl(storageUrl)) {
    res = await fetch(proxyUrl, { credentials: "same-origin", cache: "default" });
  }

  if (!res.ok) {
    if (!token && !isBrandingStorageUrl(storageUrl)) {
      throw new Error("Sessão expirada. Faça login novamente.");
    }
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
