import type { UserRole } from "@/lib/types";

/** Admin e supervisor: mesmas capacidades de supervisão na UI onde aplicável. */
export function isAdminOrSupervisorRole(
  role: UserRole | undefined | null,
): boolean {
  return role === "admin" || role === "supervisor";
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
  return (
    role === "admin" ||
    role === "supervisor" ||
    role === "gestor" ||
    role === "financial"
  );
}

/** Cliente gestão e representante: menu Processos só para consulta (sem criar/editar). */
export function isProcessosPortalReadOnlyRole(
  role: UserRole | undefined | null,
): boolean {
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
  return (
    role === "admin" ||
    role === "supervisor" ||
    role === "gestor" ||
    role === "technical" ||
    role === "advogado"
  );
}

/**
 * Quem pode vincular CAR no projeto (recibo PDF, geometria, nº recibo).
 * Cliente Autônomo: nos próprios empreendimentos. Cliente Gestão e representante: só consulta na UI.
 */
export function canManageCarUploadsOnProject(
  role: UserRole | undefined | null,
): boolean {
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
  return role === "admin" || role === "financial";
}
