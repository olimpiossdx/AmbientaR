import type { PiscinaoOffStream } from '@/lib/types';
import { buildRipplExportBody } from '@/lib/barragem/barragem-rippl-export';

export type PiscinaoExportSection = {
  title: string;
  body: string;
  pageBreakBefore?: boolean;
};

function fmt(v: string | undefined | null): string {
  return v != null && String(v).trim() !== '' ? String(v).trim() : '';
}

function block(label: string, text: string | undefined | null): string {
  const t = fmt(text);
  if (!t) return '';
  return `${label}\n${t}`;
}

function buildRipplSectionBody(cadastro: PiscinaoOffStream): string {
  return (
    buildRipplExportBody(
      cadastro.demandaHidrica?.ripplSeries,
      cadastro.demandaHidrica?.regularizacao,
    ) || 'Regularização / Rippl não calculado.'
  );
}

export function buildPiscinaoExportSections(cadastro: PiscinaoOffStream): PiscinaoExportSection[] {
  const sections: PiscinaoExportSection[] = [];
  const car = cadastro.caracteristicas;
  const dem = cadastro.demandaHidrica;

  const identificacao = [
    block('Requerente', cadastro.requerente?.nome),
    block('CPF/CNPJ', cadastro.requerente?.cpfCnpj),
    block('Empreendimento / piscinão', cadastro.empreendimento?.nome),
    block(
      'Localização',
      [cadastro.empreendimento?.municipio, cadastro.empreendimento?.uf].filter(Boolean).join(' - '),
    ),
    block('CAR', cadastro.empreendimento?.car),
    block('Responsável técnico', cadastro.responsavelTecnico?.nome),
    block(
      'Formação / registro',
      `${fmt(cadastro.responsavelTecnico?.formacao)} — ${fmt(cadastro.responsavelTecnico?.registroConselho)}`,
    ),
    block('ART', cadastro.responsavelTecnico?.art),
    cadastro.projetoTecnicoBarragemId
      ? block('Projeto técnico vinculado (ID)', cadastro.projetoTecnicoBarragemId)
      : '',
    cadastro.outorgaProcessoId ? block('Processo de outorga (ID)', cadastro.outorgaProcessoId) : '',
    cadastro.geoAnalysisId ? block('Análise geo (ID)', cadastro.geoAnalysisId) : '',
    '\n(Piscinão off-stream — não barra curso d\'água; sem estudos de remanso/galgamento de barragem.)',
  ]
    .filter(Boolean)
    .join('\n\n');

  if (identificacao) {
    sections.push({ title: 'Identificação', body: identificacao });
  }

  const caracteristicas = [
    block('Uso pretendido', car?.usoPretendido),
    block('Capacidade útil (m³)', car?.capacidadeUtilM3),
    block('Espelho d\'água (m²)', car?.espelhoDaguaM2),
    block('Profundidade média (m)', car?.profundidadeMediaM),
    block('Tempo de residência (dias)', car?.tempoResidenciaDias),
    block('Observações', car?.observacoes),
  ]
    .filter(Boolean)
    .join('\n\n');

  if (caracteristicas) {
    sections.push({ title: 'Características do reservatório', body: caracteristicas });
  }

  const demanda = [
    block('Vazão de captação (L/s)', dem?.vazaoCaptacaoLs),
    block('Demanda anual (m³)', dem?.demandaAnualM3),
    block('Volume útil necessário — Rippl (m³)', dem?.volumeUtilRipplM3),
    block('Observações da demanda', dem?.observacoes),
  ]
    .filter(Boolean)
    .join('\n\n');

  if (demanda) {
    sections.push({ title: 'Demanda hídrica', body: demanda });
  }

  const ripplBody = buildRipplSectionBody(cadastro);
  if (ripplBody) {
    sections.push({ title: 'Regularização — método de Rippl', body: ripplBody, pageBreakBefore: true });
  }

  return sections;
}
