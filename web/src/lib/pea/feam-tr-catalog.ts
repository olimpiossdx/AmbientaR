/** Catálogo de documentos FEAM — Outros Estudos e Projetos Ambientais (educação ambiental / PEA). */

export type FeamTrCatalogItem = {
  id: string;
  titulo: string;
  descricao: string;
  formato: 'pdf' | 'docx';
  /** URL de visualização/download no portal FEAM */
  viewUrl: string;
  /** Nome sugerido ao salvar na pasta PEA */
  filename: string;
  /** Prioridade para importação em lote “essenciais PEA” */
  essencialPea?: boolean;
};

export const FEAM_TR_CATALOG: FeamTrCatalogItem[] = [
  {
    id: 'tr-educacao-ambiental',
    titulo: 'TR Educação Ambiental',
    descricao:
      'Termo de Referência para programas de educação ambiental não formal (base DN COPAM 214 — Anexo I).',
    formato: 'pdf',
    viewUrl:
      'https://feam.br/outros-estudos-e-projetos-ambientais/-/document_library/guuz/view_file/8699598',
    filename: 'FEAM-TR-Educacao-Ambiental.pdf',
    essencialPea: true,
  },
  {
    id: 'dispensa-pea',
    titulo: 'Formulário Dispensa PEA',
    descricao: 'Formulário de solicitação de dispensa de apresentação do PEA.',
    formato: 'docx',
    viewUrl:
      'https://feam.br/outros-estudos-e-projetos-ambientais/-/document_library/guuz/view_file/8903971',
    filename: 'FEAM-Formulario-Dispensa-PEA.docx',
    essencialPea: true,
  },
  {
    id: 'tr-prad',
    titulo: 'TR PRAD',
    descricao: 'Plano de Recuperação de Áreas Degradadas (referência cruzada).',
    formato: 'docx',
    viewUrl:
      'https://feam.br/outros-estudos-e-projetos-ambientais/-/document_library/guuz/view_file/8165141',
    filename: 'FEAM-TR-PRAD.docx',
  },
  {
    id: 'tr-queima-controlada',
    titulo: 'TR Queima Controlada',
    descricao: 'Planejamento de queima controlada e uso do fogo.',
    formato: 'docx',
    viewUrl:
      'https://feam.br/outros-estudos-e-projetos-ambientais/-/document_library/guuz/view_file/8164969',
    filename: 'FEAM-TR-Queima-Controlada.docx',
  },
];

export function getFeamCatalogItem(id: string): FeamTrCatalogItem | undefined {
  return FEAM_TR_CATALOG.find((i) => i.id === id);
}
