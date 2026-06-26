/**
 * MIME reportado pelo browser pode vir vazio (comum no Windows / alguns SO).
 * Complementa com inferência pela extensão para validação e metadata no Storage.
 */
export function inferMimeTypeFromFileName(fileName: string): string {
  const lower = (fileName || "").toLowerCase();
  const dot = lower.lastIndexOf(".");
  const ext = dot >= 0 ? lower.slice(dot) : "";
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".heic":
      return "image/heic";
    case ".heif":
      return "image/heif";
    case ".zip":
      return "application/zip";
    default:
      return "";
  }
}

export function effectiveMimeType(file: File): string {
  const reported = (file.type || "").trim().toLowerCase();
  const fromName = inferMimeTypeFromFileName(file.name);
  if (
    (reported === "application/octet-stream" || reported === "") &&
    fromName
  ) {
    return fromName;
  }
  if (reported) return reported;
  return fromName;
}

export function isPdfLikeFile(file: File): boolean {
  if (effectiveMimeType(file) === "application/pdf") return true;
  return file.name.toLowerCase().endsWith(".pdf");
}

const TRANSACTION_EXT = /\.(pdf|jpe?g|png)$/i;

export function isImageOrPdfForTransaction(file: File): boolean {
  const mime = effectiveMimeType(file);
  const allowedMime = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
  ];
  if (mime && allowedMime.includes(mime)) return true;
  return TRANSACTION_EXT.test(file.name || "");
}
