/**
 * Converte caminho Windows / explorador para path relativo Graph (barras `/`).
 * Ex.: SERVIDOR\Pimenta Ltda\CLIENTES\Nome → Pimenta Ltda/CLIENTES/Nome
 */
export function normalizeOnedriveFolderPath(input: string): string {
  let path = input.trim().replace(/\\/g, "/");
  path = path.replace(/^\/+/, "");
  path = path.replace(/^SERVIDOR\/?/i, "");
  return path.replace(/\/+$/, "");
}

/** URL Graph `root:/path/to/folder:` */
export function toGraphItemByPathUrl(driveId: string, folderPath: string): string {
  const normalized = normalizeOnedriveFolderPath(folderPath);
  const segments = normalized.split("/").filter(Boolean);
  const encoded = segments.map((s) => encodeURIComponent(s)).join("/");
  return `/drives/${encodeURIComponent(driveId)}/root:/${encoded}:`;
}
