import { maskCnpj, maskCpf, unmask } from "@/lib/masks";
import type { EntityType } from "@/lib/types";

export type CpfCnpjKind = "cpf" | "cnpj" | "invalid";

export type TitularType = "pessoa_fisica" | "pessoa_juridica";

export function normalizeCpfCnpj(raw: string | undefined | null): string {
  return unmask(raw ?? "").trim();
}

export function detectCpfCnpjKind(raw: string | undefined | null): CpfCnpjKind {
  const digits = normalizeCpfCnpj(raw);
  if (digits.length === 11) return "cpf";
  if (digits.length === 14) return "cnpj";
  return "invalid";
}

export function formatCpfCnpj(raw: string | undefined | null): string {
  const digits = normalizeCpfCnpj(raw);
  if (digits.length === 11) return maskCpf(digits);
  if (digits.length === 14) return maskCnpj(digits);
  return raw ?? "";
}

export function isValidCpf(raw: string | undefined | null): boolean {
  const cpf = normalizeCpfCnpj(raw);
  if (!/^\d{11}$/.test(cpf)) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
  let first = (sum * 10) % 11;
  if (first === 10) first = 0;
  if (first !== Number(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
  let second = (sum * 10) % 11;
  if (second === 10) second = 0;

  return second === Number(cpf[10]);
}

export function isValidCnpj(raw: string | undefined | null): boolean {
  const cnpj = normalizeCpfCnpj(raw);
  if (!/^\d{14}$/.test(cnpj)) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const calc = (base: string, weights: number[]) => {
    const sum = weights.reduce((acc, weight, index) => {
      return acc + Number(base[index]) * weight;
    }, 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const first = calc(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = calc(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return first === Number(cnpj[12]) && second === Number(cnpj[13]);
}

export function isValidCpfCnpj(raw: string | undefined | null): boolean {
  const kind = detectCpfCnpjKind(raw);
  if (kind === "cpf") return isValidCpf(raw);
  if (kind === "cnpj") return isValidCnpj(raw);
  return false;
}

export function resolveTitularType(
  raw: string | undefined | null,
): TitularType | null {
  const kind = detectCpfCnpjKind(raw);
  if (kind === "cpf") return "pessoa_fisica";
  if (kind === "cnpj") return "pessoa_juridica";
  return null;
}

export function resolveEntityType(raw: string | undefined | null): EntityType {
  return detectCpfCnpjKind(raw) === "cnpj" ? "Pessoa Jurídica" : "Pessoa Física";
}

export function buildCpfCnpjIdentityFields(raw: string | undefined | null) {
  const digits = normalizeCpfCnpj(raw);
  const kind = detectCpfCnpjKind(digits);
  return {
    cpfCnpj: digits,
    titularDocument: digits,
    titularType: resolveTitularType(digits),
    entityType: resolveEntityType(digits),
    formattedDocument: formatCpfCnpj(digits),
    isCpf: kind === "cpf",
    isCnpj: kind === "cnpj",
  };
}
