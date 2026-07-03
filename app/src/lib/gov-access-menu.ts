import type { NavSubItem, UserRole } from '@/lib/types';
import { BookText, Globe, Link as LinkIcon } from 'lucide-react';

export const GOV_ACCESS_MENU_LABEL = 'Acessos Governamentais';

const GOV_ROLES: UserRole[] = [
  'admin',
  'technical',
  'gestor',
  'financial',
  'sales',
  'supervisor',
  'diretor_fauna',
  'advogado',
];

function externalHref(url: string, title: string, newTab = false): string {
  const params = new URLSearchParams({ url, title });
  if (newTab) params.set('newTab', 'true');
  return `/external?${params.toString()}`;
}

/** Links externos oficiais (SEI, SLA, consultas MG, IBAMA). */
export function buildGovAccessNavSubItems(): NavSubItem[] {
  return [
    {
      href: externalHref(
        'https://sistemas.meioambiente.mg.gov.br/consulta-intervencao/site/listar-decisoes',
        'Consulta Intervenção Ambiental',
      ),
      label: 'Consulta Intervenção Ambiental',
      icon: BookText,
      roles: GOV_ROLES,
    },
    {
      href: externalHref(
        'https://sistemas.meioambiente.mg.gov.br/licenciamento/site/consulta-licenca',
        'Consulta de Licenças',
      ),
      label: 'Consulta Licenciamento',
      icon: BookText,
      roles: GOV_ROLES,
    },
    {
      href: externalHref(
        'https://sistemas.meioambiente.mg.gov.br/licenciamento/site/lista-outorgas',
        'Consulta de Outorgas',
      ),
      label: 'Consulta Outorgas',
      icon: BookText,
      roles: GOV_ROLES,
    },
    {
      href: externalHref('https://servicos.ibama.gov.br/ctf/', 'CTF/IBAMA', true),
      label: 'CTF/IBAMA',
      icon: LinkIcon,
      roles: GOV_ROLES,
    },
    {
      href: externalHref(
        'https://visualizador.idesisema.meioambiente.mg.gov.br/',
        'IDE-SisemaNet-MG',
      ),
      label: 'IDE-SisemaNet-MG',
      icon: Globe,
      roles: GOV_ROLES,
    },
    {
      href: externalHref(
        'https://sei.ibama.gov.br/controlador_externo.php?acao=usuario_externo_logar&id_orgao_acesso_externo=0',
        'SEI-IBAMA',
        true,
      ),
      label: 'SEI-IBAMA',
      icon: LinkIcon,
      roles: GOV_ROLES,
    },
    {
      href: externalHref(
        'https://www.sei.mg.gov.br/sei/controlador_externo.php?acao=usuario_externo_logar&id_orgao_acesso_externo=0',
        'SEI-MG',
        true,
      ),
      label: 'SEI-MG',
      icon: LinkIcon,
      roles: GOV_ROLES,
    },
    {
      href: externalHref(
        'https://ecosistemas.meioambiente.mg.gov.br/portalseguranca/login',
        'SLA-Ecossistemas-MG',
        true,
      ),
      label: 'SLA-Ecossistemas/MG',
      icon: LinkIcon,
      roles: GOV_ROLES,
    },
  ];
}
