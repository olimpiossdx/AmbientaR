import type { ProjetoTecnicoBarragem } from '@/lib/types';

export type BarragemExportSection = { title: string; body: string };

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

  if (fmt(projeto.apresentacao)) {
    sections.push({ title: 'Apresentação', body: fmt(projeto.apresentacao) });
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
    sections.push({ title: 'Identificação', body: identificacao });
  }

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

  if (fmt(projeto.definicaoBarragem)) {
    sections.push({ title: '2. Definição da barragem', body: fmt(projeto.definicaoBarragem) });
  }

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
    if (fmt(e.body)) sections.push({ title: e.title, body: fmt(e.body) });
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

  if (fmt(projeto.dimensionamentoCapacidadeCheia)) {
    sections.push({
      title: '10. Dimensionamento da capacidade de cheia',
      body: fmt(projeto.dimensionamentoCapacidadeCheia),
    });
  }
  if (fmt(projeto.extravasor)) {
    sections.push({ title: '11. Extravasor', body: fmt(projeto.extravasor) });
  }
  if (fmt(projeto.implantacaoProjeto)) {
    sections.push({
      title: '12. Implantação do projeto',
      body: fmt(projeto.implantacaoProjeto),
    });
  }
  if (fmt(projeto.conservacaoManutencao)) {
    sections.push({
      title: '13. Conservação e manutenção da barragem',
      body: fmt(projeto.conservacaoManutencao),
    });
  }
  if (fmt(projeto.literaturaConsultada)) {
    sections.push({
      title: '14. Literatura consultada',
      body: fmt(projeto.literaturaConsultada),
    });
  }
  if (fmt(projeto.anexosDescricao)) {
    sections.push({ title: '16. Anexos', body: fmt(projeto.anexosDescricao) });
  }

  const rt = [
    `Responsável técnico: ${fmt(projeto.responsavelTecnico?.nome)}`,
    fmt(projeto.responsavelTecnico?.registroConselho),
    fmt(projeto.localEmissao) ? `Local: ${fmt(projeto.localEmissao)}` : '',
    fmt(projeto.dataEmissao) ? `Data: ${fmt(projeto.dataEmissao)}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  sections.push({ title: '15. Responsabilidade técnica', body: rt });

  return sections;
}
