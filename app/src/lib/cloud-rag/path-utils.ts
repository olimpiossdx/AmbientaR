import { normalizeOnedriveFolderPath } from "@/lib/onedrive/path-utils";

export function normalizeLibraryPath(input: string): string {
  return normalizeOnedriveFolderPath(input);
}

/** Extrai hint de cliente a partir de .../CLIENTES/Nome/... */
export function clientHintFromPath(path: string): string | undefined {
  const parts = path.split("/").filter(Boolean);
  const idx = parts.findIndex((p) => p.toLowerCase() === "clientes");
  if (idx >= 0 && parts[idx + 1]) {
    return parts[idx + 1];
  }
  return undefined;
}

export function extensionFromName(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return "";
  return name.slice(dot).toLowerCase();
}

export function fileDocId(driveId: string, itemId: string): string {
  return `${driveId}_${itemId}`;
}

export function chunkDocId(fileId: string, chunkIndex: number): string {
  return `${fileId}_c${chunkIndex}`;
}
