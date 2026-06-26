import type { PiaInventorySnapshot } from '@/lib/pia/pia-inventory-snapshot';
import type { PiaRecord } from '@/lib/pia/pia-record';

export type PiaExportSection = {
  id: string;
  title: string;
  body: string;
  level: 1 | 2;
};

function txt(v: string | undefined | null, fallback = '—'): string {
  const s = v != null ? String(v).trim() : '';
  return s || fallback;
}

function formatDate(d: Date | string | undefined): string {
  if (!d) return '—';
  try {
    const date = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('pt-BR');
  } catch {
    return '—';
  }
}

export function buildPiaExportSections(
  record: PiaRecord,
  inventory?: PiaInventorySnapshot | null,
): PiaExportSection[] {
  const sections: PiaExportSection[] = [];
  const rt = record.responsavelTecnico;
  const emp = record.empreendimento;
  const prop = record.proprietario;
  const diag = record.diagnostico;
  const obj = record.objetivo;
  const car = record.caracterizacaoIntervencao;

  sections.push({
    id: '1',
    title: '1 Informações Gerais',
    level: 1,
    body: [
      '1.1 Dados do requerente',
      `Nome: ${txt(record.requerente?.nome)}`,
      `CPF/CNPJ: ${txt(record.requerente?.cpfCnpj)}`,
      '',
      '1.2 Dados do proprietário do imóvel',
      `Nome: ${txt(prop?.nome)}`,
      `CPF/CNPJ: ${txt(prop?.cpfCnpj)}`,
      '',
      '1.3 Dados do imóvel rural e empreendimento',
      `Empreendimento: ${txt(emp?.nome)}`,
      `Denominação: ${txt(emp?.denominacao)}`,
      `Recibo CAR: ${txt(emp?.car)}`,
      `Atividades: ${txt(emp?.atividades)}`,
      '',
      '1.4 Responsável técnico pelo PIA',
      `Nome: ${txt(rt?.nome)}`,
      `CPF: ${txt(rt?.cpf)}`,
      `E-mail: ${txt(rt?.email)}`,
      `Telefone: ${txt(rt?.telefone)}`,
      `Formação: ${txt(rt?.formacao)}`,
      `Registro conselho: ${txt(rt?.registroConselho)}`,
      `ART: ${txt(rt?.art)}`,
      `CTF/AIDA: ${txt(rt?.ctfAida)}`,
    ].join('\n'),
  });

  const supressaoLinha = obj?.supressao
    ? '(X) Supressão de cobertura vegetal nativa, para uso alternativo do solo'
    : '( ) Supressão de cobertura vegetal nativa, para uso alternativo do solo';

  sections.push({
    id: '2',
    title: '2 Objetivo da Intervenção Ambiental',
    level: 1,
    body: [
      supressaoLinha,
      obj?.areaHa ? `Área (ha): ${txt(obj.areaHa)}` : '',
      txt(obj?.texto),
      '',
      '2.1 Finalidade da intervenção requerida',
      txt(obj?.finalidade),
    ]
      .filter(Boolean)
      .join('\n'),
  });

  const abio = diag?.meioAbiotico;
  sections.push({
    id: '3',
    title: '3 Diagnóstico Socioambiental',
    level: 1,
    body: [
      '3.1 Delimitação da área diretamente afetada (ADA)',
      '(Mapas e plantas conforme anexos do processo, quando aplicável.)',
      '',
      '3.2 Caracterização do meio biótico',
      txt(diag?.meioBiotico),
      '',
      '3.3 Caracterização do meio abiótico',
      '3.3.1 Clima',
      txt(abio?.clima),
      '3.3.2 Solos',
      txt(abio?.solos),
      '3.3.3 Hidrografia',
      txt(abio?.hidrografia),
      '3.3.4 Topografia',
      txt(abio?.topografia),
      '',
      '3.4 Caracterização socioeconômica',
      txt(diag?.socioeconomico),
    ].join('\n'),
  });

  sections.push({
    id: '4',
    title: '4 Caracterização da Intervenção Ambiental',
    level: 1,
    body: [
      '4.1 Técnica a ser usada na intervenção ambiental',
      txt(car?.tecnica, record.type === 'Corretivo' ? 'Não se aplica (AIA corretiva).' : '—'),
      '',
      '4.2 Destinação do material lenhoso',
      txt(car?.destinacaoMaterialLenhoso),
      '',
      '4.3 Cronograma de execução',
      ...(record.cronograma?.length
        ? record.cronograma.map(
            (c, i) =>
              `${i + 1}. ${txt(c.etapa, 'Etapa')} — início ${formatDate(c.dataInicio)} — fim ${formatDate(c.dataFim)}`,
          )
        : ['Nenhuma etapa cadastrada.']),
    ].join('\n'),
  });

  if (
    record.type === 'Inventário Florestal' ||
    record.type === 'Corretivo' ||
    record.type === 'Simplificado'
  ) {
    const floraParts = [
      '5.2 Inventário Florestal Qualiquantitativo',
      txt(record.floraResumo),
      inventory
        ? [
            '',
            `Fonte: inventário «${inventory.projectName}» (ID ${inventory.inventoryId}).`,
            `Totais: ${inventory.totalSpecies} espécies cadastradas, ${inventory.totalTrees} indivíduos, ${inventory.totalParcels} parcelas.`,
            '',
            inventory.summaryText,
          ].join('\n')
        : record.inventoryId
          ? '\nInventário vinculado sem dados importados — abra o módulo Inventário e importe planilhas antes de exportar.'
          : '\nNenhum inventário florestal vinculado a este PIA.',
    ].filter(Boolean);

    sections.push({
      id: '5',
      title: '5 Estudos de Flora',
      level: 1,
      body: floraParts.join('\n'),
    });
  }

  sections.push({
    id: '6',
    title: '6 Estudos de Fauna',
    level: 1,
    body: 'Preencher conforme exigência do TR (dados secundários/primários). Conteúdo complementar em elaboração no formulário.',
  });

  sections.push({
    id: '8',
    title: '8 Análise dos Impactos Ambientais Gerados',
    level: 1,
    body:
      record.impactos?.length && record.impactos.some((r) => r.impacto?.trim())
        ? record.impactos
            .map(
              (r, i) =>
                `${i + 1}. Impacto: ${txt(r.impacto)}\n   Medidas: ${txt(r.medidas)}`,
            )
            .join('\n\n')
        : 'Matriz de impactos não preenchida no formulário.',
  });

  return sections.filter((s) => s.body.trim().length > 0);
}

export function buildSectionManifest(sections: PiaExportSection[]): string[] {
  return sections.map((s) => s.title);
}
