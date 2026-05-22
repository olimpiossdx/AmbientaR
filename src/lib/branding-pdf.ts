'use client';

import type jsPDF from 'jspdf';
import { getApps } from 'firebase/app';
import { getBlob, getDownloadURL, ref } from 'firebase/storage';
import { getClientFirebaseStorage } from '@/lib/firebase-storage-client';
import { storagePathFromDownloadUrl } from '@/lib/storage-upload';
import {
  fetchStorageImageProxyBlob,
  isFirebaseStorageHttpsUrl,
} from '@/lib/storage-image-proxy-client';

export interface ImageDimensions {
  width: number;
  height: number;
}

export type BrandingImageUrls = {
  headerImageUrl?: string | null;
  footerImageUrl?: string | null;
  watermarkImageUrl?: string | null;
};

export type BrandingPdfImages = {
  headerBase64: string | null;
  footerBase64: string | null;
  watermarkBase64: string | null;
};

/** TTL do cache em memória (URLs do Storage → PNG base64 para PDF). */
const BRANDING_CACHE_TTL_MS = 20 * 60 * 1000;
/** Maior aresta em px antes de redimensionar (cabeçalho/rodapé/marca d'água no PDF). */
const PDF_BRANDING_MAX_EDGE_PX = 1000;

function isUsablePngDataUrl(dataUrl: string | null): dataUrl is string {
  return Boolean(dataUrl && dataUrl.startsWith('data:image') && dataUrl.length > 200);
}

async function fetchBrandingBlob(url: string): Promise<Blob> {
  if (typeof window !== 'undefined' && isFirebaseStorageHttpsUrl(url)) {
    return fetchStorageImageProxyBlob(url);
  }
  const response = await fetch(url, {
    credentials: 'same-origin',
    cache: 'default',
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const blob = await response.blob();
  if (!blob.size) throw new Error('Resposta vazia');
  return blob;
}

async function blobToPngBase64ForPdf(blob: Blob): Promise<string | null> {
  const rawDataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  const png = await imageDataUrlToPngDataUrl(rawDataUrl);
  const sized = await resizeDataUrlForPdf(png);
  return isUsablePngDataUrl(sized) ? sized : null;
}

type CacheEntry = { base64: string; expiresAt: number };

const brandingBase64Cache = new Map<string, CacheEntry>();
const brandingInflight = new Map<string, Promise<string | null>>();

function brandingCacheKey(url: string): string {
  return url.trim();
}

function getCachedBrandingBase64(key: string): string | null {
  const entry = brandingBase64Cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    brandingBase64Cache.delete(key);
    return null;
  }
  return entry.base64;
}

function setCachedBrandingBase64(key: string, base64: string): void {
  brandingBase64Cache.set(key, {
    base64,
    expiresAt: Date.now() + BRANDING_CACHE_TTL_MS,
  });
}

export function clearBrandingPdfCache(): void {
  brandingBase64Cache.clear();
  brandingInflight.clear();
}

/**
 * Converte qualquer data URL de imagem (JPEG, WebP, etc.) em PNG (data URL),
 * para uso estável com jsPDF.addImage(..., 'PNG', ...).
 */
export async function imageDataUrlToPngDataUrl(dataUrl: string): Promise<string> {
  if (dataUrl.startsWith('data:image/png')) return dataUrl;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 1;
        canvas.height = img.naturalHeight || 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D indisponível'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('Falha ao decodificar imagem'));
    img.src = dataUrl;
  });
}

/**
 * Reduz imagens muito grandes antes de embutir no PDF (menos CPU/memória no jsPDF).
 */
