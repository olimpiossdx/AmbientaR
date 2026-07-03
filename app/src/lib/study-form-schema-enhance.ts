import type { Field, Section, StudyFormSchema } from '@/lib/study-form-schema';
import {
  LISTAGEM_ACTIVITY_BY_CODE,
  LISTAGEM_SHORT_BY_CODE,
  extractListagemCode,
} from '@/lib/listagem-activities';

export type EnhanceSchemaContext = {
  studySlug: string;
  listagemCode?: string | null;
  activity?: string | null;
  subactivity?: string | null;
};

const SECTION_ORDER = [
  'requerente',
  'empreendimento',
  'responsaveltecnico',
  'responsavel_tecnico',
  'identificacao',
  'objetivo',
  'objetivodescricao',
  'caracterizacao',
  'diagnostico',
  'impactos',
  'medidas',
  'programas',
  'monitoramento',
  'referencias',
];

const CORE_SECTIONS: Section[] = [
  {
    id: 'requerente',
    title: 'Empreendedor / requerente',
    description: 'Quem solicita o estudo. Selecione o cadastro para preencher nome e CPF/CNPJ.',
    type: 'object',
    fields: [
      {
        id: 'clientId',
        label: 'Empreendedor cadastrado',
        type: 'select',
        optionsSource: 'clients',
        uiWidth: 'full',
        uiOrder: 0,
        hint: 'Opcional: vincula ao cadastro do sistema.',
      },
      {
        id: 'nome',
        label: 'Nome ou razão social',
        type: 'string',
        required: true,
        uiWidth: 'half',
        uiOrder: 10,
        defaultFromMcp: 'empreendedor.nome',
        placeholder: 'Nome completo ou razão social',
      },
      {
        id: 'cpfCnpj',
        label: 'CPF ou CNPJ',
        type: 'string',
        uiWidth: 'half',
        uiOrder: 20,
        defaultFromMcp: 'empreendedor.cpfCnpj',
        placeholder: 'Somente números ou formatado',
      },
    ],
  },
  {
    id: 'empreendimento',
    title: 'Empreendimento',
    description: 'Imóvel ou atividade licenciada. A listagem do cadastro orienta o termo de referência.',
    type: 'object',
    fields: [
      {
        id: 'projectId',
        label: 'Empreendimento cadastrado',
        type: 'select',
        optionsSource: 'projects',
        uiWidth: 'full',
        uiOrder: 0,
        hint: 'Ao selecionar, campos compatíveis são preenchidos automaticamente.',
      },
      {
        id: 'nome',
        label: 'Nome do empreendimento',
        type: 'string',
        required: true,
        uiWidth: 'half',
        uiOrder: 10,
        defaultFromMcp: 'empreendimento.nome',
      },
      {
        id: 'denominacao',
        label: 'Denominação do imóvel',
        type: 'string',
        uiWidth: 'half',
        uiOrder: 15,
        defaultFromMcp: 'empreendimento.denominacao',
      },
      {
        id: 'car',
        label: 'Recibo CAR',
        type: 'string',
        uiWidth: 'half',
        uiOrder: 20,
        defaultFromMcp: 'empreendimento.car',
        placeholder: 'Número do recibo CAR',
      },
      {
        id: 'matricula',
        label: 'Matrícula',
        type: 'string',
        uiWidth: 'half',
        uiOrder: 25,
        defaultFromMcp: 'empreendimento.matricula',
      },
      {
        id: 'municipio',
        label: 'Município',
        type: 'string',
        uiWidth: 'half',
        uiOrder: 30,
        defaultFromMcp: 'empreendimento.municipio',
      },
      {
        id: 'uf',
        label: 'UF',
        type: 'string',
        uiWidth: 'half',
        uiOrder: 35,
        placeholder: 'Ex.: MG',
      },
      {
        id: 'atividade',
        label: 'Atividade / listagem (cadastro)',
        type: 'string',
        uiWidth: 'full',
        uiOrder: 40,
        defaultFromMcp: 'empreendimento.activity',
        hint: 'Preenchido pelo empreendimento selecionado.',
      },
    ],
  },
  {
    id: 'responsavelTecnico',
    title: 'Responsável técnico',
    description: 'Profissional responsável pela elaboração e assinatura (ART, conselho, etc.).',
    type: 'object',
    fields: [
      { id: 'nome', label: 'Nome', type: 'string', uiWidth: 'half', uiOrder: 10, required: true },
      { id: 'cpf', label: 'CPF', type: 'string', uiWidth: 'half', uiOrder: 20 },
      { id: 'email', label: 'E-mail', type: 'string', uiWidth: 'half', uiOrder: 30, placeholder: 'email@exemplo.com' },
      { id: 'telefone', label: 'Telefone', type: 'string', uiWidth: 'half', uiOrder: 40 },
      { id: 'formacao', label: 'Formação', type: 'string', uiWidth: 'half', uiOrder: 50 },
      { id: 'registroConselho', label: 'Registro no conselho', type: 'string', uiWidth: 'half', uiOrder: 60 },
      { id: 'art', label: 'Nº ART', type: 'string', uiWidth: 'half', uiOrder: 70 },
    ],
  },
];

