import type { NavSubItem, UserRole } from '@/lib/types';
import { LISTAGEM_CODES, LISTAGEM_SHORT_BY_CODE } from '@/lib/listagem-activities';
import { BookMarked, List } from 'lucide-react';

export const RCA_MENU_LABEL = 'RCA';
export const RCA_LIST_PATH = '/studies/rca';
export const RCA_NEW_PATH = '/studies/rca/new';

export const RCA_NAV_ROLES: UserRole[] = [
  'admin',
  'technical',
  'gestor',
  'supervisor',
  'advogado',
];

/** Submenu RCA em Estudos Técnicos — lista geral + elaboração A–H. */
export function buildRcaNavSubItems(): NavSubItem[] {
  const listagemItems: NavSubItem[] = LISTAGEM_CODES.map((code) => ({
    href: `${RCA_NEW_PATH}?listagem=${code}`,
    label: `Listagem ${code} — ${LISTAGEM_SHORT_BY_CODE[code] ?? code}`,
    icon: BookMarked,
    roles: RCA_NAV_ROLES,
  }));

  return [
    {
      href: RCA_LIST_PATH,
      label: 'Lista de RCAs',
      icon: List,
      roles: RCA_NAV_ROLES,
    },
    ...listagemItems,
  ];
}
