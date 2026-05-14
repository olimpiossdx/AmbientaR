'use client';

import { getApp, getApps } from 'firebase/app';
import { getBlob, getDownloadURL, getStorage, ref } from 'firebase/storage';
import { storagePathFromDownloadUrl } from '@/lib/storage-upload';

export interface ImageDimensions {
  width: number;
  height: number;
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
 * Carrega blob de uma URL HTTPS (Storage ou outra) ou path legado no Storage.
 */
async function loadImageBlobForBranding(trimmed: string): Promise<Blob> {
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const useSdk =
      trimmed.includes('firebasestorage.googleapis.com') &&
      typeof getApps === 'function' &&
      getApps().length > 0;
    if (useSdk) {
      const path = storagePathFromDownloadUrl(trimmed);
      if (path) {
        try {
          const storage = getStorage(getApp());
          return await getBlob(ref(storage, path));
        } catch {
          /* continua com fetch */
        }
      }
    }
    const response = await fetch(trimmed, { mode: 'cors', credentials: 'omit' });
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
  const storage = getStorage(getApp());
  const imageRef = ref(storage, trimmed);
  const urlToFetch = await getDownloadURL(imageRef);
  const response = await fetch(urlToFetch, { mode: 'cors', credentials: 'omit' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.blob();
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
 * - Se não houver URL/path, retorna null (documento fica sem imagem).
 * - Imagens JPEG/WebP são normalizadas para PNG (evita addImage com tipo errado).
 */
export async function fetchBrandingImageAsBase64(
  imageUrl: string | null | undefined,
): Promise<string | null> {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  const trimmed = imageUrl.trim();
  if (!trimmed) return null;

  try {
    if (trimmed.startsWith('data:image')) {
      return await imageDataUrlToPngDataUrl(trimmed);
    }

    if (typeof getApps === 'function' && getApps().length === 0) {
      throw new Error('Firebase não inicializado. Recarregue a página.');
    }

    const blob = await loadImageBlobForBranding(trimmed);
    const rawDataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return await imageDataUrlToPngDataUrl(rawDataUrl);
  } catch (error) {
    console.error('Erro ao carregar imagem do branding para PDF:', error);
    return null;
  }
}
