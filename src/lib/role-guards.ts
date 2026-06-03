import type { AppUser, UserRole } from "@/lib/types";
import {
  canConsultorAccessNavItem,
} from "@/lib/consultor-nav-access";

/** Perfil administrador: acesso total na UI (menus, rotas e ações). */
export function isAdminRole(role: UserRole | undefined | null): boolean {
  return role === "admin";
}

/**
 * Item de menu com lista de papéis: admin vê sempre; demais papéis respeitam a lista.
 */
export function canAccessNavItem(
  role: UserRole | undefined | null,
  allowedRoles?: UserRole[] | null,
  href?: string,
): boolean {
  if (isAdminRole(role)) return true;
  if (role === "consultor_representante") {
    return canConsultorAccessNavItem(allowedRoles, href);
  }
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!role) return false;
  return allowedRoles.includes(role);
}

/**
 * Ação ou rota restrita a papéis explícitos: admin sempre incluído.
 */
export function hasAnyRoleOrAdmin(
  role: UserRole | undefined | null,
  allowedRoles: readonly UserRole[],
): boolean {
  if (!role) return false;
  if (isAdminRole(role)) return true;
  return allowedRoles.includes(role);
}

/** Papéis com acesso ao módulo CRM (menu e páginas). */
export const CRM_ACCESS_ROLES = [
  "admin",
  "sales",
  "supervisor",
  "financial",
] as const satisfies readonly UserRole[];

/** Papéis com escrita no CRM (oportunidades, pipeline). */
export const CRM_WRITE_ROLES = [
  "admin",
  "sales",
  "supervisor",
] as const satisfies readonly UserRole[];

export function canAccessCrm(
  role: UserRole | undefined | null,
): boolean {
  return hasAnyRoleOrAdmin(role, CRM_ACCESS_ROLES);
}

export function canWriteCrm(role: UserRole | undefined | null): boolean {
  return hasAnyRoleOrAdmin(role, CRM_WRITE_ROLES);
}

/**
 * Escrita em documentos ambientais operacionais (licenças, outorgas, condicionantes, etc.).
 * Espelha os papéis das páginas operacionais; admin incluído via hasAnyRoleOrAdmin.
 */
export function canPerformOperationalWrite(
  role: UserRole | undefined | null,
): boolean {
  return hasAnyRoleOrAdmin(role, [
    "gestor",
    "supervisor",
    "cliente_autonomo",
    "consultor_representante",
  ]);
}

/** Condicionantes (compliance): admin sempre; equipa operacional e cliente autônomo. */
export function canManageCondicionantes(
  role: UserRole | undefined | null,
): boolean {
  return canPerformOperationalWrite(role);
}

/** Lançamento manual de monitoramento de outorga. */
export function canPerformManualMonitoringWrite(
  role: UserRole | undefined | null,
): boolean {
  return hasAnyRoleOrAdmin(role, ["gestor", "cliente_autonomo", "consultor_representante"]);
}

/**
 * Cadastro (empreendedores, empreendimentos, empresa responsável): escrita na UI.
 */
export function canWriteCadastro(
  role: UserRole | undefined | null,
): boolean {
  if (isAdminRole(role)) return true;
  return (
    role === "supervisor" ||
    role === "gestor" ||
    role === "consultor_representante" ||
    canWriteCadastroClienteAutonomo(role)
  );
}

/** Admin e supervisor: mesmas capacidades de supervisão na UI onde aplicável. */
export function isAdminOrSupervisorRole(
  role: UserRole | undefined | null,
): boolean {
  return isAdminRole(role) || role === "supervisor";
}

/** Plano com acompanhamento supervisão/gestão/assessoria (role técnico `client`). */
export function isClienteGestao(role: UserRole | undefined | null): boolean {
  return role === "client";
}

/** Representante ou consultor: mesmo escopo de menus e filtros por empreendedor. */
export function isRepresentativeLikePortalRole(
  role: UserRole | undefined | null,
): boolean {
  return role === "representative" || isConsultorRepresentante(role);
}

/** Representante: mesmas telas que consultor, mas só leitura operacional. */
export function isRepresentativeReadOnlyPortalRole(
  role: UserRole | undefined | null,
): boolean {
  return role === "representative";
}

/** Planos de acompanhamento autônomo (lançar e acompanhar próprios dados e prazos). */
export function isClienteAutonomo(role: UserRole | undefined | null): boolean {
  return role === "cliente_autonomo";
}

