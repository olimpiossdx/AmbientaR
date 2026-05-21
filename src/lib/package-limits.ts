import type { AppUser, ClientPackage, UserRole } from "@/lib/types";
import { isClientePortalRole } from "@/lib/role-guards";

/** Limites comerciais por pacote (portal Cliente Gestão / Autônomo). */
export type PackageLimits = {
  tierLabel: string;
  maxEmpreendimentos: number;
  maxStorageBytes: number;
  maxTotalFiles: number;
  maxFileSizeBytes: number;
  maxLicencasAtivas: number;
  ambbotIncludedPerMonth: number;
  /** Preço avulso AmbBot Standard (referência UI). */
  ambbotExtraPriceLabel: string;
  /** Plano gratuito: sem anexos no Storage. */
  allowsStorageUpload: boolean;
  /** Alertas de vencimento/prazo no sino e notificações automáticas. */
  allowsDeadlineAlerts: boolean;
  /**
   * Máximo de registros por módulo (licenças, outorgas, etc.).
   * `null` = sem teto por módulo (pode existir teto agregado em maxLicencasAtivas).
   */
  maxRecordsPerModule: number | null;
  /** Exibição de publicidade de terceiros (ex.: rede Google) — ver contrato plano Gratuito. */
  showsThirdPartyAdvertising: boolean;
};

const MB = 1024 * 1024;
const GB = 1024 * MB;

/** Catálogo único — fonte de verdade para limites e textos de plano. */
export const PACKAGE_LIMITS: Record<ClientPackage, PackageLimits> = {
  gratuito: {
    tierLabel: "Gratuito (degustação)",
    maxEmpreendimentos: 1,
    maxStorageBytes: 0,
    maxTotalFiles: 0,
    maxFileSizeBytes: 0,
    maxLicencasAtivas: 1,
    ambbotIncludedPerMonth: 0,
    ambbotExtraPriceLabel: "R$ 99",
    allowsStorageUpload: false,
    allowsDeadlineAlerts: false,
    maxRecordsPerModule: 1,
    showsThirdPartyAdvertising: true,
  },
  basico: {
    tierLabel: "Autônomo 1",
    maxEmpreendimentos: 1,
    maxStorageBytes: 1 * GB,
    maxTotalFiles: 30,
    maxFileSizeBytes: 10 * MB,
    maxLicencasAtivas: 5,
    ambbotIncludedPerMonth: 0,
    ambbotExtraPriceLabel: "R$ 99",
    allowsStorageUpload: true,
    allowsDeadlineAlerts: true,
    maxRecordsPerModule: null,
    showsThirdPartyAdvertising: false,
  },
  intermediario: {
    tierLabel: "Autônomo 2",
    maxEmpreendimentos: 2,
    maxStorageBytes: 3 * GB,
    maxTotalFiles: 60,
    maxFileSizeBytes: 10 * MB,
    maxLicencasAtivas: 10,
    ambbotIncludedPerMonth: 1,
    ambbotExtraPriceLabel: "R$ 79",
    allowsStorageUpload: true,
    allowsDeadlineAlerts: true,
    maxRecordsPerModule: null,
    showsThirdPartyAdvertising: false,
  },
  avancado: {
    tierLabel: "Autônomo 3",
    maxEmpreendimentos: 3,
    maxStorageBytes: 6 * GB,
    maxTotalFiles: 90,
    maxFileSizeBytes: 15 * MB,
    maxLicencasAtivas: 15,
    ambbotIncludedPerMonth: 1,
    ambbotExtraPriceLabel: "R$ 79",
    allowsStorageUpload: true,
    allowsDeadlineAlerts: true,
    maxRecordsPerModule: null,
    showsThirdPartyAdvertising: false,
  },
  completo: {
    tierLabel: "Autônomo 5",
    maxEmpreendimentos: 5,
    maxStorageBytes: 12 * GB,
    maxTotalFiles: 150,
    maxFileSizeBytes: 15 * MB,
    maxLicencasAtivas: 25,
    ambbotIncludedPerMonth: 1,
    ambbotExtraPriceLabel: "R$ 79",
    allowsStorageUpload: true,
    allowsDeadlineAlerts: true,
    maxRecordsPerModule: null,
    showsThirdPartyAdvertising: false,
  },
  sob_consulta: {
    tierLabel: "Sob consulta",
    maxEmpreendimentos: 999,
    maxStorageBytes: 100 * GB,
    maxTotalFiles: 9999,
    maxFileSizeBytes: 50 * MB,
    maxLicencasAtivas: 999,
    ambbotIncludedPerMonth: 999,
    ambbotExtraPriceLabel: "Sob consulta",
    allowsStorageUpload: true,
    allowsDeadlineAlerts: true,
    maxRecordsPerModule: null,
    showsThirdPartyAdvertising: false,
  },
};

