import type { NavSubItem, UserRole } from '@/lib/types';
import {
  BarChart2,
  Bell,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Share2,
  ShoppingCart,
  Users,
} from 'lucide-react';

export const CRM_MENU_LABEL = 'Vendas & CRM';

export const CRM_NAV_ROLES: UserRole[] = [
  'admin',
  'sales',
  'supervisor',
  'financial',
];

export function buildCrmNavSubItems(): NavSubItem[] {
  const roles = CRM_NAV_ROLES;
  return [
    {
      href: '/crm/alerts',
      label: 'Alertas & Notificações',
      icon: Bell,
      roles,
    },
    {
      href: '/crm/settings',
      label: 'Configurações CRM',
      icon: Settings,
      roles,
    },
    {
      href: '/crm/team',
      label: 'Equipe & Desempenho',
      icon: Users,
      roles,
    },
    {
      href: '/crm/clients',
      label: 'Gestão de Clientes',
      icon: Users,
      roles,
    },
    {
      href: '/social-media',
      label: 'Mídias Sociais',
      icon: Share2,
      roles,
    },
    {
      href: '/crm/opportunities',
      label: 'Oportunidades & Pipeline',
      icon: FolderKanban,
      roles,
    },
    {
      href: '/crm',
      label: 'Painel de Vendas',
      icon: LayoutDashboard,
      roles,
    },
    {
      href: '/crm/reports',
      label: 'Relatórios & Análises',
      icon: BarChart2,
      roles,
    },
    {
      href: '/crm/proposals',
      label: 'Vendas & Propostas',
      icon: FileText,
      roles,
    },
  ];
}
