import { formatCurrencyBRL } from "@/lib/financial-core";

/** Aplica máscara DD/MM/AAAA enquanto o utilizador digita. */
export function maskBrDateInput(raw: string): string {
  let value = raw.replace(/\D/g, "");
  if (value.length > 2) value = `${value.slice(0, 2)}/${value.slice(2)}`;
  if (value.length > 5) value = `${value.slice(0, 5)}/${value.slice(5)}`;
  return value.slice(0, 10);
}

/** Converte `Date`, ISO ou BR para exibição `dd/MM/yyyy`. */
export function formatDateBr(value?: Date | string | null): string {
  if (!value) return "";
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return "";
    const d = String(value.getDate()).padStart(2, "0");
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const y = value.getFullYear();
    return `${d}/${m}/${y}`;
  }
  return isoDateToBr(value);
}

/** Normaliza `Date`, ISO ou BR para ISO `yyyy-MM-dd` (vazio se inválido). */
export function dateValueToIso(value?: Date | string | null): string {
  if (!value) return "";
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return "";
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  const fromBr = brDateToIso(trimmed);
  return fromBr ?? "";
}

/** ISO `yyyy-MM-dd` → `Date` local (meia-noite). */
export function isoToDate(iso?: string | null): Date | undefined {
  const normalized = dateValueToIso(iso);
  if (!normalized) return undefined;
  const [y, m, d] = normalized.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return isNaN(date.getTime()) ? undefined : date;
}

/** Converte ISO `yyyy-MM-dd` para exibição `dd/MM/yyyy`. */
export function isoDateToBr(iso?: string | null): string {
  if (!iso?.trim()) return "";
  const part = iso.trim().slice(0, 10);
  const isoMatch = part.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${d}/${m}/${y}`;
  }
  const brMatch = part.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) return part;
  return "";
}

/** Converte `dd/MM/yyyy` válida para ISO `yyyy-MM-dd`; inválida → `null`. */
export function brDateToIso(br?: string | null): string | null {
  if (!br?.trim()) return null;
  const match = br.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return `${yyyy}-${mm}-${dd}`;
}

export function todayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Interpreta texto armazenado ou digitado como valor monetário em reais. */
export function parseCurrencyBRLToNumber(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return 0;
  if (/R\$\s?|,\d{2}$/.test(trimmed)) {
    return Number(digits) / 100;
  }
  const normalized = trimmed.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number(digits) / 100;
}

/** Formata número para campo de entrada em BRL (máscara centavos). */
export function formatCurrencyBRLInput(value: number): string {
  return formatCurrencyBRL(Number.isFinite(value) ? value : 0);
}

/** Valor numérico → string BRL para persistência em texto (ex.: Firestore). */
export function currencyNumberToStoredBRL(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  return formatCurrencyBRL(value);
}
