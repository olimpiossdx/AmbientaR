import type { PiscinaoOffStream } from '@/lib/types';
import { buildPiscinaoExportSections } from '@/lib/piscinao-off-stream/export-sections';

function fmt(str: string | undefined | null): string {
  return str != null && String(str).trim() !== '' ? String(str).trim() : '—';
}

/** Placeholders DOCX (slug piscinao-off-stream). */
export function buildPiscinaoPlaceholderExtras(
  cadastro: PiscinaoOffStream,
): Record<string, string> {
  const sections = buildPiscinaoExportSections(cadastro);
  const byTitle = Object.fromEntries(sections.map((s) => [s.title, s.body]));

  return {
    PISCINAO_STATUS: fmt(cadastro.status ?? 'Rascunho'),
    REQUERENTE_NOME: fmt(cadastro.requerente?.nome),
    REQUERENTE_CPF_CNPJ: fmt(cadastro.requerente?.cpfCnpj),
    EMPREENDIMENTO_NOME: fmt(cadastro.empreendimento?.nome),
    EMPREENDIMENTO_MUNICIPIO: fmt(cadastro.empreendimento?.municipio),
    EMPREENDIMENTO_UF: fmt(cadastro.empreendimento?.uf),
    RT_NOME: fmt(cadastro.responsavelTecnico?.nome),
    RT_FORMACAO: fmt(cadastro.responsavelTecnico?.formacao),
    RT_REGISTRO_CONSELHO: fmt(cadastro.responsavelTecnico?.registroConselho),
    RT_ART: fmt(cadastro.responsavelTecnico?.art),
    USO_PRETENDIDO: fmt(cadastro.caracteristicas?.usoPretendido),
    CAPACIDADE_UTIL_M3: fmt(cadastro.caracteristicas?.capacidadeUtilM3),
    ESPELHO_DAGUA_M2: fmt(cadastro.caracteristicas?.espelhoDaguaM2),
    VOLUME_UTIL_RIPPL_M3: fmt(cadastro.demandaHidrica?.volumeUtilRipplM3),
    DEMANDA_ANUAL_M3: fmt(cadastro.demandaHidrica?.demandaAnualM3),
    SECAO_IDENTIFICACAO: fmt(byTitle['Identificação']),
    SECAO_CARACTERISTICAS: fmt(byTitle['Características do reservatório']),
    SECAO_DEMANDA: fmt(byTitle['Demanda hídrica']),
    SECAO_RIPPL: fmt(byTitle['Regularização — método de Rippl']),
    DATA_EMISSAO: fmt(cadastro.dataEmissao),
    LOCAL_EMISSAO: fmt(cadastro.localEmissao),
    VINCULO_PROJETO_BARRAGEM_ID: fmt(cadastro.projetoTecnicoBarragemId),
    VINCULO_OUTORGA_ID: fmt(cadastro.outorgaProcessoId),
  };
}
