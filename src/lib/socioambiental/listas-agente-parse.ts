import { normalizeCpfCnpj } from "@/lib/cpf-cnpj";

export function parseBeneficiariosCpr(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  const parts = raw
    .split(/[\n,;]+/)
    .map((p) => normalizeCpfCnpj(p))
    .filter((d) => d.length >= 11);
  return [...new Set(parts)];
}
