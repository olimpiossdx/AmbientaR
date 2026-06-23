import type { NavSubItem, UserRole } from '@/lib/types';
import { GEOREF_TRAMITES_SUBMENU_LABEL } from '@/lib/licenciamento-menu';
import {
  BookOpen,
  BookOpenCheck,
  Building2,
  Crosshair,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  History,
  LayoutDashboard,
  Leaf,
  Scale,
  Trees,
} from 'lucide-react';

export const GEOREF_MENU_LABEL = 'Georeferenciamento';

export const GEOREF_NAV_ROLES: UserRole[] = [
  'admin',
  'gestor',
  'supervisor',
  'diretor_fauna',
  'advogado',
];

/** Subitens do menu Georeferenciamento. */
export function buildGeorefNavSubItems(): NavSubItem[] {
  const roles = GEOREF_NAV_ROLES;
  return [
    {
      href: '/georeferenciamento',
      label: 'Painel',
      icon: LayoutDashboard,
      roles,
    },
    {
      href: '/georeferenciamento/processos',
      label: GEOREF_TRAMITES_SUBMENU_LABEL,
      icon: FolderKanban,
      roles,
    },
    {
      href: '/georeferenciamento/rural',
      label: 'Rural (SIGEF/INCRA)',
      icon: Trees,
      roles,
    },
    {
      href: '/georeferenciamento/urbano',
      label: 'Urbano (cartório)',
      icon: Building2,
      roles,
    },
    {
      href: '/georeferenciamento/ambiental',
      label: 'CAR / SICAR',
      icon: Leaf,
      roles,
    },
    {
      href: '/georeferenciamento/historico-car',
      label: 'Histórico CAR',
      icon: History,
      roles,
    },
    {
      href: '/georeferenciamento/campo',
      label: 'Campo e levantamento',
      icon: Crosshair,
      roles,
    },
    {
      href: '/georeferenciamento/documentos',
      label: 'Documentação técnica',
      icon: FileSpreadsheet,
      roles,
    },
    {
      href: '/georeferenciamento/memorial-descritivo',
      label: 'Memorial descritivo',
      icon: FileText,
      roles,
    },
    {
      href: '/georeferenciamento/validacoes',
      label: 'Validações',
      icon: Scale,
      roles,
    },
    {
      href: '/georeferenciamento/registro',
      label: 'Cartório e registro',
      icon: BookOpen,
      roles,
    },
    {
      href: '/georeferenciamento/referencias',
      label: 'Referências normativas',
      icon: BookOpenCheck,
      roles,
    },
  ];
}

/** Cards do painel `/georeferenciamento`. */
export const GEOREF_HUB_MODULES = [
  {
    href: '/georeferenciamento/processos',
    title: 'Trâmites fundiários',
    description: 'Processos rurais, urbanos e ambientais com status e documentação.',
    icon: FolderKanban,
  },
  {
    href: '/georeferenciamento/rural',
    title: 'Rural — SIGEF / INCRA',
    description: 'Certificação eletrônica, planilha de vértices, planta e memorial (MTGIR).',
    icon: Trees,
  },
  {
    href: '/georeferenciamento/urbano',
    title: 'Urbano — Cartório',
    description: 'Lotes, desmembramentos e memorial em SIRGAS2000 para registro no RI.',
    icon: Building2,
  },
  {
    href: '/georeferenciamento/ambiental',
    title: 'CAR / SICAR',
    description: 'Perímetro georreferenciado, APP, RL e compatibilização com certificação fundiária.',
    icon: Leaf,
  },
  {
    href: '/georeferenciamento/historico-car',
    title: 'Histórico CAR',
    description: 'Snapshots e comparação de alterações no cadastro ambiental rural.',
    icon: History,
  },
  {
    href: '/georeferenciamento/campo',
    title: 'Campo e levantamento',
    description: 'GNSS/RTK, QA de precisão e integração com Mapas.',
    icon: Crosshair,
  },
  {
    href: '/georeferenciamento/documentos',
    title: 'Documentação técnica',
    description: 'Memorial descritivo, planta, ART/RRT e anuências.',
    icon: FileSpreadsheet,
  },
  {
    href: '/georeferenciamento/memorial-descritivo',
    title: 'Memorial descritivo',
    description: 'Gere memorial a partir de KML/SHP com coordenadas UTM, azimutes e exportação DOCX/PDF.',
    icon: FileText,
  },
  {
    href: '/georeferenciamento/validacoes',
    title: 'Validações',
    description: 'Sobreposição, área, sistema de coordenadas e fechamento de polígono.',
    icon: Scale,
  },
  {
    href: '/georeferenciamento/registro',
    title: 'Cartório e registro',
    description: 'Pacote documental para protocolo no Registro de Imóveis.',
    icon: BookOpen,
  },
  {
    href: '/georeferenciamento/referencias',
    title: 'Referências normativas',
    description: 'Prazos, obrigatoriedades e links oficiais (SIGEF, CAR, cartório).',
    icon: BookOpenCheck,
  },
] as const;
