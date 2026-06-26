import type { UseFormGetValues, UseFormSetValue, FieldValues, Path } from "react-hook-form";
import type { EnvironmentalCompany, PlatformContractPublic } from "@/lib/types";

export type ContractPaymentBankSnapshot = {
  banco: string;
  agencia: string;
  conta: string;
  pix: string;
};

type CompanyBankSource = Pick<
  EnvironmentalCompany,
  "bankName" | "bankAgency" | "bankAccount" | "pixKey"
>;

type SupplierBankSource = {
  bankName?: string;
  agency?: string;
  account?: string;
  pixKey?: string;
};

export function hasCompanyBankDetails(
  source: CompanyBankSource | PlatformContractPublic | null | undefined,
): boolean {
  if (!source) return false;
  return Boolean(
    source.bankName?.trim() ||
      source.bankAgency?.trim() ||
      source.bankAccount?.trim() ||
      source.pixKey?.trim(),
  );
}

/** Resolve banco/agência/conta/PIX a partir de Cadastro → Empresas (companyProfile ou snapshot público). */
export function toContractPaymentBankFromCompany(
  source: CompanyBankSource | PlatformContractPublic | null | undefined,
): ContractPaymentBankSnapshot {
  return {
    banco: source?.bankName?.trim() ?? "",
    agencia: source?.bankAgency?.trim() ?? "",
    conta: source?.bankAccount?.trim() ?? "",
    pix: source?.pixKey?.trim() ?? "",
  };
}

export function toContractPaymentBankFromSupplier(
  bankDetails: SupplierBankSource | null | undefined,
): ContractPaymentBankSnapshot {
  return {
    banco: bankDetails?.bankName?.trim() ?? "",
    agencia: bankDetails?.agency?.trim() ?? "",
    conta: bankDetails?.account?.trim() ?? "",
    pix: bankDetails?.pixKey?.trim() ?? "",
  };
}

/** Preenche campos de pagamento vazios (não sobrescreve valores já digitados). */
export function fillEmptyContractPaymentBank<T extends FieldValues>(
  setValue: UseFormSetValue<T>,
  getValues: UseFormGetValues<T>,
  prefix: "pagamento",
  snapshot: ContractPaymentBankSnapshot,
): void {
  const entries: Array<[keyof ContractPaymentBankSnapshot, Path<T>]> = [
    ["banco", `${prefix}.banco` as Path<T>],
    ["agencia", `${prefix}.agencia` as Path<T>],
    ["conta", `${prefix}.conta` as Path<T>],
    ["pix", `${prefix}.pix` as Path<T>],
  ];

  for (const [key, path] of entries) {
    const next = snapshot[key];
    if (!next) continue;
    const current = getValues(path);
    if (!current || !String(current).trim()) {
      setValue(path, next as T[Path<T>], { shouldDirty: false });
    }
  }
}
