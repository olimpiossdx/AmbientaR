import type { ProjetoTecnicoBarragem } from '@/lib/types';
import { extractMemoriaisCalculoAutomaticos } from '@/lib/barragem/barragem-memorial-calculo';
import { buildRipplExportBody } from '@/lib/barragem/barragem-rippl-export';

export type BarragemExportSection = {
  title: string;
  body: string;
  /** Nova página antes da seção no PDF/Word exportado. */
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

function formatTabelaNiveis(projeto: ProjetoTecnicoBarragem): string {
  const rows = projeto.capacidadeReservatorio?.tabelaNiveis;
  if (!rows?.length) return '';
  return rows
    .map(
      (r, i) =>
        `${i + 1}. Cota ${fmt(r.cota)} — Área ${fmt(r.areaM2)} m² — Altura ${fmt(r.alturaM)} m — Vol. ${fmt(r.volumeM3)} m³ — Acum. ${fmt(r.volumeAcumuladoM3)} m³`,
    )
    .join('\n');
}

export function buildBarragemExportSections(
  projeto: ProjetoTecnicoBarragem,
): BarragemExportSection[] {
  const cap = projeto.capacidadeReservatorio;
  const hid = projeto.calculosHidrologicos;
  const info = projeto.informacoesBasicas;

  const sections: BarragemExportSection[] = [];
  let hasApresentacao = false;

  if (fmt(projeto.apresentacao)) {
    sections.push({
      title: 'Apresentação',
      body: fmt(projeto.apresentacao),
      pageBreakBefore: false,
    });
    hasApresentacao = true;
  }

  const identificacao = [
    block('Proprietário', projeto.requerente?.nome),
    block('CPF/CNPJ', projeto.requerente?.cpfCnpj),
    block('Empreendimento', projeto.empreendimento?.nome),
    block('Denominação do imóvel', projeto.empreendimento?.denominacao),
    block(
      'Localização',
      [projeto.empreendimento?.municipio, projeto.empreendimento?.uf].filter(Boolean).join(' - '),
    ),
    block('Uso pretendido', projeto.usoPretendido),
    block('Espelho d\'água (m²)', projeto.espelhoDaguaM2),
    block('Capacidade de armazenamento (m³)', projeto.capacidadeArmazenamentoM3),
    block('Responsável técnico', projeto.responsavelTecnico?.nome),
    block('Formação / registro', `${fmt(projeto.responsavelTecnico?.formacao)} — ${fmt(projeto.responsavelTecnico?.registroConselho)}`),
    block('ART', projeto.responsavelTecnico?.art),
  ]
    .filter(Boolean)
    .join('\n\n');
  if (identificacao) {
    sections.push({
      title: 'Identificação',
      body: identificacao,
      pageBreakBefore: hasApresentacao,
    });
  }

  const pushSection = (title: string, body: string) => {
    if (!fmt(body)) return;
    sections.push({ title, body: fmt(body) });
  };

  const infoBasicas = [
    block('Informações topográficas', info?.topograficas),
    block('Latitude', info?.latitude),
    block('Longitude', info?.longitude),
    block('Altitude (m)', info?.altitude),
  ]
    .filter(Boolean)
    .join('\n\n');
  if (infoBasicas) {
    sections.push({ title: '1. Informações básicas', body: infoBasicas });
  }

  pushSection('2. Definição da barragem', projeto.definicaoBarragem ?? '');

  const capacidade = [
    block('Descrição', cap?.descricao),
    block('Cota do espelho d\'água', cap?.cotaEspelhoDagua),
    block('Cota do terreno natural', cap?.cotaTerrenoNatural),
    block('Área do espelho d\'água (m²)', cap?.areaEspelhoM2),
    block('Volume armazenado (m³)', cap?.volumeArmazenadoM3),
    formatTabelaNiveis(projeto) ? `Tabela de níveis:\n${formatTabelaNiveis(projeto)}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
  if (capacidade) {
    sections.push({ title: '3. Capacidade do reservatório', body: capacidade });
  }

  const engineering = [
    { title: '4. Aterro', body: projeto.aterro },
    { title: '5. Taludes do aterro', body: projeto.taludesAterro },
    { title: '6. Fundação', body: projeto.fundacao },
    { title: '7. Dreno de pé', body: projeto.drenoPe },
    { title: '8. Descarga de fundo', body: projeto.descargaFundo },
  ];
  for (const e of engineering) {
    pushSection(e.title, e.body ?? '');
  }

  const est = projeto.estabilidadeTaludes;
  if (fmt(est?.memorial) || fmt(est?.fatorSeguranca)) {
    const metodoLabel =
      est?.metodoCalculo === 'morgenstern_price'
        ? 'Morgenstern-Price (meia-seno)'
        : 'Bishop simplificado';
    const geoBody = [
      `Método: ${metodoLabel}`,
      est?.cenario ? `Cenário: ${est.cenario.replace(/_/g, ' ')}` : '',
      block('FS', est?.fatorSeguranca),
      est?.metodoCalculo === 'morgenstern_price'
        ? block('λ (interfatias)', est?.lambdaMorgenstern)
        : '',
      block('c′ (kPa)', est?.coesaoKpa),
      block('φ′ (°)', est?.anguloAtritoGrau),
      fmt(est?.memorial),
    ]
      .filter(Boolean)
      .join('\n\n');
    sections.push({
      title: `Estabilidade de taludes — ${metodoLabel}`,
      body: geoBody,
      pageBreakBefore: true,
    });
  }

  const cg = projeto.estabilidadeConcretoGravidade;
  if (fmt(cg?.memorial) || fmt(cg?.fsDeslizamento) || fmt(cg?.fsTombamento)) {
    const cgBody = [
      block('Altura d\'água (m)', cg?.alturaAguaM),
      block('FS deslizamento', cg?.fsDeslizamento),
      block('FS tombamento', cg?.fsTombamento),
      block('σ_média (kPa)', cg?.tensaoMediaKpa),
      block('σ_máx (kPa)', cg?.tensaoMaxKpa),
      block('σ_mín (kPa)', cg?.tensaoMinKpa),
      block('c′ base (kPa)', cg?.coesaoKpa),
      block('φ′ base (°)', cg?.anguloAtritoGrau),
      fmt(cg?.memorial),
    ]
      .filter(Boolean)
      .join('\n\n');
    sections.push({
      title: 'Concreto gravidade — deslizamento e tombamento',
      body: cgBody,
      pageBreakBefore: true,
    });
  }

  const hidrologia = [
    block('9.1 Características da bacia hidrográfica', hid?.caracteristicasBacia),
    block('9.2 Tempo de concentração', hid?.tempoConcentracao),
    block('9.3 Intensidade da chuva', hid?.intensidadeChuva),
    block('9.4 Coeficiente de escoamento superficial', hid?.coeficienteEscoamento),
    block('9.5 Cálculo da vazão de cheia', hid?.vazaoCheia),
  ]
    .filter(Boolean)
    .join('\n\n');
  if (hidrologia) {
    sections.push({ title: '9. Cálculos hidrológicos', body: hidrologia });
  }

  const ripplBody = buildRipplExportBody(
    projeto.regularizacaoRippl?.ripplSeries,
    projeto.regularizacaoRippl?.memorial,
  );
  if (ripplBody) {
    const ripplHeader = [
      projeto.regularizacaoRippl?.volumeUtilRipplM3
        ? `Volume útil necessário (Rippl): ${fmt(projeto.regularizacaoRippl.volumeUtilRipplM3)} m³`
        : '',
      projeto.regularizacaoRippl?.demandaAnualM3
        ? `Demanda anual: ${fmt(projeto.regularizacaoRippl.demandaAnualM3)} m³`
        : '',
    ]
      .filter(Boolean)
      .join('\n');
    sections.push({
      title: '9.6 Regularização — método de Rippl',
      body: ripplHeader ? `${ripplHeader}\n\n${ripplBody}` : ripplBody,
    });
  }

  const memorialCalculo = extractMemoriaisCalculoAutomaticos(
    hid?.tempoConcentracao,
    hid?.vazaoCheia,
    projeto.extravasor,
  );
  if (memorialCalculo) {
    sections.push({
      title: 'Memoriais de cálculo (automáticos)',
      body: memorialCalculo,
    });
  }

  pushSection(
    '10. Dimensionamento da capacidade de cheia',
    projeto.dimensionamentoCapacidadeCheia ?? '',
  );
  pushSection('11. Extravasor', projeto.extravasor ?? '');
  pushSection('12. Implantação do projeto', projeto.implantacaoProjeto ?? '');
  pushSection('13. Conservação e manutenção da barragem', projeto.conservacaoManutencao ?? '');
  pushSection('14. Literatura consultada', projeto.literaturaConsultada ?? '');
  pushSection('16. Anexos', projeto.anexosDescricao ?? '');

  const rt = [
    block('Responsável técnico', projeto.responsavelTecnico?.nome),
    block('Formação', projeto.responsavelTecnico?.formacao),
    block('Registro no conselho', projeto.responsavelTecnico?.registroConselho),
    block('ART', projeto.responsavelTecnico?.art),
    block('Local de emissão', projeto.localEmissao),
    block('Data de emissão', projeto.dataEmissao),
  ]
    .filter(Boolean)
    .join('\n\n');
  sections.push({ title: '15. Responsabilidade técnica', body: rt });

  return sections;
}
