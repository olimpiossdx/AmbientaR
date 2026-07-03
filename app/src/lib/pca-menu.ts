import type { NavSubItem, UserRole } from '@/lib/types';
import { LISTAGEM_CODES, LISTAGEM_SHORT_BY_CODE } from '@/lib/listagem-activities';
import { BookMarked, List } from 'lucide-react';

export const PCA_MENU_LABEL = 'PCA';
export const PCA_LIST_PATH = '/studies/pca';
export const PCA_NEW_PATH = '/studies/pca/new';

export const PCA_NAV_ROLES: UserRole[] = [
  'admin',
  'technical',
  'gestor',
  'supervisor',
  'advogado',
];

/** Submenu PCA em Estudos Técnicos — lista geral + elaboração A–H. */
export function buildPcaNavSubItems(): NavSubItem[] {
  const listagemItems: NavSubItem[] = LISTAGEM_CODES.map((code) => ({
    href: `${PCA_NEW_PATH}?listagem=${code}`,
    label: `Listagem ${code} — ${LISTAGEM_SHORT_BY_CODE[code] ?? code}`,
    icon: BookMarked,
    roles: PCA_NAV_ROLES,
  }));

  return [
    {
      href: PCA_LIST_PATH,
      label: 'Lista de PCAs',
      icon: List,
      roles: PCA_NAV_ROLES,
    },
    ...listagemItems,
  ];
}
