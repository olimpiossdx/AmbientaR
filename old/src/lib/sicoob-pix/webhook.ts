import type { SicoobWebhookPixItem } from "@/lib/sicoob-pix/types";

export function parseSicoobWebhookBody(raw: unknown): SicoobWebhookPixItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter((item) => item && typeof item === "object") as SicoobWebhookPixItem[];
  }
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.pix)) return obj.pix as SicoobWebhookPixItem[];
    if (obj.txid || obj.endToEndId) return [obj as SicoobWebhookPixItem];
  }
  return [];
}

export function validateSicoobWebhookToken(
  headerToken: string | null,
  expected: string | undefined,
): boolean {
  if (!expected?.trim()) {
    return process.env.NODE_ENV !== "production";
  }
  return headerToken === expected;
}
