import type { EstudoCavidade } from '@/lib/types';
import { CHECKLIST_IS08_LABELS } from '@/lib/cavidades/checklist-is08';

export type CavidadesExportSection = {
  title: string;
  body: string;
  pageBreakBefore?: boolean;
};

function fmt(str: string | undefined | null): string {
  return str != null && String(str).trim() !== '' ? String(str).trim() : '';
}

function block(label: string, text: string | undefined | null): string {
  const t = fmt(text);
  if (!t) return '';
  return `${label}\n${t}`;
}

const NIVEL_LABEL: Record<string, string> = {
  triagem: 'Triagem (IDE / DN 217)',
  laudo_urbano: 'Laudo urbano (dados secundários)',
  laudo_prospecao: 'Laudo + prospecção ADA+250 m',
  avaliacao_impacto: 'Avaliação de impactos',
  relevancia_compensacao: 'Relevância e compensação',
  criterio_locacional: 'Estudo critério locacional',
};

const POTENCIAL_LABEL: Record<string, string> = {
  nao_aplicavel: 'Não verificado',
  baixo: 'Baixo',
  medio: 'Médio',
  alto: 'Alto',
  muito_alto: 'Muito alto',
  misto: 'Misto na ADA',
};

export function buildCavidadesExportSections(estudo: EstudoCavidade): CavidadesExportSection[] {
  const sections: CavidadesExportSection[] = [];

  if (fmt(estudo.apresentacao)) {
    sections.push({ title: 'Apresentação', body: fmt(estudo.apresentacao) });
  }

  const identificacao = [
    block('Requerente', estudo.requerente?.nome),
    block('CPF/CNPJ', estudo.requerente?.cpfCnpj),
    block('Empreendimento', estudo.empreendimento?.nome),
    block(
      'Localização',
      [estudo.empreendimento?.municipio, estudo.empreendimento?.uf].filter(Boolean).join(' - '),
    ),
    block('CAR', estudo.empreendimento?.car),
    block('Nível do estudo', NIVEL_LABEL[estudo.nivelEstudo ?? 'triagem']),
    block('Responsável técnico', estudo.responsavelTecnico?.nome),
    block(
      'Formação / registro',
      `${fmt(estudo.responsavelTecnico?.formacao)} — ${fmt(estudo.responsavelTecnico?.registroConselho)}`,
    ),
    block('ART', estudo.responsavelTecnico?.art),
    block('Processo SLA', estudo.processo?.sla),
    block('SEI', estudo.processo?.sei),
    block('SUPRAM', estudo.processo?.supram),
    block('Modalidade sugerida', estudo.processo?.modalidadeSugerida),
  ]
    .filter(Boolean)
    .join('\n\n');
  if (identificacao) {
    sections.push({ title: 'Identificação', body: identificacao, pageBreakBefore: sections.length > 0 });
  }

  const triagem = estudo.triagem;
  if (triagem) {
    const body = [
      block('Potencial CECAV (IDE)', POTENCIAL_LABEL[triagem.potencialCecav ?? 'nao_aplicavel']),
      block(
        'Critério locacional DN 217 (cavidades)',
        triagem.criterioLocacionalIncide ? 'Incide (peso 1)' : 'Não incide / a confirmar',
      ),
      block('ADA urbanizada', triagem.adaUrbanizada ? 'Sim' : 'Não'),
      block('Pedido não incidência', triagem.pedidoNaoIncidenciaCriterio ? 'Sim' : 'Não'),
      block('Notas IDE', triagem.observacoesIde),
      block('Justificativa não incidência', triagem.justificativaNaoIncidencia),
      block('Memorial critério locacional', estudo.memorialCriterioLocacional),
    ]
      .filter(Boolean)
      .join('\n\n');
    if (body) sections.push({ title: 'Triagem e enquadramento', body });
  }

  const prospecao = estudo.prospecao;
  if (prospecao) {
    const body = [
      block('Caminhamento (km)', prospecao.kmCaminhamento),
      block('ADA (ha)', prospecao.areaAdaHa),
      block(
        'Conclusão prospecção',
        prospecao.conclusaoSemCavidades
          ? 'Nenhuma cavidade identificada (validação SUPRAM pendente/concluída)'
          : 'Cavidades identificadas ou em análise',
      ),
      block('Mapa de potencial local', prospecao.mapaPotencialNotas),
      block('Memorial de prospecção', prospecao.memorialProspecao),
    ]
      .filter(Boolean)
      .join('\n\n');
    if (body) sections.push({ title: 'Prospecção espeleológica', body });
  }

  const impactos = estudo.impactos;
  if (impactos) {
    const body = [
      block('Impacto irreversível', impactos.haImpactoIrreversivel ? 'Sim' : 'Não'),
      block('Mitigação / monitoramento', impactos.medidasMitigadoras),
      block('Área de influência', impactos.areaInfluenciaNotas),
      block('Relevância e compensação', impactos.compensacaoNotas),
    ]
      .filter(Boolean)
      .join('\n\n');
    if (body) sections.push({ title: 'Impactos e compensação', body });
  }

  const cavidades = estudo.cavidadesRegistradas;
  if (cavidades?.length) {
    const lines = cavidades.map((c, i) => {
      const parts = [
        c.codigo,
        c.denominacao,
        c.tipo,
        c.grauRelevancia,
        c.desenvolvimentoLinearM ? `${c.desenvolvimentoLinearM} m` : '',
        c.latitude && c.longitude ? `${c.latitude}, ${c.longitude}` : '',
      ].filter(Boolean);
      return `${i + 1}. ${parts.join(' · ')}`;
    });
    sections.push({ title: 'Cavidades registradas', body: lines.join('\n') });
  }

  const checklist = estudo.checklistIs08;
  if (checklist && Object.keys(checklist).length > 0) {
    const lines = CHECKLIST_IS08_LABELS.map((item) => {
      const ok = checklist[item.key];
      return `${ok ? '[x]' : '[ ]'} ${item.label}`;
    });
    sections.push({
      title: 'Checklist IS SISEMA 08/2017',
      body: lines.join('\n'),
    });
  }

  sections.push({
    title: 'Referências normativas',
    body: [
      'IS SISEMA 08/2017 — procedimentos para cavidades no licenciamento MG.',
      'DN COPAM 217/2017 — critério locacional potencialidade CECAV (peso 1).',
      'IN MMA 02/2017 — grau de relevância; Decreto 47.041/2016 MG — compensação.',
      'Documentação completa: docs/ESTUDO-CAVIDADES-MG.md (repositório AmbientaR).',
    ].join('\n'),
  });

  return sections;
}
