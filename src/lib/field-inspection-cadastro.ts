/**
 * Pré-preenchimento da Seção 1 (Identificação) a partir do Cadastro.
 */

import type {
  Empreendedor,
  Project,
  License,
  WaterPermit,
  InsignificantWaterUse,
  FieldInspectionIdentificacao,
} from '@/lib/types';
import type { FieldInspectionMotivo } from '@/lib/field-inspection-checklist';

function joinAddress(parts: (string | undefined)[]): string {
  return parts.filter((p) => p && String(p).trim()).join(', ');
}

/** Formata coordenadas do empreendimento para exibição no formulário/PDF. */
export function formatProjectCoordinates(project: Project | null | undefined): string {
  const geo = project?.geographicLocation;
  if (!geo) return '';

  if (geo.latLong?.lat?.grau != null && geo.latLong?.long?.grau != null) {
    const lat = [
      geo.latLong.lat.grau,
      geo.latLong.lat.min,
      geo.latLong.lat.seg,
    ]
      .filter((v) => v != null && String(v).trim() !== '')
      .join('° ');
    const lng = [
      geo.latLong.long.grau,
      geo.latLong.long.min,
      geo.latLong.long.seg,
    ]
      .filter((v) => v != null && String(v).trim() !== '')
      .join('° ');
    if (lat && lng) return `Lat: ${lat} | Long: ${lng}`;
  }

  if (geo.utm?.x && geo.utm?.y) {
    return `UTM X: ${geo.utm.x}, Y: ${geo.utm.y}, Fuso: ${geo.utm.fuso ?? '—'}`;
  }

  if (geo.local?.trim()) return geo.local.trim();
  if (geo.additionalLocationInfo?.trim()) return geo.additionalLocationInfo.trim();

  return '';
}

function summarizeProcesses(
  licenses: License[],
  outorgas: WaterPermit[],
  usos: InsignificantWaterUse[],
): string {
  const lines: string[] = [];

  licenses.slice(0, 8).forEach((l) => {
    const parts = [
      l.permitType,
      l.processNumber && `Proc. ${l.processNumber}`,
      l.permitNumber && `Nº ${l.permitNumber}`,
      l.licenseNumber && `Lic. ${l.licenseNumber}`,
      l.status && `(${l.status})`,
    ].filter(Boolean);
    if (parts.length) lines.push(`Licença: ${parts.join(' — ')}`);
  });

  outorgas.slice(0, 6).forEach((o) => {
    const parts = [
      o.description,
      o.processNumber && `Proc. ${o.processNumber}`,
      o.permitNumber && `Portaria ${o.permitNumber}`,
      o.status && `(${o.status})`,
    ].filter(Boolean);
    if (parts.length) lines.push(`Outorga: ${parts.join(' — ')}`);
  });

  usos.slice(0, 4).forEach((u) => {
    const parts = [
      u.usoType,
      u.processNumber && `Proc. ${u.processNumber}`,
      u.permitNumber && `Nº ${u.permitNumber}`,
      u.status && `(${u.status})`,
    ].filter(Boolean);
    if (parts.length) lines.push(`Uso insignificante: ${parts.join(' — ')}`);
  });

  if (lines.length === 0) return '';
  if (lines.length > 12) {
    return `${lines.slice(0, 12).join('\n')}\n(... demais registros no cadastro)`;
  }
  return lines.join('\n');
}

export function buildIdentificacaoFromCadastro(params: {
  empreendedor?: Empreendedor | null;
  project?: Project | null;
  licenses?: License[];
  outorgas?: WaterPermit[];
  usosInsignificantes?: InsignificantWaterUse[];
}): FieldInspectionIdentificacao {
  const { empreendedor, project } = params;
  const projectId = project?.id;
  const empreendedorId = empreendedor?.id ?? project?.empreendedorId;

  const licenses = (params.licenses ?? []).filter(
    (l) =>
      (projectId && l.projectId === projectId) ||
      (empreendedorId && l.empreendedorId === empreendedorId),
  );
  const outorgas = (params.outorgas ?? []).filter(
    (o) =>
      (projectId && o.projectId === projectId) ||
      (empreendedorId && o.empreendedorId === empreendedorId),
  );
  const usos = (params.usosInsignificantes ?? []).filter(
    (u) =>
      (projectId && u.projectId === projectId) ||
      (empreendedorId && u.empreendedorId === empreendedorId),
  );

  const enderecoProject = joinAddress([
    project?.address,
    project?.numero ? `nº ${project.numero}` : undefined,
    project?.district,
    project?.municipio,
    project?.uf,
    project?.cep ? `CEP ${project.cep}` : undefined,
  ]);

  const enderecoEmpreendedor = joinAddress([
    empreendedor?.address,
    empreendedor?.numero ? `nº ${empreendedor.numero}` : undefined,
    empreendedor?.bairro,
    empreendedor?.municipio,
    empreendedor?.uf,
    empreendedor?.cep ? `CEP ${empreendedor.cep}` : undefined,
  ]);

  return {
    razaoSocial: empreendedor?.name || project?.propertyName || '',
    nomeFantasia: project?.fantasyName || '',
    cnpjCpf: empreendedor?.cpfCnpj || project?.cnpj || '',
    atividadePrincipal: project?.activity || '',
    enderecoCompleto: enderecoProject || enderecoEmpreendedor || '',
    coordenadasGeograficas: formatProjectCoordinates(project),
    processoLicenciamentoOutorga: summarizeProcesses(licenses, outorgas, usos),
    motivoFiscalizacao: [],
  };
}

/** Preenche apenas campos vazios no destino (não sobrescreve edição manual). */
export function mergeIdentificacaoPreferExisting(
  current: FieldInspectionIdentificacao,
  fromCadastro: FieldInspectionIdentificacao,
): FieldInspectionIdentificacao {
  const pick = (cur: string | undefined, neu: string | undefined) =>
    cur?.trim() ? cur : neu ?? '';

  const motivo = current.motivoFiscalizacao?.length
    ? current.motivoFiscalizacao
    : fromCadastro.motivoFiscalizacao ?? [];

  return {
    razaoSocial: pick(current.razaoSocial, fromCadastro.razaoSocial),
    nomeFantasia: pick(current.nomeFantasia, fromCadastro.nomeFantasia),
    cnpjCpf: pick(current.cnpjCpf, fromCadastro.cnpjCpf),
    atividadePrincipal: pick(current.atividadePrincipal, fromCadastro.atividadePrincipal),
    enderecoCompleto: pick(current.enderecoCompleto, fromCadastro.enderecoCompleto),
    coordenadasGeograficas: pick(
      current.coordenadasGeograficas,
      fromCadastro.coordenadasGeograficas,
    ),
    processoLicenciamentoOutorga: pick(
      current.processoLicenciamentoOutorga,
      fromCadastro.processoLicenciamentoOutorga,
    ),
    motivoFiscalizacao: motivo as FieldInspectionMotivo[],
  };
}
