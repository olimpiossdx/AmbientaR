import type { EstudoSegurancaBarragem } from '@/lib/types';
import {
  PSB_CHECKLIST_ITENS,
  INSPECAO_CHECKLIST_ITENS,
  DAM_BREAK_CENARIOS,
  NIVEL_ANOMALIA_OPCOES,
  NIVEL_PAE_OPCOES,
  DPA_OPCOES,
} from '@/lib/seguranca-barragens/config';

export type SegurancaExportSection = {
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

function labelFor<T extends { value: string; label: string }>(
  options: readonly T[],
  value: string | undefined,
): string {
  if (!value) return '—';
  return options.find((o) => o.value === value)?.label ?? value;
}

function formatChecklist(
  itens: Record<string, boolean> | undefined,
  catalog: readonly { id: string; label: string }[],
): string {
  if (!catalog.length) return '';
  return catalog
    .map((item) => {
      const ok = itens?.[item.id] === true;
      return `${ok ? '[x]' : '[ ]'} ${item.label}`;
    })
    .join('\n');
}

export function buildSegurancaExportSections(
  estudo: EstudoSegurancaBarragem,
): SegurancaExportSection[] {
  const sections: SegurancaExportSection[] = [];
  const cls = estudo.classificacao;

  const identificacao = [
    block('Requerente', estudo.requerente?.nome),
    block('CPF/CNPJ', estudo.requerente?.cpfCnpj),
    block('Empreendimento / barragem', estudo.empreendimento?.nome),
    block(
      'Localização',
      [estudo.empreendimento?.municipio, estudo.empreendimento?.uf].filter(Boolean).join(' - '),
    ),
    block('Responsável técnico', estudo.responsavelTecnico?.nome),
    block(
      'Formação / registro',
      `${fmt(estudo.responsavelTecnico?.formacao)} — ${fmt(estudo.responsavelTecnico?.registroConselho)}`,
    ),
    block('ART', estudo.responsavelTecnico?.art),
    estudo.projetoTecnicoBarragemId
      ? block('Projeto técnico vinculado (ID)', estudo.projetoTecnicoBarragemId)
      : '',
    estudo.outorgaProcessoId ? block('Processo de outorga (ID)', estudo.outorgaProcessoId) : '',
    estudo.rcaId ? block('RCA vinculado (ID)', estudo.rcaId) : '',
    estudo.pcaId ? block('PCA vinculado (ID)', estudo.pcaId) : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  if (identificacao) {
    sections.push({ title: 'Identificação', body: identificacao });
  }

  const classificacao = [
    block('Categoria de risco (CRI)', cls?.categoriaRisco),
    block(
      'Dano potencial associado (DPA)',
      labelFor(DPA_OPCOES, cls?.danoPotencialAssociado),
    ),
    block('Volume do reservatório (m³)', cls?.volumeReservatorioM3),
    block('Altura da barragem (m)', cls?.alturaBarragemM),
    block('Observações', cls?.observacoes),
    '\n(Classificação preliminar — sujeita a revisão do RT e normas ANA/CNRH.)',
  ]
    .filter(Boolean)
    .join('\n\n');

  if (classificacao) {
    sections.push({ title: 'Classificação preliminar', body: classificacao });
  }

  const psbBody = [
    formatChecklist(estudo.psb?.itens, PSB_CHECKLIST_ITENS),
    block('Observações PSB', estudo.psb?.observacoes),
  ]
    .filter(Boolean)
    .join('\n\n');

  if (psbBody) {
    sections.push({ title: 'Plano de Segurança da Barragem (PSB)', body: psbBody });
  }

  const inspecaoBody = [
    block(
      'Nível de anomalia',
      labelFor(NIVEL_ANOMALIA_OPCOES, estudo.inspecao?.nivelAnomalia),
    ),
    formatChecklist(estudo.inspecao?.itens, INSPECAO_CHECKLIST_ITENS),
    block('Observações da inspeção', estudo.inspecao?.observacoes),
  ]
    .filter(Boolean)
    .join('\n\n');

  if (inspecaoBody) {
    sections.push({ title: 'Inspeção de segurança regular', body: inspecaoBody });
  }

  const paeBody = [
    block('Nível de resposta', labelFor(NIVEL_PAE_OPCOES, estudo.pae?.nivelAtual)),
    block('Contatos', estudo.pae?.contatos),
    block('Rotas de fuga e pontos de encontro', estudo.pae?.rotasFuga),
    block('Observações PAE', estudo.pae?.observacoes),
  ]
    .filter(Boolean)
    .join('\n\n');

  if (paeBody) {
    sections.push({ title: 'Plano de Ação de Emergência (PAE)', body: paeBody });
  }

  const db = estudo.damBreak;
  const damBody = [
    block('Cenário', labelFor(DAM_BREAK_CENARIOS, db?.cenario)),
    block('Largura da brecha (m)', db?.larguraBrechaM),
    block('Tempo de formação (h)', db?.tempoFormacaoH),
    block('Volume mobilizado (m³)', db?.volumeMobilizadoM3),
    block('Vazão de pico Qp (m³/s)', db?.vazaoPicoM3s),
    block('Observações', db?.observacoes),
    '\n(Triagem preliminar — estudo formal exige modelo hidrodinâmico, ex. HEC-RAS.)',
  ]
    .filter(Boolean)
    .join('\n\n');

  if (damBody) {
    sections.push({ title: 'Dam Break — triagem', body: damBody });
  }

  const hr = estudo.hecRasResultados;
  if (hr?.importedAt || hr?.memorial) {
    const r = hr.resumo ?? {};
    const hrBody = [
      hr.sourceFile ? `Arquivo: ${hr.sourceFile}` : '',
      hr.importedAt ? `Importado: ${hr.importedAt}` : '',
      block('Área inundada (m²)', r.areaInundadaM2),
      block('Profundidade máxima (m)', r.profundidadeMaxM),
      block('Velocidade máxima (m/s)', r.velocidadeMaxMs),
      block('Tempo chegada mín. (min)', r.tempoChegadaMinMin),
      block('Cenário modelado', r.cenarioModelado),
      block('Software', r.software),
      fmt(hr.memorial),
      block('Observações RT', hr.observacoes),
    ]
      .filter(Boolean)
      .join('\n\n');
    sections.push({ title: 'Resultados HEC-RAS (importados)', body: hrBody });
  }

  if (estudo.geoAnalysisId) {
    sections.push({
      title: 'Referência geoespacial',
      body: `Análise vinculada: geo_analyses/${estudo.geoAnalysisId}`,
    });
  }

  return sections;
}
