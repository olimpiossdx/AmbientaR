/**
 * Catálogo de listagens e subatividades do RCA (espelho de rca-form.tsx).
 */
export const RCA_LISTAGEM_ACTIVITIES = [
  'LISTAGEM A – ATIVIDADES MINERÁRIAS',
  'LISTAGEM B – ATIVIDADES INDUSTRIAIS / INDÚSTRIA METALÚRGICA E OUTRAS',
  'LISTAGEM C – ATIVIDADES INDUSTRIAIS/INDÚSTRIA QUÍMICA E OUTRAS',
  'LISTAGEM D – ATIVIDADES INDUSTRIAIS / INDÚSTRIA ALIMENTÍCIA',
  'LISTAGEM E – ATIVIDADES DE INFRAESTRUTURA',
  'LISTAGEM F – GERENCIAMENTO DE RESÍDUOS E SERVIÇOS',
  'LISTAGEM G – ATIVIDADES AGROSSILVIPASTORIS',
  'LISTAGEM H – OUTRAS ATIVIDADES - H-01-01-1 Atividades e empreendimentos não listados ou não enquadrados em outros códigos, com supressão de vegetação primária ou secundária nativa pertencente ao bioma Mata Atlântica, em estágios médio e/ou avançado de regeneração, sujeita a EIA/Rima nos termos da Lei Federal nº 11.428, de 22 de dezembro de 2006, exceto árvores isoladas.',
] as const;

export const RCA_SUBACTIVITIES: Record<string, string[]> = {
  'LISTAGEM A – ATIVIDADES MINERÁRIAS': [
    'Lavra Subterrânea',
    'Lavra de rochas ornamentais',
    'Extração Areia Cascalho Argila',
    'Barragem de rejeitos e resíduos',
  ],
  'LISTAGEM B – ATIVIDADES INDUSTRIAIS / INDÚSTRIA METALÚRGICA E OUTRAS': [
    'Fabricação de Telhas, Tijolos e Outros Artigos de Barro Cozido',
    'Fabricação de Materiais Cerâmicos',
    'Siderurgia - Produção de ferro Gusa',
    'Produção de ligas metálicas (ferro ligas)',
    'Produção de Fundidos de Ferro e Aço',
    'Produção de fundidos de metais não-ferrosos, inclusive ligas, com e sem tratamento químico superficial e/ou galvanotécnico, inclusive a partir da reciclagem.',
    'Fabricação de móveis',
  ],
  'LISTAGEM C – ATIVIDADES INDUSTRIAIS/INDÚSTRIA QUÍMICA E OUTRAS': [
    'Fabricação de Explosivos, Pólvora Negra e Artigos Pirotécnicos',
    'Setor Farmacêutico',
    'Papel e papelão',
    'Indústria da Borracha',
    'Couros e Peles',
    'Indústria de Plásticos',
    'Produtos de Limpeza',
  ],
  'LISTAGEM D – ATIVIDADES INDUSTRIAIS / INDÚSTRIA ALIMENTÍCIA': [
    'Fabricação de Aguardente de Cana-de-Açúcar',
    'Preparação do leite e fabricação de produtos de laticínios',
    'Abatedouros e Matadouros',
    'Formulação de Rações Balanceadas e de Alimentos Preparados para Animais',
    'Processamento de subprodutos de origem animal para produção de sebo, óleos e farinha',
    'Refinação e preparação de óleos e gorduras vegetais, produção de manteiga de cacau e de gorduras de origem animal destinadas à alimentação',
  ],
  'LISTAGEM E – ATIVIDADES DE INFRAESTRUTURA': [
    'Rodovias',
    'Gasoduto, transporte de produtos químicos e oleodutos e minerodutos',
    'Recapacitação e/ou Repotenciação de CGHs e PCHs',
    'Projetos de aproveitamento de Biogás de Aterro Sanitário com ou sem Geração de Energia Elétrica',
    'Sistema de Biometanização de Resíduos Sólidos Urbanos com Geração de Energia Elétrica',
    'Sistema de Tratamento Térmico de Resíduos Sólidos Urbanos com Geração de Energia Elétrica',
    'Barragem de Saneamento',
    'Sistema de Abastecimento de Água',
    'Sistema de Esgotamento Sanitário',
    'Sistemas de Tratamento e Disposição Final de Resíduos Sólidos Urbanos',
    'Solo Urbano Exclusiva ou Predominantemente Residencial',
    "Dragagem em corpos d'água",
  ],
  'LISTAGEM F – GERENCIAMENTO DE RESÍDUOS E SERVIÇOS': ['Posto de Combustível'],
  'LISTAGEM G – ATIVIDADES AGROSSILVIPASTORIS': [
    'Cultura anuais, perenes e olericultura',
    'Criação de Bovinos',
    'Projetos Agropecuarios Irrigados',
    'Silvicultura e Carvoejamento',
    'Processamento, beneficiamento e armazenamento de graos',
    'Suinocultura',
    'Avicultura',
  ],
  'LISTAGEM H – OUTRAS ATIVIDADES - H-01-01-1 Atividades e empreendimentos não listados ou não enquadrados em outros códigos, com supressão de vegetação primária ou secundária nativa pertencente ao bioma Mata Atlântica, em estágios médio e/ou avançado de regeneração, sujeita a EIA/Rima nos termos da Lei Federal nº 11.428, de 22 de dezembro de 2006, exceto árvores isoladas.': [
    'Supressão de vegetação – Mata Atlântica (H-01-01-1)',
  ],
};