/** Consultor-representante: parceiro externo com escrita operacional na carteira aprovada. */
export function isConsultorRepresentante(
  role: UserRole | undefined | null,
): boolean {
  return role === "consultor_representante";
}

/** Escrita operacional delegada (consultor na carteira aprovada). */
export function canConsultorRepresentanteWrite(
  role: UserRole | undefined | null,
): boolean {
  return isConsultorRepresentante(role);
}

/** Papel com escopo filtrado por approvedConsultorIds (como representante). */
export function isConsultorCarteiraScopeRole(
  role: UserRole | undefined | null,
): boolean {
  return isConsultorRepresentante(role);
}

/** Qualquer titular do portal (Cliente Gestão ou Cliente Autônomo). */
export function isClientePortalRole(role: UserRole | undefined | null): boolean {
  return isClienteGestao(role) || isClienteAutonomo(role);
}

/**
 * Cadastro (Empreendedores, Empreendimentos, Empresa responsável):
 * perfil Cliente Gestão vê dados mas não altera na UI (assessoria da consultoria).
 */
export function isCadastroReadOnlyClienteGestao(
  role: UserRole | undefined | null,
): boolean {
  if (isAdminRole(role)) return false;
  return isClienteGestao(role);
}

/**
 * Cliente Autônomo pode criar/editar/excluir cadastros ligados ao seu uso pago.
 */
export function canWriteCadastroClienteAutonomo(
  role: UserRole | undefined | null,
): boolean {
  return isClienteAutonomo(role);
}

/**
 * Importar empreendedores a partir da coleção `clients`:
 * apenas equipa interna de administração e finanças (não cliente autônomo, portal ou vendas).
 */
export function canImportEmpreendedoresFromClients(
  role: UserRole | undefined | null,
): boolean {
  return hasAnyRoleOrAdmin(role, [
    "admin",
    "supervisor",
    "gestor",
    "financial",
  ]);
}

/** Cliente gestão e representante: menu Licenciamento só para consulta (sem criar/editar). */
export function isProcessosPortalReadOnlyRole(
  role: UserRole | undefined | null,
): boolean {
  if (isAdminRole(role)) return false;
  return role === "client" || role === "representative";
}

/** Quem vê a lista de trâmites filtrada por empreendedores do portal. */
export function isProcessosPortalScopeRole(
  role: UserRole | undefined | null,
): boolean {
  return (
    isProcessosPortalReadOnlyRole(role) || isConsultorRepresentante(role)
  );
}

/** Criar/editar/apagar trâmites de licenciamento e avançar status: equipa interna. */
export function canWriteProcessosInternal(
  role: UserRole | undefined | null,
): boolean {
  return hasAnyRoleOrAdmin(role, [
    "admin",
    "supervisor",
    "gestor",
    "technical",
    "advogado",
    "consultor_representante",
  ]);
}

/** Defesa de auto de infração — elaboração e gestão (equipa interna + advogado). */
export function canManageAutoInfracaoDefesa(
  role: UserRole | undefined | null,
): boolean {
  return hasAnyRoleOrAdmin(role, [
    "advogado",
    "technical",
    "gestor",
    "supervisor",
  ]);
}

/**
 * Quem pode vincular CAR no projeto (recibo PDF, geometria, nº recibo).
 * Cliente Autônomo: nos próprios empreendimentos. Cliente Gestão e representante: só consulta na UI.
 */
export function canManageCarUploadsOnProject(
  role: UserRole | undefined | null,
): boolean {
  if (isAdminRole(role)) return true;
  if (isClienteAutonomo(role)) return true;
  if (isConsultorRepresentante(role)) return true;
  return !isClientePortalRole(role) && role !== "representative";
}

/**
 * Criar/editar propostas comerciais na UI (`commercialProposals`).
 * Aceitar/rejeitar: `canAcceptRejectCommercialProposals` (admin/financeiro; Firestore bloqueia vendas).
 */
export function canManageProposalsAndCommercialQuotes(
  role: UserRole | undefined | null,
): boolean {
  return hasAnyRoleOrAdmin(role, ["admin", "financial", "sales"]);
}

/** UID do perfil (id Firestore ou uid Auth) — ex.: representante em queries. */
export function getAppUserProfileUid(user: Pick<AppUser, "id" | "uid">): string {
  return user.uid || user.id;
}

