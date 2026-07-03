import type { Prada } from '@/lib/types';

function fmt(str: string | undefined | null): string {
  return str != null && String(str).trim() !== '' ? String(str).trim() : '—';
}

function formatAreas(prada: Prada): string {
  const areas = prada.areasRecuperacao;
  if (!areas?.length) return 'Nenhuma área de recuperação cadastrada.';
  return areas
    .map(
      (a, i) =>
        `${i + 1}. ${fmt(a.identificacao)} — ${a.extensao ?? '—'} ha: ${fmt(a.descricao)}`,
    )
    .join('\n');
}

function formatDateValue(v: string | Date | undefined): string {
  if (!v) return '—';
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString('pt-BR');
}

function formatCronograma(prada: Prada): string {
  const etapas = prada.cronograma;
  if (!etapas?.length) return 'Cronograma não informado.';
  return etapas
    .map(
      (e, i) =>
        `${i + 1}. ${fmt(e.etapa)} — ${formatDateValue(e.dataInicio)} a ${formatDateValue(e.dataFim)}`,
    )
    .join('\n');
}

/** Placeholders específicos do formulário PRADA (complementam AmbientalContext). */
export function buildPradaPlaceholderExtras(prada: Prada): Record<string, string> {
  const rt = prada.responsavelTecnico;
  const objetivos = prada.objetivosPrada?.length
    ? prada.objetivosPrada.join('; ')
    : '—';

  return {
    REQUERENTE_NOME: fmt(prada.requerente?.nome),
    REQUERENTE_CPF_CNPJ: fmt(prada.requerente?.cpfCnpj),
    PROPRIETARIO_NOME: fmt(prada.proprietario?.nome),
    PROPRIETARIO_CPF_CNPJ: fmt(prada.proprietario?.cpfCnpj),
    EMPREENDIMENTO_DENOMINACAO: fmt(prada.empreendimento?.denominacao),
    EMPREENDIMENTO_CAR: fmt(prada.empreendimento?.car),
    EMPREENDIMENTO_MATRICULA: fmt(prada.empreendimento?.matricula),
    RT_NOME: fmt(rt?.nome),
    RT_CPF: fmt(rt?.cpf),
    RT_EMAIL: fmt(rt?.email),
    RT_TELEFONE: fmt(rt?.telefone),
    RT_FORMACAO: fmt(rt?.formacao),
    RT_REGISTRO_CONSELHO: fmt(rt?.registroConselho),
    RT_ART: fmt(rt?.art),
    RT_CTF_AIDA: fmt(rt?.ctfAida),
    OBJETIVOS_PRADA: objetivos,
    OBJETIVO_PRADA_DESCRICAO: fmt(prada.objetivoDescricao),
    OPCAO_PRADA: fmt(prada.opcaoPrada),
    BLOCO_AREAS_RECUPERACAO: formatAreas(prada),
    BLOCO_CRONOGRAMA: formatCronograma(prada),
    REFERENCIAS_BIBLIOGRAFICAS: fmt(prada.referenciasBibliograficas),
    PRADA_STATUS: fmt(prada.status ?? 'Rascunho'),
  };
}
