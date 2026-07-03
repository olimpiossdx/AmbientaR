import { detectCpfCnpjKind, formatCpfCnpj } from '@/lib/cpf-cnpj';
import { formatPlatformCompanyAddress } from '@/lib/platform-company';
import type {
  Procuracao,
  ProcuracaoEmpreendimento,
  ProcuracaoOutorgante,
  ProcuracaoProcurador,
} from '@/lib/types';

function orPlaceholder(value: string | undefined | null): string {
  return value?.trim() || '_______________';
}

export function formatEmpreendimentosList(
  empreendimentos: ProcuracaoEmpreendimento[],
): string {
  if (!empreendimentos.length) return '_______________';
  return empreendimentos
    .map((e) => {
      const mun = e.municipio?.trim();
      const uf = e.uf?.trim();
      const local = mun && uf ? ` (${mun}/${uf})` : mun ? ` (${mun})` : '';
      return `${e.nome.trim()}${local}`;
    })
    .join('; ');
}

/** Parágrafo do OUTORGANTE conforme modelo (PF ou PJ). */
export function formatOutorganteParagraph(outorgante: ProcuracaoOutorgante): string {
  const nome = orPlaceholder(outorgante.nome);
  const doc = formatCpfCnpj(outorgante.cpfCnpj) || '_______________';
  const endereco = orPlaceholder(outorgante.address);
  const kind = detectCpfCnpjKind(outorgante.cpfCnpj);

  if (kind === 'cnpj') {
    const respNome = orPlaceholder(outorgante.responsavelLegalNome);
    const respCpf = formatCpfCnpj(outorgante.responsavelLegalCpf) || '_______________';
    const respRg = outorgante.responsavelLegalRg?.trim()
      ? `identidade de número ${outorgante.responsavelLegalRgEmissor?.trim() ? `${outorgante.responsavelLegalRgEmissor.trim()} ` : ''}${outorgante.responsavelLegalRg.trim()}`
      : '';
    const respEnd = outorgante.responsavelLegalEndereco?.trim()
      ? ` residente na ${outorgante.responsavelLegalEndereco.trim()}`
      : '';
    return (
      `${nome}, sociedade empresarial situada na ${endereco}, tendo como responsável legal o senhor ${respNome}, ` +
      `CPF ${respCpf}${respRg ? `, ${respRg}` : ''}${respEnd}.`
    );
  }

  const mun = outorgante.municipio?.trim();
  const uf = outorgante.uf?.trim();
  const cidade =
    mun && uf ? `${mun}/${uf}` : mun || uf || '_______________';
  return (
    `${nome}, CPF ${doc}, residente na ${endereco}, município de ${cidade}.`
  );
}

/** Um procurador (outorgado) com endereço comercial da consultoria. */
export function formatProcuradorLine(
  procurador: ProcuracaoProcurador,
  escritorioComercial: string,
): string {
  const nome = orPlaceholder(procurador.name);
  const nacionalidade = (procurador.nacionalidade?.trim() || 'brasileiro(a)').toLowerCase();
  const estadoCivil = (procurador.estadoCivil?.trim() || '_______________').toLowerCase();
  const profissao = orPlaceholder(procurador.profession);
  const rg = procurador.identidade?.trim()
    ? `RG ${procurador.emissor?.trim() ? `${procurador.emissor.trim()} ` : ''}${procurador.identidade.trim()}`
    : 'RG _______________';
  const cpf = formatCpfCnpj(procurador.cpf) || '_______________';
  const escritorio = escritorioComercial.trim() || '_______________';

  return (
    `${nome}, ${nacionalidade}, ${estadoCivil}, ${profissao}, ${rg}, CPF nº ${cpf}, ` +
    `com escritório comercial na ${escritorio}`
  );
}

export function formatOutorgadosParagraph(
  procuradores: ProcuracaoProcurador[],
  companyAddress: string | undefined,
): string {
  if (!procuradores.length) {
    return 'OUTORGADOS: _______________.';
  }
  const escritorio = companyAddress?.trim() || '_______________';
  const lines = procuradores.map((p) => formatProcuradorLine(p, escritorio));
  return `OUTORGADOS: ${lines.join(', e ')}.`;
}

export function formatProcuracaoPoderesComEmpreendimentos(
  textoPoderes: string,
  empreendimentos: ProcuracaoEmpreendimento[],
): string {
  const base = textoPoderes.trim();
  const lista = formatEmpreendimentosList(empreendimentos);
  if (base.endsWith(':')) return `${base} ${lista}.`;
  return `${base} ${lista}.`;
}

export function formatProcuracaoDateLine(
  local: string | undefined,
  dataIso: string | undefined,
): string {
  const cidade = local?.trim() || '_______________';
  if (!dataIso?.trim()) return `${cidade}, ___ de _____________ de ______.`;

  const d = new Date(`${dataIso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) {
    return `${cidade}, ___ de _____________ de ______.`;
  }
  const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  ];
  return `${cidade}, ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}.`;
}

export function buildProcuracaoBodyText(proc: Procuracao): string {
  const outorgante = formatOutorganteParagraph(proc.outorgante);
  const companyAddr =
    proc.outorgado.companyAddress?.trim() ||
    formatPlatformCompanyAddress({
      address: proc.outorgado.companyAddress,
      municipio: undefined,
      uf: undefined,
      cep: undefined,
      district: undefined,
      numero: undefined,
    });
  const outorgados = formatOutorgadosParagraph(
    proc.outorgado.procuradores,
    companyAddr || proc.outorgado.companyAddress,
  );
  const poderes = formatProcuracaoPoderesComEmpreendimentos(
    proc.textoPoderes,
    proc.empreendimentos,
  );
  const data = formatProcuracaoDateLine(proc.localDocumento, proc.dataDocumento);

  return [
    'ATRAVÉS DO PRESENTE INSTRUMENTO PARTICULAR DE MANDATO,',
    '',
    `OUTORGANTE: ${outorgante}`,
    '',
    'Nomeia e constitui como seus procuradores os senhores,',
    '',
    outorgados,
    '',
    poderes,
    '',
    data,
  ].join('\n');
}

export function formatProcuracaoSignatureBlock(proc: Procuracao): string {
  const nome = proc.outorgante.nome?.trim() || '_______________';
  const doc = formatCpfCnpj(proc.outorgante.cpfCnpj) || '_______________';
  const label = detectCpfCnpjKind(proc.outorgante.cpfCnpj) === 'cnpj' ? 'CNPJ' : 'CPF';
  return `${nome}\n${label}: ${doc}`;
}
