import type { UserRole } from "@/lib/types";

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
): boolean {
  if (isAdminRole(role)) return true;
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
 * Escrita em autorizações/relatórios operacionais (licenças, outorgas, condicionantes, etc.).
 * Espelha os papéis das páginas operacionais; admin incluído via hasAnyRoleOrAdmin.
 */
export function canPerformOperationalWrite(
  role: UserRole | undefined | null,
): boolean {
  return hasAnyRoleOrAdmin(role, [
    "gestor",
    "supervisor",
    "cliente_autonomo",
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
  return hasAnyRoleOrAdmin(role, ["gestor", "cliente_autonomo"]);
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

/** Planos de acompanhamento autônomo (lançar e acompanhar próprios dados e prazos). */
export function isClienteAutonomo(role: UserRole | undefined | null): boolean {
  return role === "cliente_autonomo";
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

/** Cliente gestão e representante: menu Processos só para consulta (sem criar/editar). */
export function isProcessosPortalReadOnlyRole(
  role: UserRole | undefined | null,
): boolean {
  if (isAdminRole(role)) return false;
  return role === "client" || role === "representative";
}

/** Quem vê a lista de processos filtrada por empreendedores do portal (gestão + representante). */
export function isProcessosPortalScopeRole(
  role: UserRole | undefined | null,
): boolean {
  return isProcessosPortalReadOnlyRole(role);
}

/** Criar/editar/apagar processos e avançar status: equipa interna. */
export function canWriteProcessosInternal(
  role: UserRole | undefined | null,
): boolean {
  return hasAnyRoleOrAdmin(role, [
    "admin",
    "supervisor",
    "gestor",
    "technical",
    "advogado",
  ]);
}

/** Defesa de auto de infração (Firestore: admin e advogado). */
export function canManageAutoInfracaoDefesa(
  role: UserRole | undefined | null,
): boolean {
  return hasAnyRoleOrAdmin(role, ["advogado"]);
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
  return !isClientePortalRole(role) && role !== "representative";
}

/**
 * Orçamentos (`proposals`) e propostas comerciais (`commercialProposals`):
 * criação e gestão na UI restritas a admin e financeiro (não vendas/autônomo).
 */
export function canManageProposalsAndCommercialQuotes(
  role: UserRole | undefined | null,
): boolean {
  return hasAnyRoleOrAdmin(role, ["admin", "financial"]);
}

/** Lançamentos de caixa, faturas, fornecedores, tabela de serviços: escrita admin/financeiro. */
export function isAdminOrFinancialRole(
  role: UserRole | undefined | null,
): boolean {
  return hasAnyRoleOrAdmin(role, ["admin", "financial"]);
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
    role === "representative"
  );
}

/** Responsáveis técnicos: escrita admin, supervisor ou gestor. */
export function canWriteTechnicalResponsibles(
  role: UserRole | undefined | null,
): boolean {
  return hasAnyRoleOrAdmin(role, ["admin", "supervisor", "gestor"]);
}
