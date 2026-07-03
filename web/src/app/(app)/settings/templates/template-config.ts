import { ESTUDOS_TECNICOS_MENU_LABEL } from '@/lib/navigation-config';

export const TEMPLATE_CARDS: { slug: string; title: string; description: string }[] = [
  { slug: 'rca', title: 'RCA', description: `Template base para Relatório de Controle Ambiental. Será usado na exportação dos estudos RCA em ${ESTUDOS_TECNICOS_MENU_LABEL}.` },
  { slug: 'ptrf', title: 'PTRF', description: 'Template base para Plano de Transporte de Resíduos Florestais.' },
  { slug: 'prada', title: 'PRADA', description: 'Template base para Plano de Recuperação de Áreas Degradadas.' },
  { slug: 'pia', title: 'PIA', description: 'Template base para Plano de Intervenção Ambiental.' },
  { slug: 'eia-rima', title: 'EIA/RIMA', description: 'Template base para Estudo de Impacto Ambiental e Relatório de Impacto Ambiental.' },
  { slug: 'las-ras', title: 'LAS-RAS', description: 'Template base para Relatório Ambiental Simplificado (LAS/RAS).' },
  { slug: 'pca', title: 'PCA', description: 'Template base para Plano de Controle Ambiental.' },
  { slug: 'pea', title: 'PEA - Programa de Educação Ambiental', description: 'Template base para Programa de Educação Ambiental.' },
  { slug: 'reserva-legal', title: 'Reserva Legal', description: 'Template base para estudos de Reserva Legal.' },
  { slug: 'fauna', title: 'Fauna', description: 'Template base para estudos de Fauna.' },
  { slug: 'outorgas', title: 'Outorgas', description: 'Template base para estudos de Outorgas.' },
  { slug: 'barragens', title: 'Estudos de Barragens', description: 'Template base para Projeto Técnico de Barragem e estudos de barragens.' },
  { slug: 'seguranca-barragens', title: 'Segurança de Barragens', description: 'Template base para PSB, PAE, inspeções e Dam Break (triagem).' },
  { slug: 'piscinao-off-stream', title: 'Piscinão off-stream', description: 'Template base para cadastro de piscinão, demanda hídrica e Rippl.' },
];
