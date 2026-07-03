import type { PeaProgram } from '@/lib/pea/types';
import { DISPENSA_PARCIAL_OPTIONS } from '@/lib/pea/pea-constants';
import type { DispensaPeaRecord } from '@/lib/pea/types';

export type ExportSection = { title: string; body: string };

function line(label: string, value?: string | null): string {
  const v = value?.trim();
  return v ? `${label}: ${v}` : '';
}

function joinBlocks(blocks: (string | undefined)[]): string {
  return blocks.filter(Boolean).join('\n');
}

export function buildPeaExportSections(pea: PeaProgram): ExportSection[] {
  const sections: ExportSection[] = [];

  sections.push({
    title: '1. Identificação',
    body: joinBlocks([
      line('Empreendimento', pea.empreendimento.nome),
      line('Denominação', pea.empreendimento.denominacao),
      line('CAR', pea.empreendimento.car),
      line('Município/UF', [pea.empreendimento.municipio, pea.empreendimento.uf].filter(Boolean).join('/')),
      line('Requerente', pea.requerente.nome),
      line('CPF/CNPJ', pea.requerente.cpfCnpj),
      line('Processo administrativo', pea.processoAdministrativo),
      line('Solicitação SLA', pea.solicitacaoLicenciamento),
      line('Fase do processo', pea.faseProcesso),
      line('Tipologia', `${pea.codigoTipologia ?? ''} ${pea.tipologia ?? ''}`.trim()),
      line('Classe/Porte', `${pea.classeEmpreendimento ?? ''} / ${pea.porteEmpreendimento ?? ''}`),
      line('Órgão licenciador', pea.orgaoLicenciador),
      line('Status do programa', pea.status),
    ]),
  });

  sections.push({
    title: '2. Área de Abrangência da Educação Ambiental (ABEA)',
    body: joinBlocks([
      pea.geoVinculo
        ? line(
            'Análise geoespacial vinculada',
            `${pea.geoVinculo.analysisId} (${pea.geoVinculo.areaHa?.toFixed(2) ?? '?'} ha, ${pea.geoVinculo.camadasOk ?? ''})`,
          )
        : pea.geoAnalysisId
          ? line('ID análise geoespacial', pea.geoAnalysisId)
          : '',
      pea.abeaDescricao,
      line('Notas ADA/geometria', pea.adaGeometriaNotas),
      line('Notas ABEA/geometria', pea.abeaGeometriaNotas),
    ]),
  });

  if (pea.trOrientacoes?.trim()) {
    sections.push({
      title: '2.1 Orientações TR / órgão licenciador',
      body: pea.trOrientacoes,
    });
  }

  (pea.camposExtras ?? []).forEach((c, i) => {
    if (!c.titulo?.trim() && !c.conteudo?.trim()) return;
    sections.push({
      title: `Seção adicional ${i + 1}: ${c.titulo}`,
      body: c.conteudo ?? '',
    });
  });

  const dsp = pea.dsp;
  sections.push({
    title: '3. Diagnóstico Socioambiental Participativo (DSP)',
    body: joinBlocks([
      line('Mobilização', dsp?.mobilizacao),
      dsp?.notasParticipacao,
      dsp?.devolutivas ? `Devolutivas:\n${dsp.devolutivas}` : '',
      ...(dsp?.tecnicas?.map(
        (t, i) =>
          joinBlocks([
            `\nTécnica ${i + 1}: ${t.nome}`,
            line('Data', t.data),
            line('Participantes', t.participantes),
            line('Resultados', t.resultados),
          ]),
      ) ?? []),
      dsp?.justificativaDispensaDsp
        ? `Justificativa dispensa DSP: ${dsp.justificativaDispensaDsp}`
        : '',
    ]),
  });

  (pea.projetos ?? []).forEach((p, idx) => {
    sections.push({
      title: `4.${idx + 1} Projeto de educação ambiental — ${p.titulo || 'Sem título'}`,
      body: joinBlocks([
        line('Público-alvo', p.publicoAlvo),
        line('Objetivos gerais', p.objetivosGerais),
        line('Objetivos específicos', p.objetivosEspecificos),
        line('Metodologia', p.metodologia),
        line('Cronograma', p.cronograma),
        line('Metas', p.metas),
        line('Indicadores', p.indicadores),
        line('Orçamento (resumo)', p.orcamentoResumo),
      ]),
    });
  });

  sections.push({
    title: '5. Proposta educativa e articulação',
    body: joinBlocks([
      pea.propostaEducacional,
      pea.articulacaoPoliticasPublicas
        ? `Articulação com políticas públicas:\n${pea.articulacaoPoliticasPublicas}`
        : '',
      pea.peaConjuntoNotas ? `PEA conjunto (art. 11):\n${pea.peaConjuntoNotas}` : '',
      line('Cronograma geral (5 anos)', pea.cronogramaGeral),
    ]),
  });

  const rt = pea.responsavelTecnico;
  if (rt?.nome) {
    sections.push({
      title: '6. Responsável técnico',
      body: joinBlocks([
        line('Nome', rt.nome),
        line('Documento', rt.documento),
        line('Formação', rt.formacao),
        line('Registro conselho', rt.registroConselho),
        line('ART', rt.art),
        line('E-mail', rt.email),
        line('Telefone', rt.telefone),
      ]),
    });
  }

  (pea.monitoramentos ?? []).forEach((m) => {
    const tipoLabel = m.tipo === 'formulario' ? 'Formulário de Acompanhamento' : 'Relatório de Acompanhamento';
    sections.push({
      title: `7. ${tipoLabel} — ${m.ano} (semestre ${m.semestre})`,
      body: joinBlocks([
        line('Status', m.status),
        m.introducao,
        m.objetivos ? `Objetivos:\n${m.objetivos}` : '',
        m.atividades ? `Atividades:\n${m.atividades}` : '',
        m.metas ? `Metas:\n${m.metas}` : '',
        m.indicadores ? `Indicadores:\n${m.indicadores}` : '',
        m.avaliacao ? `Avaliação:\n${m.avaliacao}` : '',
        m.consideracoes ? `Considerações finais:\n${m.consideracoes}` : '',
        m.anexosNotas,
      ]),
    });
  });

  return sections;
}

