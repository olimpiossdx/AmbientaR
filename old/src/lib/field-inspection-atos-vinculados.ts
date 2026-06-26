/**
 * Vínculo de vistoria de campo com licenças, outorgas e usos insignificantes do cadastro.
 */

import type {
  License,
  WaterPermit,
  InsignificantWaterUse,
  FieldInspectionAtoVinculado,
  FieldInspectionAtoVinculadoTipo,
  FieldInspectionIdentificacao,
  PermitStatus,
} from '@/lib/types';

/** Licenças e usos insignificantes listáveis na vistoria. */
export const ATOS_VINCULADOS_LICENSE_STATUSES: PermitStatus[] = ['Válida', 'Em Renovação'];

/** Outorgas: apenas vigentes (válidas). */
export const ATOS_VINCULADOS_OUTORGA_STATUSES: PermitStatus[] = ['Válida'];

export const ATOS_VINCULADOS_USO_STATUSES: PermitStatus[] = ['Válida', 'Em Renovação'];

export function filterAtosByEmpreendimento<T extends { projectId?: string; empreendedorId?: string }>(
  items: T[],
  projectId: string | undefined,
  empreendedorId: string | undefined,
): T[] {
  if (!projectId && !empreendedorId) return [];
  return items.filter(
    (item) =>
      (projectId && item.projectId === projectId) ||
      (empreendedorId && item.empreendedorId === empreendedorId),
  );
}

export function filterLicencasParaVistoria(licenses: License[]): License[] {
  return licenses.filter((l) => ATOS_VINCULADOS_LICENSE_STATUSES.includes(l.status));
}

export function filterOutorgasVigentes(outorgas: WaterPermit[]): WaterPermit[] {
  return outorgas.filter((o) => ATOS_VINCULADOS_OUTORGA_STATUSES.includes(o.status));
}

export function filterUsosParaVistoria(usos: InsignificantWaterUse[]): InsignificantWaterUse[] {
  return usos.filter((u) => ATOS_VINCULADOS_USO_STATUSES.includes(u.status));
}

export function formatLicencaRotulo(l: License): string {
  const parts = [
    l.permitType,
    l.processNumber && `Proc. ${l.processNumber}`,
    l.permitNumber && `Nº ${l.permitNumber}`,
    l.licenseNumber && `Lic. ${l.licenseNumber}`,
    l.status && `(${l.status})`,
  ].filter(Boolean);
  return parts.length ? parts.join(' — ') : 'Licença';
}

export function formatOutorgaRotulo(o: WaterPermit): string {
  const parts = [
    o.description,
    o.processNumber && `Proc. ${o.processNumber}`,
    o.permitNumber && `Portaria ${o.permitNumber}`,
    o.status && `(${o.status})`,
  ].filter(Boolean);
  return parts.length ? parts.join(' — ') : 'Outorga';
}

export function formatUsoInsignificanteRotulo(u: InsignificantWaterUse): string {
  const parts = [
    u.usoType,
    u.processNumber && `Proc. ${u.processNumber}`,
    u.permitNumber && `Nº ${u.permitNumber}`,
    u.status && `(${u.status})`,
  ].filter(Boolean);
  return parts.length ? parts.join(' — ') : 'Uso insignificante';
}

export function atoVinculadoKey(tipo: FieldInspectionAtoVinculadoTipo, id: string): string {
  return `${tipo}:${id}`;
}

export function isAtoVinculado(
  atos: FieldInspectionAtoVinculado[] | undefined,
  tipo: FieldInspectionAtoVinculadoTipo,
  id: string,
): boolean {
  return (atos ?? []).some((a) => a.tipo === tipo && a.id === id);
}

export function buildAtosVinculadosTexto(atos: FieldInspectionAtoVinculado[] | undefined): string {
  if (!atos?.length) return '';
  const prefix: Record<FieldInspectionAtoVinculadoTipo, string> = {
    licenca: 'Licença',
    outorga: 'Outorga',
    uso_insignificante: 'Uso insignificante',
  };
  return atos
    .map((a) => `${prefix[a.tipo]}: ${a.rotulo}`)
    .join('\n');
}

/** Texto para PDF / detalhe: atos vinculados + observações do textarea. */
export function formatProcessoLicenciamentoDisplay(
  identificacao: FieldInspectionIdentificacao | undefined,
): string {
  if (!identificacao) return '';
  const blocos: string[] = [];
  const atosTexto = buildAtosVinculadosTexto(identificacao.atosVinculados);
  if (atosTexto) blocos.push(atosTexto);
  const obs = identificacao.processoLicenciamentoOutorga?.trim();
  if (obs) {
    if (atosTexto) blocos.push(`Observações: ${obs}`);
    else blocos.push(obs);
  }
  if (blocos.length) return blocos.join('\n\n');
  return identificacao.processoLicenciamentoOutorga?.trim() ?? '';
}