const LISTAGEM_SECTION_HINT: Record<string, string> = {
  A: 'Atividades de extração mineral — confira requisitos de barragem, lavra e áreas de influência.',
  B: 'Indústrias metalúrgicas e correlatas — atenção a emissões, efluentes e armazenamento.',
  C: 'Indústria química — identifique substâncias perigosas e planos de emergência.',
  D: 'Indústria alimentícia — foco em efluentes orgânicos e gestão de resíduos.',
  E: 'Obras de infraestrutura — cronograma, faixa de domínio e supressão vegetal.',
  F: 'Gestão de resíduos e serviços — classificação ABNT e destinação final.',
  G: 'Agrossilvipastoris — APP, RL e uso do solo rural.',
  H: 'Demais atividades — verifique enquadramento e necessidade de EIA/RIMA.',
};

function normalizeSectionKey(id: string): string {
  return id
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function humanizeLabel(raw: string): string {
  let label = raw.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  if (!label) return 'Campo';
  const letters = label.replace(/[^a-zA-ZÀ-ÿ]/g, '');
  if (letters.length >= 4 && letters === letters.toUpperCase()) {
    label = label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
  }
  if (label.length > 120) {
    label = `${label.slice(0, 117)}…`;
  }
  return label;
}

function fieldSearchText(field: Field): string {
  return `${field.id} ${field.label}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function inferFieldEnhancements(field: Field): Field {
  const next: Field = { ...field, label: humanizeLabel(field.label) };
  const text = fieldSearchText(field);

  if (field.type === 'select' || field.optionsSource) {
    return next;
  }

  if (/\b(cpf|cnpj|cpfcnpj|documento)\b/.test(text)) {
    next.uiWidth = next.uiWidth ?? 'half';
    next.placeholder = next.placeholder ?? 'CPF ou CNPJ';
    next.hint = next.hint ?? 'Pode ser preenchido automaticamente pelo empreendedor selecionado.';
    return next;
  }

  if (/\b(e[- ]?mail|email)\b/.test(text)) {
    next.uiWidth = next.uiWidth ?? 'half';
    next.placeholder = next.placeholder ?? 'nome@empresa.com.br';
    return next;
  }

  if (/\b(telefone|fone|celular|whatsapp)\b/.test(text)) {
    next.uiWidth = next.uiWidth ?? 'half';
    next.placeholder = next.placeholder ?? '(00) 00000-0000';
    return next;
  }

  if (/\b(data|dt_|_data|periodo|vigencia|validade)\b/.test(text) && field.type === 'string') {
    next.type = 'date';
    next.uiWidth = next.uiWidth ?? 'half';
    return next;
  }

  if (/\b(area|extensao|hectare|\bha\b|metros quadrados|m2|km2)\b/.test(text) && field.type === 'string') {
    next.type = 'number';
    next.uiWidth = next.uiWidth ?? 'half';
    next.placeholder = next.placeholder ?? '0,00';
    next.hint = next.hint ?? 'Informe o valor numérico (use ponto para decimais).';
    return next;
  }

  if (
    /\b(descricao|diagnostico|justificativa|consideracoes|relatorio|objetivo|metodologia|conclusao|resumo|observacoes|analise|impacto|medida|programa|plano)\b/.test(
      text,
    ) ||
    (field.label.length > 55 && field.type === 'string')
  ) {
    if (field.type === 'string') next.type = 'text';
    next.uiWidth = 'full';
    next.placeholder = next.placeholder ?? 'Descreva de forma objetiva, em parágrafos curtos.';
    return next;
  }

  if (/\b(municipio|uf|cep|bairro|endereco|logradouro|comarca|distrito)\b/.test(text)) {
    next.uiWidth = next.uiWidth ?? 'half';
    return next;
  }

  if (/\b(processo|protocolo|art|registro|numero|nº|codigo)\b/.test(text)) {
    next.uiWidth = next.uiWidth ?? 'half';
    return next;
  }

  if (/\b(nome|titular|razao)\b/.test(text) && field.label.length < 40) {
    next.uiWidth = next.uiWidth ?? 'half';
    return next;
  }

  if (field.type === 'string' && !next.uiWidth) {
    next.uiWidth = field.label.length > 48 ? 'full' : 'half';
  }

  return next;
}

function sortFields(fields: Field[]): Field[] {
  return [...fields].sort((a, b) => {
    const oa = a.uiOrder ?? 500;
    const ob = b.uiOrder ?? 500;
    if (oa !== ob) return oa - ob;
    return a.label.localeCompare(b.label, 'pt-BR');
  });
}

function mergeSectionFields(existing: Section, core: Section): Section {
  const fields = [...(existing.fields ?? [])];
  const ids = new Set(fields.map((f) => f.id));
  for (const cf of core.fields ?? []) {
    if (!ids.has(cf.id)) {
      fields.push(cf);
      ids.add(cf.id);
    }
  }
  return {
    ...existing,
    type: existing.type ?? core.type,
    description: existing.description ?? core.description,
    fields: sortFields(fields.map(inferFieldEnhancements)),
  };
}

function ensureCoreSections(sections: Section[]): Section[] {
  const byKey = new Map<string, Section>();
  for (const s of sections) {
    byKey.set(normalizeSectionKey(s.id), s);
  }

  const merged: Section[] = [];

  for (const core of CORE_SECTIONS) {
    const key = normalizeSectionKey(core.id);
    const existing = byKey.get(key);
    if (existing) {
      merged.push(mergeSectionFields(existing, core));
      byKey.delete(key);
    } else {
      merged.push({
        ...core,
        fields: sortFields((core.fields ?? []).map(inferFieldEnhancements)),
      });
    }
  }

  for (const s of sections) {
    const key = normalizeSectionKey(s.id);
    if (!CORE_SECTIONS.some((c) => normalizeSectionKey(c.id) === key)) {
      merged.push({
        ...s,
        title: humanizeLabel(s.title),
        fields: sortFields((s.fields ?? []).map(inferFieldEnhancements)),
      });
    }
  }

  return merged;
}

function sectionSortIndex(section: Section): number {
  const key = normalizeSectionKey(section.id);
  const idx = SECTION_ORDER.findIndex((p) => key.includes(p) || p.includes(key));
  return idx >= 0 ? idx : 100 + mergedSectionTitleRank(section.title);
}

function mergedSectionTitleRank(title: string): number {
  const t = title.toLowerCase();
  if (t.includes('introdu')) return 110;
  if (t.includes('objetivo')) return 120;
  if (t.includes('caracteriz')) return 130;
  if (t.includes('diagn')) return 140;
  if (t.includes('impacto')) return 150;
  if (t.includes('medida') || t.includes('mitig')) return 160;
  if (t.includes('monitor')) return 170;
  if (t.includes('refer')) return 200;
  return 180;
}

function sortSections(sections: Section[]): Section[] {
  return [...sections].sort((a, b) => {
    const da = sectionSortIndex(a);
    const db = sectionSortIndex(b);
    if (da !== db) return da - db;
    return a.title.localeCompare(b.title, 'pt-BR');
  });
}

/**
 * Enriquece schema gerado do DOCX: seções de identificação, tipos de campo, dicas e ordem A–H.
 * Não remove campos existentes — apenas melhora apresentação e usabilidade.
 */
export function enhanceStudyFormSchema(
  schema: StudyFormSchema,
  context: EnhanceSchemaContext,
): StudyFormSchema {
  const listagemCode =
    context.listagemCode?.toUpperCase() ||
    extractListagemCode(context.activity) ||
    null;
  const listagemLabel = listagemCode
    ? LISTAGEM_ACTIVITY_BY_CODE[listagemCode] ?? null
    : null;

  let sections = ensureCoreSections(schema.sections.map((s) => ({ ...s })));
  sections = sortSections(sections);

  if (listagemCode && sections.length > 0) {
    const hint = LISTAGEM_SECTION_HINT[listagemCode];
    const firstDocSection = sections.find(
      (s) => !CORE_SECTIONS.some((c) => normalizeSectionKey(c.id) === normalizeSectionKey(s.id)),
    );
    if (firstDocSection && hint && !firstDocSection.description) {
      firstDocSection.description = hint;
    }
  }

  return {
    ...schema,
    listagemCode,
    listagemLabel,
    sections,
    processedAt: schema.processedAt ?? new Date().toISOString(),
  };
}
