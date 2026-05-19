'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const subLinks = [
  { href: '/financial/controle-projetos', label: 'Painel', exact: true },
  { href: '/financial/controle-projetos/centros', label: 'Centros', exact: false },
  { href: '/financial/controle-projetos/ativos', label: 'Vendas de ativos', exact: false },
  { href: '/financial/controle-projetos/movimentacoes', label: 'Movimentações', exact: false },
  { href: '/financial/controle-projetos/rentabilidade', label: 'Rentabilidade', exact: false },
];

export default function ControleProjetosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex flex-wrap gap-2 border-b pb-3">
        {subLinks.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname === link.href || pathname?.startsWith(link.href + '/');
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