export function buildDispensaExportSections(d: DispensaPeaRecord): ExportSection[] {
  const parcialLabels =
    d.dispensaParcialCampos
      ?.map((id) => DISPENSA_PARCIAL_OPTIONS.find((o) => o.id === id)?.label ?? id)
      .join('; ') ?? '';

  return [
    {
      title: 'Formulário de Solicitação de Dispensa do PEA',
      body: joinBlocks([
        line('Status', d.status),
        line('Razão social empreendedor', d.razaoSocial),
        line('CNPJ', d.cnpj),
        line('Empreendimento', d.nomeFantasia),
        line('Endereço', [d.logradouro, d.numero, d.bairro, d.municipio, d.uf, d.cep].filter(Boolean).join(', ')),
        line('Processo', d.processoAdministrativo),
        line('SLA', d.solicitacaoLicenciamento),
        line('Fase', d.faseProcesso),
        line('Classe/Porte', `${d.classeEmpreendimento ?? ''}/${d.porteEmpreendimento ?? ''}`),
        line('Tipologia', `${d.codigoTipologia ?? ''} ${d.tipologia ?? ''}`),
        d.solicitacaoParcial != null
          ? `Dispensa: ${d.solicitacaoParcial ? 'Parcial' : 'Total'}`
          : '',
        parcialLabels ? `Objeto parcial: ${parcialLabels}` : '',
        d.caracterizacaoSocioeconomica
          ? `Caracterização socioeconômica:\n${d.caracterizacaoSocioeconomica}`
          : '',
        d.justificativa ? `Justificativa:\n${d.justificativa}` : '',
        d.responsavel
          ? joinBlocks([
              '\nResponsável pelo preenchimento:',
              line('Nome', d.responsavel.nome),
              line('Documento', d.responsavel.documento),
              line('Formação', d.responsavel.formacao),
              line('Cargo', d.responsavel.cargo),
              line('Local e data', d.responsavel.localData),
            ])
          : '',
      ]),
    },
  ];
}

export function buildPeaExportBaseName(pea: PeaProgram): string {
  const slug = (pea.empreendimento.nome || 'pea')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .slice(0, 40);
  return `PEA_${slug}_${pea.id?.slice(0, 8) ?? 'novo'}`;
}

export function buildDispensaExportBaseName(d: DispensaPeaRecord): string {
  const slug = (d.razaoSocial || d.nomeFantasia || 'dispensa')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .slice(0, 40);
  return `Dispensa_PEA_${slug}_${d.id?.slice(0, 8) ?? 'novo'}`;
}
