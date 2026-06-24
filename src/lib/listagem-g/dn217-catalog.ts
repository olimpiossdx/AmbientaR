export type ListagemGDn217Entry = {
  codigo: string;
  descricao: string;
  formularioTipo:
    | 'culturas'
    | 'bovinocultura'
    | 'irrigados'
    | 'silvicultura'
    | 'graos'
    | 'suinocultura'
    | 'avicultura'
    | 'geral';
  subActivity: string;
  unidade?: string;
};

/** Subatividades oficiais Listagem G (espelho RCA/PCA). */
export const LISTAGEM_G_SUBACTIVITIES = [
  'Cultura anuais, perenes e olericultura',
  'Criação de Bovinos',
  'Projetos Agropecuarios Irrigados',
  'Silvicultura e Carvoejamento',
  'Processamento, beneficiamento e armazenamento de graos',
  'Suinocultura',
  'Avicultura',
] as const;

const ENTRIES: ListagemGDn217Entry[] = [
  {
    codigo: 'G-01-01-5',
    descricao:
      'Horticultura (floricultura, olericultura, fruticultura anual, viveiricultura e cultura de ervas medicinais e aromáticas)',
    formularioTipo: 'culturas',
    subActivity: LISTAGEM_G_SUBACTIVITIES[0],
    unidade: 'ha',
  },
  {
    codigo: 'G-01-03-1',
    descricao:
      'Culturas anuais, semiperenes e perenes, e cultivos agrossilvipastoris, exceto horticultura',
    formularioTipo: 'culturas',
    subActivity: LISTAGEM_G_SUBACTIVITIES[0],
    unidade: 'ha',
  },
  {
    codigo: 'G-01-03-2',
    descricao: 'Silvicultura',
    formularioTipo: 'silvicultura',
    subActivity: LISTAGEM_G_SUBACTIVITIES[3],
    unidade: 'ha',
  },
  {
    codigo: 'G-02-02-1',
    descricao: 'Avicultura',
    formularioTipo: 'avicultura',
    subActivity: LISTAGEM_G_SUBACTIVITIES[6],
    unidade: 'cabeças',
  },
  {
    codigo: 'G-02-04-6',
    descricao: 'Suinocultura',
    formularioTipo: 'suinocultura',
    subActivity: LISTAGEM_G_SUBACTIVITIES[5],
    unidade: 'cabeças',
  },
  {
    codigo: 'G-02-07-0',
    descricao:
      'Criação de bovinos, bubalinos, equinos, muares, ovinos e caprinos, em regime extensivo',
    formularioTipo: 'bovinocultura',
    subActivity: LISTAGEM_G_SUBACTIVITIES[1],
    unidade: 'ha',
  },
  {
    codigo: 'G-02-08-9',
    descricao:
      'Criação de bovinos, bubalinos, equinos, muares, ovinos e caprinos, em regime de confinamento',
    formularioTipo: 'bovinocultura',
    subActivity: LISTAGEM_G_SUBACTIVITIES[1],
    unidade: 'cabeças',
  },
  {
    codigo: 'G-03-03-4',
    descricao: 'Produção de carvão vegetal oriunda de floresta plantada',
    formularioTipo: 'silvicultura',
    subActivity: LISTAGEM_G_SUBACTIVITIES[3],
    unidade: 'mdc/ano',
  },
  {
    codigo: 'G-03-04-2',
    descricao: 'Produção de carvão vegetal de origem nativa/aproveitamento do rendimento lenhoso',
    formularioTipo: 'silvicultura',
    subActivity: LISTAGEM_G_SUBACTIVITIES[3],
    unidade: 'mdc/ano',
  },
  {
    codigo: 'G-04-01-4',
    descricao:
      'Beneficiamento primário de produtos agrícolas: limpeza, lavagem, secagem, despolpamento, descascamento, classificação e/ou tratamento de sementes',
    formularioTipo: 'graos',
    subActivity: LISTAGEM_G_SUBACTIVITIES[4],
    unidade: 't/ano',
  },
  {
    codigo: 'G-05-02-0',
    descricao: 'Barragem de irrigação ou de perenização para agricultura',
    formularioTipo: 'irrigados',
    subActivity: LISTAGEM_G_SUBACTIVITIES[2],
    unidade: 'ha',
  },
  {
    codigo: 'G-05-04-3',
    descricao: 'Canais de irrigação',
    formularioTipo: 'irrigados',
    subActivity: LISTAGEM_G_SUBACTIVITIES[2],
    unidade: 'km',
  },
  {
    codigo: 'G-06-01-8',
    descricao: 'Armazenamento de produtos agrotóxicos',
    formularioTipo: 'geral',
    subActivity: LISTAGEM_G_SUBACTIVITIES[0],
    unidade: 'ha',
  },
];

const BY_CODIGO = new Map<string, ListagemGDn217Entry>(
  ENTRIES.map((e) => [e.codigo, e]),
);

export function normalizarCodigoDn217(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

export function lookupListagemGDn217(raw: string): ListagemGDn217Entry | null {
  const codigo = normalizarCodigoDn217(raw);
  if (!codigo) return null;
  return BY_CODIGO.get(codigo) ?? null;
}

export function listagemGDn217Entries(): ListagemGDn217Entry[] {
  return [...ENTRIES];
}