/** Editar linha na página `/users` (botão lápis). */
export function canEditUserInUsersList(
  sessionRole: UserRole | undefined | null,
  sessionUid: string | null | undefined,
  target: Pick<AppUser, "id" | "uid"> | null | undefined,
): boolean {
  if (!sessionRole || !sessionUid || !target) return false;
  if (isAdminRole(sessionRole) || sessionRole === "supervisor") return true;
  if (sessionRole === "representative" || sessionRole === "consultor_representante") {
    return target.id === sessionUid || target.uid === sessionUid;
  }
  const selfServiceRoles: UserRole[] = [
    "gestor",
    "technical",
    "sales",
    "financial",
    "advogado",
    "diretor_fauna",
  ];
  if (selfServiceRoles.includes(sessionRole)) {
    return target.id === sessionUid || target.uid === sessionUid;
  }
  return false;
}

/** Titular cadastrado pelo fluxo Cadastre-se (campo package no perfil). */
export function isSelfRegisteredPortalUser(
  user: Pick<AppUser, "package">,
): boolean {
  return Boolean(user.package);
}

/** Lançamentos de caixa, faturas, fornecedores, tabela de serviços: escrita admin/financeiro. */
export function isAdminOrFinancialRole(
  role: UserRole | undefined | null,
): boolean {
  return hasAnyRoleOrAdmin(role, ["admin", "financial"]);
}

/** Projetos & ROI — leitura (Fase 3: inclui vendas). */
export function canReadProjectRoi(
  role: UserRole | undefined | null,
): boolean {
  return hasAnyRoleOrAdmin(role, ["admin", "financial", "sales"]);
}

/** Projetos & ROI — escrita (admin/financeiro). */
export function canWriteProjectRoi(
  role: UserRole | undefined | null,
): boolean {
  return isAdminOrFinancialRole(role);
}

/** Projetos & ROI — excluir caso (somente admin). */
export function canDeleteProjectRoi(
  role: UserRole | undefined | null,
): boolean {
  return isAdminRole(role);
}

/** Vendas: visão resumida sem custos detalhados. */
export function isProjectRoiSalesReadOnly(
  role: UserRole | undefined | null,
): boolean {
  return role === "sales";
}

/** Clientes comerciais: escrita admin, financeiro e vendas. */
export function canWriteCommercialClients(
  role: UserRole | undefined | null,
): boolean {
  return hasAnyRoleOrAdmin(role, ["admin", "financial", "sales"]);
}

/** Contratos e contratos-fornecedores: criar/editar (não aprovar) — admin, financeiro, vendas. */
export function canWriteContractsCommercial(
  role: UserRole | undefined | null,
): boolean {
  return hasAnyRoleOrAdmin(role, ["admin", "financial", "sales"]);
}

/** Aprovar contrato (status Aprovado): apenas admin e financeiro. */
export function canApproveContracts(
  role: UserRole | undefined | null,
): boolean {
  return hasAnyRoleOrAdmin(role, ["admin", "financial"]);
}

/** Aceitar/rejeitar proposta comercial: apenas admin e financeiro. */
export function canAcceptRejectCommercialProposals(
  role: UserRole | undefined | null,
): boolean {
  return hasAnyRoleOrAdmin(role, ["admin", "financial"]);
}

/** Ofícios: portal (titular/autônomo) e representante só leem; não criam/editam. */
export function isOficioReadOnlyRole(
  role: UserRole | undefined | null,
): boolean {
  if (isAdminRole(role)) return false;
  return (
    isClientePortalRole(role) ||
    role === "representative" ||
    role === "consultor_representante"
  );
}

/** Aprovar ofício (gerar numeração): admin, supervisor ou gestor. */
export function canApproveOficio(role: UserRole | undefined | null): boolean {
  return hasAnyRoleOrAdmin(role, ["admin", "supervisor", "gestor"]);
}

/** Conciliar contador anual (ofícios já emitidos fora da plataforma): só admin. */
export function canConfigureOficioCounter(
  role: UserRole | undefined | null,
): boolean {
  return isAdminRole(role);
}

/** Admin: editar/reverter/excluir qualquer ofício. */
export function canAdministerOficios(role: UserRole | undefined | null): boolean {
  return isAdminRole(role);
}

/** Criar e editar rascunhos (equipe interna, exceto portal). */
export function canWriteOficioDraft(role: UserRole | undefined | null): boolean {
  return !isOficioReadOnlyRole(role);
}

/** Responsáveis técnicos: escrita admin, supervisor ou gestor. */
export function canWriteTechnicalResponsibles(
  role: UserRole | undefined | null,
): boolean {
  return hasAnyRoleOrAdmin(role, ["admin", "supervisor", "gestor"]);
}
