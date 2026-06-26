export function getLibraryRootPath(): string {
  const fromEnv =
    process.env.ONEDRIVE_LIBRARY_ROOT_PATH?.trim() ||
    process.env.ONEDRIVE_DRIVE_NAME_HINT?.trim() ||
    "Pimenta";
  return fromEnv.replace(/\\/g, "/").replace(/\/+$/, "");
}

export function getMaxFileBytes(): number {
  const mb = Number(process.env.ONEDRIVE_RAG_MAX_FILE_MB || 25);
  return Math.max(1, mb) * 1024 * 1024;
}

export function getMaxFilesPerIndexJob(): number {
  return Math.max(1, Number(process.env.ONEDRIVE_RAG_MAX_FILES_PER_JOB || 50));
}

export function getMaxFilesPerSyncPages(): number {
  return Math.max(1, Number(process.env.ONEDRIVE_RAG_MAX_SYNC_PAGES || 50));
}

export function getChunkChars(): number {
  return Math.max(500, Number(process.env.ONEDRIVE_RAG_CHUNK_CHARS || 3500));
}

export function getMaxRawTextChars(): number {
  return Math.max(
    10_000,
    Number(process.env.ONEDRIVE_RAG_MAX_RAW_TEXT_CHARS || 500_000),
  );
}

export const INDEXABLE_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".md",
  ".csv",
  ".json",
]);

export const SKIP_EXTENSIONS = new Set([
  ".dwg",
  ".zip",
  ".rar",
  ".7z",
  ".exe",
  ".dll",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".mp4",
  ".mp3",
  ".wav",
]);
