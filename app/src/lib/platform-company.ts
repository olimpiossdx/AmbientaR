import type { Firestore } from "firebase/firestore";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { EnvironmentalCompany, PlatformContractPublic } from "@/lib/types";

export const PLATFORM_CONTRACT_PUBLIC_SETTING_ID = "platformContractPublic";

export function buildPlatformContractPublic(
  company: EnvironmentalCompany,
): PlatformContractPublic {
  return {
    activeCompanyId: company.id,
    name: company.name,
    fantasyName: company.fantasyName,
    cnpj: company.cnpj,
    address: company.address,
    numero: company.numero,
    municipio: company.municipio,
    district: company.district,
    uf: company.uf,
    cep: company.cep,
    email: company.email,
    bankName: company.bankName,
    bankAgency: company.bankAgency,
    bankAccount: company.bankAccount,
    bankAccountType: company.bankAccountType,
    pixKey: company.pixKey,
    pixCopyPaste: company.pixCopyPaste,
    updatedAt: new Date().toISOString(),
  };
}

export function formatPlatformCompanyAddress(
  c: Pick<
    PlatformContractPublic,
    "address" | "numero" | "district" | "municipio" | "uf" | "cep"
  >,
): string {
  const parts = [
    c.address,
    c.numero ? `nº ${c.numero}` : undefined,
    c.district,
    c.municipio && c.uf ? `${c.municipio}/${c.uf}` : c.municipio || c.uf,
    c.cep ? `CEP ${c.cep}` : undefined,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "território nacional";
}

export function formatContratadaIntro(
  company: PlatformContractPublic | null | undefined,
): string {
  if (!company?.name || !company.cnpj) {
    return (
      "PIMENTA CONSULTORIA AMBIENTAL, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº que consta de " +
      "seus registros públicos, com sede em território nacional, doravante simplesmente \"CONTRATADA\" ou \"PIMENTA\"."
    );
  }
  const apelido = company.fantasyName?.trim();
  const sufixoApelido = apelido
    ? ` ou \"${apelido}\"`
    : ` ou \"${company.name.split(/\s+/)[0] || "CONTRATADA"}\"`;
  return (
    `${company.name}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${company.cnpj}, ` +
    `com sede em ${formatPlatformCompanyAddress(company)}, doravante simplesmente \"CONTRATADA\"${sufixoApelido}.`
  );
}

export function formatBankAccountLabel(
  accountType: PlatformContractPublic["bankAccountType"] | undefined,
): string {
  if (accountType === "poupanca") return "Poupança";
  if (accountType === "corrente") return "Corrente";
  return "Conta";
}

/** Publica empresa ativa em companySettings (leitura pública no cadastro). */
export async function syncActivePlatformCompanyDocs(
  firestore: Firestore,
  company: EnvironmentalCompany,
): Promise<void> {
  const publicSnap = buildPlatformContractPublic(company);
  const { id: _id, ...profile } = company;
  await Promise.all([
    setDoc(
      doc(firestore, "companySettings", PLATFORM_CONTRACT_PUBLIC_SETTING_ID),
      publicSnap,
      { merge: true },
    ),
    setDoc(doc(firestore, "companySettings", "companyProfile"), profile, {
      merge: true,
    }),
  ]);
}

export async function getActivePlatformCompanyId(
  firestore: Firestore,
): Promise<string | null> {
  const snap = await getDoc(
    doc(firestore, "companySettings", PLATFORM_CONTRACT_PUBLIC_SETTING_ID),
  );
  if (!snap.exists()) return null;
  const data = snap.data() as PlatformContractPublic;
  return data.activeCompanyId ?? null;
}

export function resolvePlatformPixCopyPaste(
  platform: PlatformContractPublic | null | undefined,
  envFallback = true,
): string {
  const fromCompany = platform?.pixCopyPaste?.trim();
  if (fromCompany) return fromCompany;
  if (!envFallback) return "";
  if (
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_AMBIENTAR_PIX_COPIA_E_COLA
  ) {
    return process.env.NEXT_PUBLIC_AMBIENTAR_PIX_COPIA_E_COLA;
  }
  return "";
}

export function hasPlatformBankDetails(
  platform: PlatformContractPublic | null | undefined,
): boolean {
  if (!platform) return false;
  return Boolean(
    platform.bankName ||
      platform.bankAgency ||
      platform.bankAccount ||
      platform.pixKey,
  );
}
