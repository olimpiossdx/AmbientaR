import type { EstudoSegurancaBarragem } from '@/lib/types';
import { buildSegurancaExportSections } from '@/lib/seguranca-barragens/export-sections';
function fmt(str: string | undefined | null): string {
  return str != null && String(str).trim() !== '' ? String(str).trim() : '—';
}

/** Placeholders DOCX (slug seguranca-barragens). */
export function buildSegurancaPlaceholderExtras(
  estudo: EstudoSegurancaBarragem,
): Record<string, string> {
  const sections = buildSegurancaExportSections(estudo);
  const byTitle = Object.fromEntries(sections.map((s) => [s.title, s.body]));

  return {
    SEGURANCA_STATUS: fmt(estudo.status ?? 'Rascunho'),
    REQUERENTE_NOME: fmt(estudo.requerente?.nome),
    REQUERENTE_CPF_CNPJ: fmt(estudo.requerente?.cpfCnpj),
    EMPREENDIMENTO_NOME: fmt(estudo.empreendimento?.nome),
    EMPREENDIMENTO_MUNICIPIO: fmt(estudo.empreendimento?.municipio),
    EMPREENDIMENTO_UF: fmt(estudo.empreendimento?.uf),
    RT_NOME: fmt(estudo.responsavelTecnico?.nome),
    RT_FORMACAO: fmt(estudo.responsavelTecnico?.formacao),
    RT_REGISTRO_CONSELHO: fmt(estudo.responsavelTecnico?.registroConselho),
    RT_ART: fmt(estudo.responsavelTecnico?.art),
    CLASSIFICACAO_CRI: fmt(estudo.classificacao?.categoriaRisco),
    CLASSIFICACAO_DPA: fmt(estudo.classificacao?.danoPotencialAssociado),
    VOLUME_RESERVATORIO_M3: fmt(estudo.classificacao?.volumeReservatorioM3),
    ALTURA_BARRAGEM_M: fmt(estudo.classificacao?.alturaBarragemM),
    SECAO_IDENTIFICACAO: fmt(byTitle['Identificação']),
    SECAO_CLASSIFICACAO: fmt(byTitle['Classificação preliminar']),
    SECAO_PSB: fmt(byTitle['Plano de Segurança da Barragem (PSB)']),
    SECAO_INSPECAO: fmt(byTitle['Inspeção de segurança regular']),
    SECAO_PAE: fmt(byTitle['Plano de Ação de Emergência (PAE)']),
    SECAO_DAM_BREAK: fmt(byTitle['Dam Break — triagem']),
    SECAO_HEC_RAS: fmt(byTitle['Resultados HEC-RAS (importados)']),
    HEC_RAS_AREA_INUNDADA_M2: fmt(estudo.hecRasResultados?.resumo?.areaInundadaM2),
    HEC_RAS_PROFUNDIDADE_MAX_M: fmt(estudo.hecRasResultados?.resumo?.profundidadeMaxM),
    HEC_RAS_VELOCIDADE_MAX_MS: fmt(estudo.hecRasResultados?.resumo?.velocidadeMaxMs),
    HEC_RAS_TEMPO_CHEGADA_MIN: fmt(estudo.hecRasResultados?.resumo?.tempoChegadaMinMin),
    HEC_RAS_MEMORIAL: fmt(estudo.hecRasResultados?.memorial),
    DATA_EMISSAO: fmt(estudo.dataEmissao),
    LOCAL_EMISSAO: fmt(estudo.localEmissao),
    VINCULO_RCA_ID: fmt(estudo.rcaId),
    VINCULO_PCA_ID: fmt(estudo.pcaId),
    VINCULO_OUTORGA_ID: fmt(estudo.outorgaProcessoId),
    VINCULO_PROJETO_BARRAGEM_ID: fmt(estudo.projetoTecnicoBarragemId),
  };
}