/** Coleções do portal com limite “1 registro por tipo” no plano gratuito. */
export const PORTAL_MODULE_COLLECTIONS = [
  "licenses",
  "outorgas",
  "condicionantes",
  "usosInsignificantes",
  "intervencoes",
] as const;

export type PortalModuleCollection = (typeof PORTAL_MODULE_COLLECTIONS)[number];

export const PORTAL_MODULE_LABELS: Record<PortalModuleCollection, string> = {
  licenses: "licença",
  outorgas: "outorga",
  condicionantes: "condicionante",
  usosInsignificantes: "uso insignificante",
  intervencoes: "intervenção",
};

/** Valores anuais (cadastro / PIX). */
export const PACKAGE_ANNUAL_PRICE_BRL: Partial<Record<ClientPackage, number>> = {
  basico: 696,
  intermediario: 1396,
  avancado: 1996,
  completo: 2996,
};

export function formatPackageAnnualLabel(pkg: ClientPackage): string {
  if (pkg === "gratuito") return "R$ 0";
  if (pkg === "sob_consulta") return "Sob consulta";
  const value = PACKAGE_ANNUAL_PRICE_BRL[pkg];
  if (value == null) return "Consulte a equipe";
  return `R$ ${value.toFixed(2).replace(".", ",")} / ano`;
}

export function formatPackageMonthlyHint(pkg: ClientPackage): string {
  if (pkg === "gratuito" || pkg === "sob_consulta") {
    return PACKAGE_LIMITS[pkg].tierLabel;
  }
  const annual = PACKAGE_ANNUAL_PRICE_BRL[pkg];
  if (!annual) return "";
  const monthly = annual / 12;
  return `~R$ ${monthly.toFixed(0)}/mês`;
}

import type { ClientPackageInfo } from "@/lib/types";

/** Textos de planos alinhados aos limites (cadastro e upgrade). */
export const CLIENT_PACKAGE_CATALOG: ClientPackageInfo[] = [
  {
    id: "gratuito",
    name: "Gratuito",
    description: "Conheça o portal com 1 empreendimento.",
    price: "R$ 0",
    priceDetail: "Sem AmbBot incluído",
    features: [
      "Até 1 empreendimento",
      "1 registro por módulo (licença, outorga, etc.)",
      "Sem upload de arquivos",
      "Sem alertas automáticos de prazo",
      "Versão com publicidade de terceiros (ver contrato)",
      "AmbBot avulso (R$ 99/consulta)",
    ],
  },
  {
    id: "basico",
    name: "Autônomo 1",
    description: "Uma propriedade com gestão de documentos e prazos.",
    price: formatPackageAnnualLabel("basico"),
    priceDetail: formatPackageMonthlyHint("basico"),
    features: [
      "Até 1 empreendimento",
      "1 GB · 30 arquivos (10 MB cada)",
      "Até 5 licenças ativas",
      "AmbBot avulso (R$ 99/consulta)",
    ],
  },
  {
    id: "intermediario",
    name: "Autônomo 2",
    description: "Duas propriedades e 1 análise AmbBot por mês.",
    price: formatPackageAnnualLabel("intermediario"),
    priceDetail: formatPackageMonthlyHint("intermediario"),
    highlighted: true,
    features: [
      "Até 2 empreendimentos",
      "3 GB · 60 arquivos",
      "1 AmbBot / mês (análise de área)",
      "Consultas extras: R$ 79",
    ],
  },
  {
    id: "avancado",
    name: "Autônomo 3",
    description: "Três propriedades com monitoramento e representante.",
    price: formatPackageAnnualLabel("avancado"),
    priceDetail: formatPackageMonthlyHint("avancado"),
    features: [
      "Até 3 empreendimentos",
      "6 GB · 90 arquivos",
      "1 AmbBot / mês",
      "Condicionantes e outorgas (cadastro)",
    ],
  },
  {
    id: "completo",
    name: "Autônomo 5",
    description: "Até cinco propriedades na gestão centralizada.",
    price: formatPackageAnnualLabel("completo"),
    priceDetail: formatPackageMonthlyHint("completo"),
    features: [
      "Até 5 empreendimentos",
      "12 GB · 150 arquivos",
      "1 AmbBot / mês",
      "Suporte prioritário",
    ],
  },
  {
    id: "sob_consulta",
    name: "Sob consulta",
    description: "Mais de 5 empreendimentos ou demandas específicas.",
    price: "Personalizado",
    priceDetail: "Limites negociados",
    features: [
      "Empreendimentos e storage sob medida",
      "AmbBot e consultoria dedicada",
      "Projetos e assessoria presencial",
    ],
  },
];

