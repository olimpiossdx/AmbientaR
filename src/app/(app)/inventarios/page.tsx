'use client';

import * as React from 'react';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Eye, ListTree } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Inventario, Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const INVENTARIO_STATUS_LABEL: Record<NonNullable<Inventario['status']>, string> = {
  rascunho: 'Rascunho',
  em_campo: 'Em campo',
  sincronizado: 'Sincronizado',
};

function formatDate(value: string | any): string {
  if (!value) return '—';
  if (typeof value === 'string') return value;
  const date = value?.toDate ? value.toDate() : new Date(value);
  return date.toLocaleDateString('pt-BR');
}

export default function InventariosPage() {
  const router = useRouter();
  const { firestore } = useFirebase();

  const inventariosQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'inventarios') : null),
    [firestore]
  );
  const { data: inventarios, isLoading } = useCollection<Inventario>(inventariosQuery);

  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'projects') : null),
    [firestore]
  );
  const { data: projects } = useCollection<Project>(projectsQuery);
  const projectsMap = useMemo(
    () => new Map(projects?.map((p) => [p.id, p.propertyName ?? p.id]) ?? []),
    [projects]
  );

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Inventário florestal (campo)">
        <Button size="sm" className="gap-1" onClick={() => router.push('/inventarios/new')}>
          <PlusCircle className="h-4 w-4" />
          Novo inventário
        </Button>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTree className="h-5 w-5" />
              Inventários
            </CardTitle>
            <CardDescription>
              Campanhas de inventário florestal por empreendimento. Dados podem ser coletados no app de campo (offline) e sincronizados aqui.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : !inventarios?.length ? (
              <p className="text-sm text-muted-foreground">Nenhum inventário. Clique em &quot;Novo inventário&quot; para criar.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empreendimento</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Fim</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventarios.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>{projectsMap.get(inv.empreendimentoId) ?? inv.empreendimentoId}</TableCell>
                      <TableCell>{formatDate(inv.dataInicio)}</TableCell>
                      <TableCell>{formatDate(inv.dataFim)}</TableCell>
                      <TableCell>
                        <Badge variant={inv.status === 'sincronizado' ? 'default' : 'secondary'}>
                          {INVENTARIO_STATUS_LABEL[inv.status ?? 'rascunho']}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/inventarios/${inv.id}`)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
