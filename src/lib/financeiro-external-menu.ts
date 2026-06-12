import type { NavSubItem, UserRole } from '@/lib/types';
import { FileText } from 'lucide-react';

const FIN_ROLES: UserRole[] = ['admin', 'financial'];

function externalHref(url: string, title: string): string {
  return `/external?${new URLSearchParams({ url, title }).toString()}`;
}

/** Link externo NFe Nacional (menu Financeiro). */
export function buildFinanceiroNfeNavItem(): NavSubItem {
  return {
    href: externalHref(
      'https://www.nfse.gov.br/EmissorNacional/Login?ReturnUrl=%2fEmissorNacional',
      'NFe-Eletrônica',
    ),
    label: 'NFe-Eletrônica',
    icon: FileText,
    roles: FIN_ROLES,
  };
}