const INTERNAL_ROLES: UserRole[] = [
  "admin",
  "gestor",
  "supervisor",
  "technical",
  "sales",
  "financial",
  "advogado",
  "diretor_fauna",
];

export function resolveEffectivePackage(
  user: Pick<AppUser, "package" | "role">,
): ClientPackage {
  if (user.package) return user.package;
  if (user.role === "cliente_autonomo") return "gratuito";
  return "gratuito";
}

/** Equipa da consultoria e perfis sem pacote de portal não sofrem limites. */
export function isPackageLimitsExempt(
  user: Pick<AppUser, "role" | "package" | "platformPaymentStatus">,
): boolean {
  if (INTERNAL_ROLES.includes(user.role)) return true;
  if (user.package === "sob_consulta") return true;
  if (user.platformPaymentStatus === "exempt") return true;
  return false;
}

/** Titular/autônomo com pacote (ou autônomo sem pacote = gratuito). */
export function isSubjectToPackageLimits(
  user: Pick<AppUser, "role" | "package">,
): boolean {
  if (isPackageLimitsExempt(user)) return false;
  if (user.role === "cliente_autonomo") return true;
  if (user.package && isClientePortalRole(user.role)) return true;
  return false;
}

export function getPackageLimits(
  user: Pick<AppUser, "package" | "role">,
): PackageLimits {
  const pkg = resolveEffectivePackage(user);
  return PACKAGE_LIMITS[pkg];
}

/** Período mensal de uso do AmbBot (UTC). */
export function getAmbbotUsagePeriodKey(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function formatStorageLimit(bytes: number): string {
  if (bytes >= GB) return `${(bytes / GB).toFixed(0)} GB`;
  return `${Math.round(bytes / MB)} MB`;
}

export type PackageLimitCheckCode =
  | "ok"
  | "empreendimento_limit"
  | "ambbot_no_credit"
  | "file_too_large"
  | "file_count_limit"
  | "upload_not_allowed"
  | "module_record_limit";

export function isGratuitoPackage(
  user: Pick<AppUser, "package" | "role">,
): boolean {
  return resolveEffectivePackage(user) === "gratuito";
}

export function packageShowsThirdPartyAdvertising(
  pkg: ClientPackage | undefined | null,
): boolean {
  if (!pkg) return false;
  return PACKAGE_LIMITS[pkg]?.showsThirdPartyAdvertising === true;
}

export function buildLimitErrorMessage(
  code: PackageLimitCheckCode,
  limits: PackageLimits,
): string {
  switch (code) {
    case "empreendimento_limit":
      return `Seu plano (${limits.tierLabel}) permite até ${limits.maxEmpreendimentos} empreendimento(s). Faça upgrade para cadastrar mais.`;
    case "ambbot_no_credit":
      if (limits.ambbotIncludedPerMonth === 0) {
        return `Seu plano não inclui AmbBot mensal. Contrate uma análise avulsa (${limits.ambbotExtraPriceLabel}) ou faça upgrade para Autônomo 2+.`;
      }
      return `Você já usou a análise AmbBot incluída neste mês. Próxima consulta: ${limits.ambbotExtraPriceLabel} (avulso) ou aguarde o próximo ciclo.`;
    case "file_too_large":
      return `Arquivo acima do limite do plano (máx. ${formatStorageLimit(limits.maxFileSizeBytes)} por arquivo).`;
    case "file_count_limit":
      return `Limite de arquivos do plano atingido (máx. ${limits.maxTotalFiles}).`;
    case "upload_not_allowed":
      return `O plano ${limits.tierLabel} não permite envio de arquivos. Faça upgrade para anexar documentos.`;
    case "module_record_limit":
      return `No plano gratuito é permitido apenas 1 registro por tipo de dado. Faça upgrade para cadastrar mais.`;
    default:
      return "";
  }
}
