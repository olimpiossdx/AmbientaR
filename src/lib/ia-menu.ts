import type { NavSubItem, UserRole } from '@/lib/types';
import {
  Bot,
  BookOpenCheck,
  Droplets,
  FileArchive,
  FileText,
  Globe,
  Recycle,
  Satellite,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { FAD_MENU_LABEL, FAD_NAV_ROLES, FAD_ROUTE_BASE } from '@/lib/fiscal-ambiental/fad-menu';

export const IA_MENU_LABEL = 'IA';

export const IA_ASSISTANT_TIPOS = [
  'geral',
  'mira',
  'outorga',
  'financeiro',
  'rag',
  'mcp',
] as const;

export type IaAssistantTipo = (typeof IA_ASSISTANT_TIPOS)[number];

export const IA_ASSISTANT_TIPO_LABELS: Record<IaAssistantTipo, string> = {
  geral: 'Legislação e estudos',
  mira: 'Águas / MIRA-IGAM',
  outorga: 'Outorga MG (IGAM / SOUT)',
  financeiro: 'Custos e contratos',
  rag: 'Síntese de texto',
  mcp: 'Cruzamento de dados',
};

const IA_STUDY_ROLES: UserRole[] = [
  'admin',
  'technical',
  'gestor',
  'supervisor',
  'diretor_fauna',
  'advogado',
];

export function assistantHref(tipo: IaAssistantTipo): string {
  return `/studies/assistant?tipo=${tipo}`;
}

/** Subitens do menu IA. */
export function buildIaNavSubItems(): NavSubItem[] {
  return [
    {
      href: assistantHref('mira'),
      label: 'Águas / MIRA-IGAM',
      icon: Droplets,
      roles: IA_STUDY_ROLES,
    },
    {
      href: FAD_ROUTE_BASE,
      label: FAD_MENU_LABEL,
      icon: Satellite,
      roles: FAD_NAV_ROLES,
    },
    {
      href: '/analise-ambiental',
      label: 'Análise Geoespacial (IA)',
      icon: Globe,
      roles: IA_STUDY_ROLES,
    },
    {
      href: '/studies/analise-socioambiental',
      label: 'Análise Socioambiental',
      icon: FileText,
      roles: IA_STUDY_ROLES,
    },
    {
      href: assistantHref('mcp'),
      label: 'Cruzamento de dados',
      icon: Workflow,
      roles: IA_STUDY_ROLES,
    },
    {
      href: assistantHref('geral'),
      label: 'Legislação e estudos',
      icon: BookOpenCheck,
      roles: IA_STUDY_ROLES,
    },
    {
      href: '/reporting',
      label: 'Relatórios de IA',
      icon: Recycle,
      roles: ['admin', 'financial'],
    },
    {
      href: assistantHref('rag'),
      label: 'Síntese de texto',
      icon: FileArchive,
      roles: IA_STUDY_ROLES,
    },
    {
      label: 'Automações',
      icon: Bot,
      roles: ['admin'],
      subItems: [
        {
          href: '/ai-lab/automations',
          label: 'Automações IA',
          icon: Bot,
          roles: ['admin'],
        },
      ],
    },
  ];
}
