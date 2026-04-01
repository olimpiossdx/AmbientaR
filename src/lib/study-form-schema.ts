/**
 * Schema de formulário dinâmico por estudo (formulário gerado a partir do documento base DOCX/DOTX).
 * Ver docs/FORMULARIO-DINAMICO-DOC-BASE.md.
 */

export type FieldType =
  | 'string'
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'select'
  | 'array'
  | 'object';

export interface FieldOption {
  value: string;
  label: string;
}

export type OptionsSource = 'clients' | 'projects';

export interface Field {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  defaultFromMcp?: string;
  options?: FieldOption[];
  optionsSource?: OptionsSource;
  /** Para type array: campos de cada item */
  itemFields?: Field[];
  /** Para type object: campos aninhados */
  fields?: Field[];
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  type?: 'object' | 'array';
  fields?: Field[];
  itemFields?: Field[];
}

export interface StudyFormSchema {
  version: string;
  studySlug: string;
  sourceFile?: string;
  processedAt?: string;
  sections: Section[];
}

/** Estrutura bruta extraída do DOCX (Fase 2). */
export interface DocxStructure {
  placeholders: string[];
  headings: { level: number; text: string }[];
  rawParagraphs?: string[];
}

/** Schema estático por estudo (espelho do form atual) para fallback e primeiro momento. */
const PRADA_STATIC_SCHEMA: StudyFormSchema = {
  version: '1.0',
  studySlug: 'prada',
  sourceFile: 'PRADA.dotx',
  sections: [
    {
      id: 'requerente',
      title: 'Requerente',
      type: 'object',
      fields: [
        { id: 'clientId', label: 'Cliente', type: 'select', optionsSource: 'clients', required: false },
        { id: 'nome', label: 'Nome', type: 'string', required: true, defaultFromMcp: 'empreendedor.nome' },
        { id: 'cpfCnpj', label: 'CPF/CNPJ', type: 'string', required: true, defaultFromMcp: 'empreendedor.cpfCnpj' },
      ],
    },
    {
      id: 'empreendimento',
      title: 'Empreendimento',
      type: 'object',
      fields: [
        { id: 'projectId', label: 'Empreendimento', type: 'select', optionsSource: 'projects', required: false },
        { id: 'nome', label: 'Nome', type: 'string', required: true, defaultFromMcp: 'empreendimento.nome' },
        { id: 'denominacao', label: 'Denominação do imóvel', type: 'string', required: true },
        { id: 'car', label: 'N.º Recibo do CAR', type: 'string', required: true, defaultFromMcp: 'empreendimento.car' },
        { id: 'matricula', label: 'Matrícula', type: 'string', required: true, defaultFromMcp: 'empreendimento.matricula' },
      ],
    },
    {
      id: 'responsavelTecnico',
      title: 'Responsável técnico',
      type: 'object',
      fields: [
        { id: 'nome', label: 'Nome', type: 'string', required: true },
        { id: 'cpf', label: 'CPF', type: 'string', required: true },
        { id: 'email', label: 'E-mail', type: 'string', required: false },
        { id: 'telefone', label: 'Telefone', type: 'string', required: false },
        { id: 'formacao', label: 'Formação', type: 'string', required: true },
        { id: 'registroConselho', label: 'Registro no conselho', type: 'string', required: true },
        { id: 'art', label: 'ART', type: 'string', required: true },
        { id: 'ctfAida', label: 'CTF/AIDA', type: 'string', required: false },
      ],
    },
    {
      id: 'objetivoDescricao',
      title: 'Objetivo',
      fields: [
        { id: 'objetivoDescricao', label: 'Descrição do objetivo', type: 'text', required: true },
      ],
    },
    {
      id: 'areasRecuperacao',
      title: 'Áreas de recuperação',
      type: 'array',
      itemFields: [
        { id: 'identificacao', label: 'Identificação', type: 'string', required: true },
        { id: 'descricao', label: 'Descrição', type: 'text', required: true },
        { id: 'extensao', label: 'Extensão (ha)', type: 'number', required: true },
        { id: 'justificativa', label: 'Justificativa', type: 'text', required: true },
      ],
    },
    {
      id: 'referenciasBibliograficas',
      title: 'Referências bibliográficas',
      fields: [
        { id: 'referenciasBibliograficas', label: 'Referências', type: 'text', required: false },
      ],
    },
  ],
};

const PTRF_STATIC_SCHEMA: StudyFormSchema = {
  version: '1.0',
  studySlug: 'ptrf',
  sourceFile: 'PTRF.dotx',
  sections: [
    {
      id: 'requerente',
      title: 'Requerente',
      type: 'object',
      fields: [
        { id: 'clientId', label: 'Cliente', type: 'select', optionsSource: 'clients', required: false },
        { id: 'nome', label: 'Nome', type: 'string', required: true, defaultFromMcp: 'empreendedor.nome' },
        { id: 'cpfCnpj', label: 'CPF/CNPJ', type: 'string', required: true, defaultFromMcp: 'empreendedor.cpfCnpj' },
      ],
    },
    {
      id: 'empreendimento',
      title: 'Empreendimento',
      type: 'object',
      fields: [
        { id: 'projectId', label: 'Empreendimento', type: 'select', optionsSource: 'projects', required: false },
        { id: 'nome', label: 'Nome', type: 'string', required: true, defaultFromMcp: 'empreendimento.nome' },
        { id: 'car', label: 'N.º Recibo do CAR', type: 'string', required: true, defaultFromMcp: 'empreendimento.car' },
      ],
    },
    {
      id: 'responsavelTecnico',
      title: 'Responsável técnico',
      type: 'object',
      fields: [
        { id: 'nome', label: 'Nome', type: 'string', required: true },
        { id: 'cpf', label: 'CPF', type: 'string', required: true },
        { id: 'formacao', label: 'Formação', type: 'string', required: true },
        { id: 'registroConselho', label: 'Registro no conselho', type: 'string', required: true },
      ],
    },
    {
      id: 'objetivoDescricao',
      title: 'Objetivo',
      fields: [
        { id: 'objetivoDescricao', label: 'Descrição do objetivo', type: 'text', required: true },
      ],
    },
    {
      id: 'referenciasBibliograficas',
      title: 'Referências bibliográficas',
      fields: [
        { id: 'referenciasBibliograficas', label: 'Referências', type: 'text', required: false },
      ],
    },
  ],
};

const STATIC_SCHEMAS: Record<string, StudyFormSchema> = {
  prada: PRADA_STATIC_SCHEMA,
  ptrf: PTRF_STATIC_SCHEMA,
};

/**
 * Retorna o schema estático do estudo, se existir.
 */
export function getStaticFormSchema(studySlug: string): StudyFormSchema | null {
  const normalized = studySlug?.toLowerCase().trim() || '';
  return STATIC_SCHEMAS[normalized] ?? null;
}

/**
 * Retorna true se o estudo possui schema estático (e portanto suporta form-schema).
 */
export function hasStaticFormSchema(studySlug: string): boolean {
  return getStaticFormSchema(studySlug) != null;
}
