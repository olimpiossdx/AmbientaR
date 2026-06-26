import type {
  Contract,
  EnvironmentalCompany,
  PlatformContractPublic,
  TechnicalResponsible,
} from "@/lib/types";
import { formatPlatformCompanyAddress } from "@/lib/platform-company";

export type ContratadoSnapshot = Contract["contratado"];
export type ResponsavelTecnicoSnapshot = Contract["responsavelTecnico"];

type CompanyLike = Pick<
  EnvironmentalCompany,
  | "name"
  | "cnpj"
  | "address"
  | "numero"
  | "municipio"
  | "district"
  | "uf"
  | "cep"
>;

const PLACEHOLDER = "_______________";

/** Empresa ativa: prioriza cadastro principal (`environmentalCompanies` + platformContractPublic). */
export function resolveContractActiveCompany(
  activePlatformCompany: EnvironmentalCompany | null | undefined,
  companyProfile: Omit<EnvironmentalCompany, "id"> | null | undefined,
  platformPublic: PlatformContractPublic | null | undefined,
): CompanyLike | null {
  if (activePlatformCompany?.name && activePlatformCompany.cnpj) {
    return activePlatformCompany;
  }
  if (companyProfile?.name && companyProfile.cnpj) {
    return companyProfile;
  }
  if (platformPublic?.name && platformPublic.cnpj) {
    return platformPublic;
  }
  return activePlatformCompany ?? companyProfile ?? platformPublic ?? null;
}

export function buildContratadoFromCompany(
  company: CompanyLike | null | undefined,
): ContratadoSnapshot {
  if (!company?.name?.trim()) {
    return { name: "", address: "", cnpj: "" };
  }
  return {
    name: company.name.trim(),
    cnpj: company.cnpj?.trim() || "",
    address: formatPlatformCompanyAddress(company),
    municipio: company.municipio?.trim() || "",
    uf: company.uf?.trim() || "",
  };
}

/** Endereço completo a partir do cadastro em Configurações → Responsáveis técnicos. */
export function formatTechnicalResponsibleAddress(
  rt: Pick<
    TechnicalResponsible,
    "address" | "numero" | "bairro" | "municipio" | "uf" | "cep"
  >,
): string {
  const parts = [
    rt.address?.trim(),
    rt.numero?.trim() ? `nº ${rt.numero.trim()}` : undefined,
    rt.bairro?.trim(),
    rt.municipio?.trim() && rt.uf?.trim()
      ? `${rt.municipio.trim()}/${rt.uf.trim()}`
      : rt.municipio?.trim() || rt.uf?.trim(),
    rt.cep?.trim() ? `CEP ${rt.cep.trim()}` : undefined,
  ].filter(Boolean);
  return parts.join(", ");
}

export function buildResponsavelFromTechnical(
  rt: TechnicalResponsible | null | undefined,
  responsibleId = "",
): ResponsavelTecnicoSnapshot {
  if (!rt) {
    return {
      responsibleId,
      name: "",
      profession: "",
      nacionalidade: "brasileira",
      estadoCivil: "",
      cpf: "",
      identidade: "",
      emissor: "",
      address: "",
      municipio: "",
      uf: "",
    };
  }
  const fullAddress = formatTechnicalResponsibleAddress(rt);
  return {
    responsibleId: responsibleId || rt.id,
    name: rt.name?.trim() || "",
    profession: rt.profession?.trim() || "",
    nacionalidade: rt.nacionalidade?.trim() || "brasileira",
    estadoCivil: rt.estadoCivil?.trim() || "",
    cpf: rt.cpf?.trim() || "",
    identidade: rt.identidade?.trim() || "",
    emissor: rt.emissor?.trim() || "",
    address: fullAddress || rt.address?.trim() || "",
    municipio: rt.municipio?.trim() || "",
    uf: rt.uf?.trim() || "",
    registrationNumber: rt.registrationNumber?.trim() || "",
    art: rt.art?.trim() || "",
  };
}

/** Cidade do responsável para o contrato (município/UF do cadastro). */
export function formatResponsavelDomicilio(
  responsavel: Pick<
    ResponsavelTecnicoSnapshot,
    "municipio" | "uf" | "address"
  > | null | undefined,
): string {
  if (!responsavel) return "";
  const mun = responsavel.municipio?.trim();
  const uf = responsavel.uf?.trim();
  if (mun && uf) return `${mun}/${uf}`;
  if (mun) return mun;
  return responsavel.address?.trim() || "";
}

