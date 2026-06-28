type ClassValue = string | number | boolean | undefined | null | ClassValue[] | Record<string, boolean | undefined | null>;

function toValue(value: ClassValue): string {
  if (!value) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(toValue).filter(Boolean).join(' ');
  return Object.entries(value).filter(([, enabled]) => Boolean(enabled)).map(([key]) => key).join(' ');
}

export function cn(...values: ClassValue[]): string {
  return values.map(toValue).filter(Boolean).join(' ');
}
