import type { FaunaStudy } from '@/lib/types';

export type FaunaExportSection = {
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

function formatMetodologiaInventariamento(
  value: FaunaStudy['metodologiaInventariamento'],
): string {
  if (!value) return '';
  if (typeof value === 'string') return fmt(value);
  const obj = value as Record<string, string | undefined>;
  return [
    block('Materiais e métodos', obj.materiaisMetodos),
    block('Módulos amostrais', obj.modulosAmostrais),
    block('Esforço amostral', obj.esforcoAmostral),
    block('Cronograma de execução', obj.cronogramaExecucao),
    block('Destino do material biológico', obj.destinoMaterialBiologico),
  ]
    .filter(Boolean)
    .join('\n\n');
}

function formatAreaEstudo(
  value: FaunaStudy['caracterizacaoAreaEstudo'],
): string {
  if (!value) return '';
  if (typeof value === 'string') return fmt(value);
  return [block('Área', value.area), block('Clima', value.clima)]
    .filter(Boolean)
    .join('\n\n');
}

function formatImpactos(value: FaunaStudy['impactosPotenciais']): string {
  if (!value) return '';
  if (typeof value === 'string') return fmt(value);
  return [
    block('Vetores de impacto', value.vetores),
    block('Análise de interação', value.analiseInteracao),
  ]
    .filter(Boolean)
    .join('\n\n');
}

function formatResultados(value: FaunaStudy['resultados']): string {
  if (!value) return '';
  return [
    block('Caracterização ambiental primária', value.caracterizacaoAmbientalPrimaria),
    block('Lista de espécies primária', value.listaEspeciesPrimaria),
    block('Impactos ambientais', value.impactosAmbientais),
  ]
    .filter(Boolean)
    .join('\n\n');
}

function formatProgramaResgate(value: FaunaStudy['programaResgate']): string {
  if (!value) return '';
  return [
    block('Metodologias', value.metodologias),
    block('Base de salvamento', value.baseSalvamento),
  ]
    .filter(Boolean)
    .join('\n\n');
}

function buildIdentificacaoSection(study: FaunaStudy): FaunaExportSection | null {
  const emp = study.empreendedor as
    | {
        name?: string;
        cpfCnpj?: string;
        address?: string;
        numero?: string;
        bairro?: string;
        municipio?: string;
        uf?: string;
        cep?: string;
        phone?: string;
        email?: string;
      }
    | undefined;
  const cons = study.consultoria as
    | {
        name?: string;
        cnpj?: string;
        address?: string;
        municipio?: string;
        uf?: string;
        phone?: string;
        email?: string;
      }
    | undefined;

  const body = [
    block('Empreendedor', emp?.name),
    block('CPF/CNPJ', emp?.cpfCnpj),
    block(
      'Endereço',
      [emp?.address, emp?.numero, emp?.bairro, emp?.municipio, emp?.uf, emp?.cep]
        .filter(Boolean)
        .join(', '),
    ),
    block('Telefone', emp?.phone),
    block('E-mail', emp?.email),
    block('Consultoria', cons?.name),
    block('CNPJ consultoria', cons?.cnpj),
    block(
      'Endereço consultoria',
      [cons?.address, cons?.municipio, cons?.uf].filter(Boolean).join(', '),
    ),
    block('Telefone consultoria', cons?.phone),
    block('Número da autorização de manejo', study.numeroAutorizacao),
    block('Responsáveis técnicos', study.responsaveisTecnicosRelatorio),
  ]
    .filter(Boolean)
    .join('\n\n');

  if (!body) return null;
  return { title: 'Identificação', body, pageBreakBefore: false };
}

function pushSection(
  sections: FaunaExportSection[],
  title: string,
  body: string,
  pageBreakBefore = false,
) {
  if (!fmt(body)) return;
  sections.push({ title, body: fmt(body), pageBreakBefore });
}

export function buildFaunaExportSections(study: FaunaStudy): FaunaExportSection[] {
  const sections: FaunaExportSection[] = [];
  const identificacao = buildIdentificacaoSection(study);
  if (identificacao) sections.push(identificacao);

  pushSection(
    sections,
    'Caracterização do empreendimento',
    study.caracterizacaoEmpreendimento ?? '',
    sections.length > 0,
  );
  pushSection(
    sections,
    'Área de estudo',
    formatAreaEstudo(study.caracterizacaoAreaEstudo),
  );
  pushSection(
    sections,
    'Área diretamente afetada',
    study.areaDiretamenteAfetada ?? '',
  );
  pushSection(
    sections,
    'Caracterização ambiental secundária',
    study.caracterizacaoAmbientalSecundaria ?? '',
  );
  pushSection(
    sections,
    'Lista de espécies secundária',
    study.listaEspeciesSecundaria ?? '',
  );
  pushSection(sections, 'Impactos potenciais', formatImpactos(study.impactosPotenciais));
  pushSection(
    sections,
    'Metodologia de inventariamento',
    formatMetodologiaInventariamento(study.metodologiaInventariamento),
  );
  pushSection(sections, 'Objetivos do monitoramento', study.objetivosMonitoramento ?? '');
  pushSection(sections, 'Perguntas e hipóteses', study.perguntasHipoteses ?? '');
  pushSection(sections, 'Cronograma de execução', study.cronogramaExecucao ?? '');
  pushSection(
    sections,
    'Destino do material biológico',
    study.destinoMaterialBiologico ?? '',
  );
  pushSection(sections, 'Áreas de intervenção', study.areasIntervencao ?? '');
  pushSection(sections, 'Áreas de soltura', study.areasSoltura ?? '');
  pushSection(sections, 'Programa de resgate', formatProgramaResgate(study.programaResgate));
  pushSection(sections, 'Curso de capacitação', study.cursoCapacitacao ?? '');
  pushSection(sections, 'Plano de supressão', study.planoSupressao ?? '');
  pushSection(sections, 'Ações de resgate', study.acoesResgate ?? '');
  pushSection(sections, 'Equipes', study.equipes ?? '');
  pushSection(sections, 'Resultados', formatResultados(study.resultados));
  pushSection(sections, 'Discussão', study.discussao ?? '');
  pushSection(sections, 'Recomendações', study.recomendacoes ?? '');
  pushSection(sections, 'Referências', study.referencias ?? '');

  return sections;
}