export async function resizeDataUrlForPdf(
  dataUrl: string,
  maxEdgePx: number = PDF_BRANDING_MAX_EDGE_PX,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const maxEdge = Math.max(w, h);
      if (!w || !h || maxEdge <= maxEdgePx) {
        resolve(dataUrl);
        return;
      }
      const scale = maxEdgePx / maxEdge;
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Carrega blob de uma URL HTTPS (Storage ou outra) ou path legado no Storage.
 */
/** Fallback quando getBlob/fetch falham — tenta decodificar via canvas. */
async function loadBrandingViaImageElement(url: string): Promise<string | null> {
  if (typeof window !== 'undefined' && isFirebaseStorageHttpsUrl(url)) {
    try {
      const blob = await fetchStorageImageProxyBlob(url);
      const fromBlob = await blobToPngBase64ForPdf(blob);
      if (fromBlob) return fromBlob;
    } catch {
      return null;
    }
  }

  const sameOrigin = url.startsWith('/');
  return new Promise((resolve) => {
    const img = new Image();
    if (!sameOrigin) img.crossOrigin = 'anonymous';
    img.onload = () => {
      void (async () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 1;
          canvas.height = img.naturalHeight || 1;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0);
          const png = await imageDataUrlToPngDataUrl(canvas.toDataURL('image/png'));
          resolve(await resizeDataUrlForPdf(png));
        } catch {
          resolve(null);
        }
      })();
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function loadImageBlobForBranding(trimmed: string): Promise<Blob> {
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (typeof window !== 'undefined' && isFirebaseStorageHttpsUrl(trimmed)) {
      try {
        return await fetchBrandingBlob(trimmed);
      } catch (proxyErr) {
        console.warn('[branding-pdf] proxy same-origin falhou:', proxyErr);
      }
    }
    const isFirebaseStorage = isFirebaseStorageHttpsUrl(trimmed);
    const useSdk =
      isFirebaseStorage &&
      typeof getApps === 'function' &&
      getApps().length > 0;
    if (useSdk) {
      const path = storagePathFromDownloadUrl(trimmed);
      if (path) {
        try {
          const storage = getClientFirebaseStorage();
          return await getBlob(ref(storage, path));
        } catch (sdkErr) {
          console.warn('[branding-pdf] getBlob falhou:', sdkErr);
        }
      }
    }
    if (typeof window !== 'undefined' && isFirebaseStorageHttpsUrl(trimmed)) {
      return fetchStorageImageProxyBlob(trimmed);
    }
    const response = await fetch(trimmed, {
      credentials: 'same-origin',
      cache: 'default',
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.blob();
  }
  if (trimmed.startsWith('/')) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const urlToFetch = origin ? origin + trimmed : trimmed;
    const response = await fetch(urlToFetch, { mode: 'cors', credentials: 'same-origin' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.blob();
  }
  const storage = getClientFirebaseStorage();
  const imageRef = ref(storage, trimmed);
  const urlToFetch = await getDownloadURL(imageRef);
  return fetchBrandingBlob(urlToFetch);
}

async function loadBrandingImageAsBase64Uncached(
  imageUrl: string | null | undefined,
): Promise<string | null> {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  const trimmed = imageUrl.trim();
  if (!trimmed) return null;

  try {
    if (trimmed.startsWith('data:image')) {
      const png = await imageDataUrlToPngDataUrl(trimmed);
      const sized = await resizeDataUrlForPdf(png);
      return isUsablePngDataUrl(sized) ? sized : null;
    }

    if (trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('/')) {
      if (typeof getApps === 'function' && getApps().length === 0 && trimmed.startsWith('https://')) {
        throw new Error('Firebase não inicializado. Recarregue a página.');
      }
      const blob = await loadImageBlobForBranding(trimmed);
      const fromBlob = await blobToPngBase64ForPdf(blob);
      if (fromBlob) return fromBlob;
    }
  } catch (error) {
    console.warn('[branding-pdf] blob/fetch falhou, tentando via <img>:', trimmed, error);
  }

  const viaImg = await loadBrandingViaImageElement(trimmed);
  if (isUsablePngDataUrl(viaImg)) return viaImg;
  console.error('[branding-pdf] Não foi possível carregar imagem para PDF:', trimmed);
  return null;
}

/** Avisos quando há URL configurada mas a imagem não entrou no PDF. */
export function brandingPdfMissingSlots(
  urls: BrandingImageUrls,
  loaded: BrandingPdfImages,
): string[] {
  const missing: string[] = [];
  if (urls.headerImageUrl?.trim() && !loaded.headerBase64) missing.push('cabeçalho');
  if (urls.footerImageUrl?.trim() && !loaded.footerBase64) missing.push('rodapé');
  if (urls.watermarkImageUrl?.trim() && !loaded.watermarkBase64) missing.push('marca d\'água');
  return missing;
}

/**
 * Retorna as dimensões reais (em pixels) de uma imagem base64.
 */
export function getImageDimensions(base64: string): Promise<ImageDimensions> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = base64;
  });
}

/**
 * Aplica transparência a uma imagem base64 via Canvas, retornando novo base64.
 * opacity: 0 = invisível, 1 = opaco. Use ~0.15 para marca d'água sutil.
 */
export function applyImageOpacity(base64: string, opacity: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.globalAlpha = opacity;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
}

/**
 * Calcula largura e altura para o PDF preservando a proporção original da imagem.
 * A imagem nunca ultrapassa maxWidthMm. Se a altura calculada ultrapassar
 * maxHeightMm, reduz proporcionalmente pela altura.
 */
export function calcPdfImageSize(
  dims: ImageDimensions,
  maxWidthMm: number,
  maxHeightMm: number,
): { w: number; h: number } {
  if (!dims.width || !dims.height) return { w: maxWidthMm, h: maxHeightMm };
  const ratio = dims.width / dims.height;
  let w = Math.min(dims.width * 0.264583, maxWidthMm); // px → mm (96dpi)
  let h = w / ratio;
  if (h > maxHeightMm) {
    h = maxHeightMm;
    w = h * ratio;
  }
  return { w, h };
}

/**
 * Converte uma imagem (URL pública ou caminho no Firebase Storage) em base64 PNG
 * para uso em PDFs (cabeçalho, rodapé, marca d'água) com jsPDF em formato 'PNG'.
 * Usa cache em memória (TTL ~20 min) e deduplica pedidos em voo.
 */
export async function fetchBrandingImageAsBase64(
  imageUrl: string | null | undefined,
): Promise<string | null> {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  const key = brandingCacheKey(imageUrl);
  if (!key) return null;

  const cached = getCachedBrandingBase64(key);
  if (cached) return cached;

  const pending = brandingInflight.get(key);
  if (pending) return pending;

  const promise = loadBrandingImageAsBase64Uncached(imageUrl).then((result) => {
    brandingInflight.delete(key);
    if (result) setCachedBrandingBase64(key, result);
    return result;
  });
  brandingInflight.set(key, promise);
  return promise;
}

/**
 * Carrega cabeçalho, rodapé e marca d'água em paralelo (com cache compartilhado).
 */
export async function fetchBrandingImagesForPdf(
  urls: BrandingImageUrls,
  watermarkOpacity = 0.15,
): Promise<BrandingPdfImages> {
  const [headerBase64, footerBase64, watermarkBase64Raw] = await Promise.all([
    fetchBrandingImageAsBase64(urls.headerImageUrl),
    fetchBrandingImageAsBase64(urls.footerImageUrl),
    fetchBrandingImageAsBase64(urls.watermarkImageUrl),
  ]);
  const watermarkBase64 = watermarkBase64Raw
    ? await applyImageOpacity(watermarkBase64Raw, watermarkOpacity)
    : null;
  return { headerBase64, footerBase64, watermarkBase64 };
}

/** Pré-aquece o cache ao abrir páginas que usam branding (não bloqueia a UI). */
export function warmBrandingPdfCache(urls: BrandingImageUrls): void {
  void Promise.all([
    fetchBrandingImageAsBase64(urls.headerImageUrl),
    fetchBrandingImageAsBase64(urls.footerImageUrl),
    fetchBrandingImageAsBase64(urls.watermarkImageUrl),
  ]).catch(() => {});
}

export { downloadJsPdf, imageDataUrlToJpegForPdf, PDF_EMBED_JPEG_QUALITY } from '@/lib/pdf-export-utils';
