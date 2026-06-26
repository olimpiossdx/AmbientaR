/**
 * Limites centralizados de upload (bytes).
 * Financeiro (menu + pastas Storage): 20 MB. Demais módulos: 40 MB.
 */

export const UPLOAD_MAX_BYTES_DEFAULT = 40 * 1024 * 1024;
export const UPLOAD_MAX_BYTES_FINANCIAL = 20 * 1024 * 1024;

/** Limite bruto no formulário antes da compressão (segurança no browser). */
export const UPLOAD_RAW_FILE_SAFETY_MAX = 150 * 1024 * 1024;

/** Prefixos Firebase Storage tratados como financeiro (ver storage.rules). */
export const FINANCIAL_STORAGE_PREFIXES = [
  "invoices/",
  "transactions/",
  "receipts/",
  "contracts/",
  "signed-contracts/",
  "proposals/",
  "commercial-proposals/",
  "supplier-contracts/",
] as const;

/** Rotas do menu Financeiro (pathname sem query). */
export const FINANCIAL_PATH_PREFIXES = [
  "/bank-access",
  "/clients",
  "/contracts",
  "/contracts-suppliers",
  "/financial",
  "/invoices",
  "/suppliers",
  "/cash-flow",
  "/proposals",
  "/commercial-proposals",
  "/services",
] as const;

export type UploadContext = {
  pathname?: string;
  storagePathPrefix?: string;
};

function normalizePathname(pathname: string): string {
  const base = pathname.split("?")[0]?.split("#")[0] || pathname;
  return base.endsWith("/") && base.length > 1 ? base.slice(0, -1) : base;
}

export function isFinancialStoragePath(storagePath: string): boolean {
  const normalized = storagePath.replace(/\\/g, "/");
  return FINANCIAL_STORAGE_PREFIXES.some((prefix) =>
    normalized.startsWith(prefix),
  );
}

export function isFinancialPathname(pathname: string): boolean {
  const path = normalizePathname(pathname);
  return FINANCIAL_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export function isFinancialUploadContext(context: UploadContext = {}): boolean {
  if (context.storagePathPrefix && isFinancialStoragePath(context.storagePathPrefix)) {
    return true;
  }
  if (context.pathname && isFinancialPathname(context.pathname)) {
    return true;
  }
  return false;
}

export function getUploadMaxBytes(context: UploadContext = {}): number {
  return isFinancialUploadContext(context)
    ? UPLOAD_MAX_BYTES_FINANCIAL
    : UPLOAD_MAX_BYTES_DEFAULT;
}

export function formatUploadLimitMb(context: UploadContext = {}): string {
  const mb = getUploadMaxBytes(context) / 1024 / 1024;
  return `${mb} MB`;
}

export function formatBytesHuman(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function uploadSizeErrorMessage(context: UploadContext = {}): string {
  return `O arquivo não pode exceder ${formatUploadLimitMb(context)}.`;
}
