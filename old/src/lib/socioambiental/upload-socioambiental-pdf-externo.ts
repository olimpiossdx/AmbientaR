import {
  assertFileAllowedForPackage,
  sanitizeStorageFileName,
  uploadFileToStorage,
} from "@/lib/storage-upload";
import type { AppUser } from "@/lib/types";

const MAX_PDF_BYTES = 20 * 1024 * 1024;

export function buildSocioambientalPdfExternoPath(
  userId: string,
  fileName: string,
): string {
  const safe = sanitizeStorageFileName(fileName);
  const base = safe.toLowerCase().endsWith(".pdf") ? safe : `${safe}.pdf`;
  return `socioambiental/${userId}/${Date.now()}_${base}`;
}

export async function uploadSocioambientalPdfExterno(params: {
  file: File;
  userId: string;
  user?: Pick<AppUser, "role" | "package" | "platformPaymentStatus"> | null;
}): Promise<string> {
  const isPdf =
    params.file.type === "application/pdf" ||
    params.file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    throw new Error("Selecione um arquivo PDF.");
  }
  if (params.file.size > MAX_PDF_BYTES) {
    throw new Error("PDF muito grande (máximo 20 MB).");
  }
  if (params.user) {
    assertFileAllowedForPackage(params.file, params.user);
  }
  const path = buildSocioambientalPdfExternoPath(params.userId, params.file.name);
  return uploadFileToStorage(params.file, path);
}