function orPlaceholder(value: string | undefined | null): string {
  return value?.trim() || PLACEHOLDER;
}

/** Parágrafo introdutório da CONTRATADA (modelo contrato de prestação de serviços). */
export function formatContratadaContractIntroParagraph(
  contratado: ContratadoSnapshot | null | undefined,
  responsavel: ResponsavelTecnicoSnapshot | null | undefined,
): string {
  const c = contratado ?? { name: "" };
  const r = responsavel ?? { responsibleId: "", name: "" };

  const razao = orPlaceholder(c.name);
  const sede = orPlaceholder(c.address);
  const cnpjPart = c.cnpj?.trim()
    ? `CNPJ ${c.cnpj.trim()}`
    : `CNPJ ${PLACEHOLDER}`;

  const nomeRt = orPlaceholder(r.name);
  const profissao = orPlaceholder(r.profession);
  const nacionalidade = (r.nacionalidade?.trim() || "brasileira").toLowerCase();
  const estadoCivil = (r.estadoCivil?.trim() || PLACEHOLDER).toLowerCase();
  const cpf = orPlaceholder(r.cpf);
  const identidade = orPlaceholder(r.identidade);
  const emissorSuffix = r.emissor?.trim() ? `SSP-${r.emissor.trim()}` : "SSP";
  const cidade = formatResponsavelDomicilio(r) || PLACEHOLDER;

  return (
    `e do outro lado a ${razao}, com sede em ${sede}, ${cnpjPart}, ` +
    `sob responsabilidade técnica do(a) Sr(a). ${nomeRt}, ${profissao}, ${nacionalidade}, ` +
    `${estadoCivil}, CPF ${cpf} e Cédula de Identidade nº ${identidade} ${emissorSuffix}, ` +
    `residente e domiciliado na cidade de ${cidade}, doravante denominada CONTRATADA. ` +
    `Mediantes as cláusulas e condições seguintes tem justo e contrato o que se segue:`
  );
}

export type ContratadaMissingField = { id: string; label: string; where: string };

export function getContratadaMissingFields(
  contratado: ContratadoSnapshot | null | undefined,
  responsavel: ResponsavelTecnicoSnapshot | null | undefined,
): ContratadaMissingField[] {
  const missing: ContratadaMissingField[] = [];
  const c = contratado;
  const r = responsavel;

  if (!c?.name?.trim()) {
    missing.push({
      id: "company-name",
      label: "Razão social",
      where: "Cadastro → Empresas (empresa principal)",
    });
  }
  if (!c?.cnpj?.trim()) {
    missing.push({
      id: "company-cnpj",
      label: "CNPJ",
      where: "Cadastro → Empresas",
    });
  }
  if (!c?.address?.trim() && !c?.municipio?.trim()) {
    missing.push({
      id: "company-address",
      label: "Endereço / município da sede",
      where: "Cadastro → Empresas",
    });
  }
  if (!r?.responsibleId?.trim()) {
    missing.push({
      id: "rt-select",
      label: "Responsável técnico selecionado",
      where: "Formulário do contrato",
    });
  }
  if (!r?.name?.trim()) {
    missing.push({
      id: "rt-name",
      label: "Nome do responsável técnico",
      where: "Cadastro → Responsáveis técnicos",
    });
  }
  if (!r?.cpf?.trim()) {
    missing.push({
      id: "rt-cpf",
      label: "CPF do responsável técnico",
      where: "Cadastro → Responsáveis técnicos",
    });
  }
  if (!formatResponsavelDomicilio(r)) {
    missing.push({
      id: "rt-city",
      label: "Município/UF (ou endereço) do responsável",
      where: "Cadastro → Responsáveis técnicos",
    });
  }
  if (!r?.profession?.trim()) {
    missing.push({
      id: "rt-profession",
      label: "Profissão / conselho",
      where: "Cadastro → Responsáveis técnicos",
    });
  }

  return missing;
}

export function isContratadaReadyForPdf(
  contratado: ContratadoSnapshot | null | undefined,
  responsavel: ResponsavelTecnicoSnapshot | null | undefined,
): boolean {
  return getContratadaMissingFields(contratado, responsavel).length === 0;
}
