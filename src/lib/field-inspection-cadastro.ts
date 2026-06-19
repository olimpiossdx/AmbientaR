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
import { geographicLocationToBarragemCoordenadas } from '@/lib/barragem/barragem-coordenadas';
import { formatCoordinateBlockForLegacyString } from '@/lib/monitoring-pontos-form';

function joinAddress(parts: (string | undefined)[]): string {
  return parts.filter((p) => p && String(p).trim()).join(', ');
}

/** Formata coordenadas do empreendimento para exibição no formulário/PDF. */
export function formatProjectCoordinates(project: Project | null | undefined): string {
  const geo = project?.geographicLocation;
  if (!geo) return '';

  const formatted = formatCoordinateBlockForLegacyString(
    geographicLocationToBarragemCoordenadas(geo),
  );
  if (formatted) return formatted;

  if (geo.local?.trim()) return geo.local.trim();
  if (geo.additionalLocationInfo?.trim()) return geo.additionalLocationInfo.trim();

  return '';
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
    atosVinculados: [],
    processoLicenciamentoOutorga: '',
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
    atosVinculados: current.atosVinculados?.length
      ? current.atosVinculados
      : fromCadastro.atosVinculados ?? [],
    processoLicenciamentoOutorga: pick(
      current.processoLicenciamentoOutorga,
      fromCadastro.processoLicenciamentoOutorga,
    ),
    motivoFiscalizacao: motivo as FieldInspectionMotivo[],
  };
}
