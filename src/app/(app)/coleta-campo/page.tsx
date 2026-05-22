'use client';

import * as React from 'react';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Eye, Smartphone } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Empreendedor, Inventario, Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ColetaOfflineBanner } from '@/components/coleta-campo/coleta-offline-banner';
import { CAMPANHA_STATUS_LABEL, COLETA_CAMPO_BASE } from '@/lib/coleta-campo/constants';

function formatDate(value: string | unknown): string {
  if (!value) return '—';
  if (typeof value === 'string') return value;
  const date = (value as { toDate?: () => Date })?.toDate
    ? (value as { toDate: () => Date }).toDate()
    : new Date(value as string);
  return date.toLocaleDateString('pt-BR');
}

function campanhaTitulo(
  inv: Inventario,
  projectsMap: Map<string, string>,
  empreendedoresMap: Map<string, string>,
): string {
  if (inv.modo === 'solta') {
    return inv.nomeEmpreendimentoManual?.trim() || 'Campanha solta';
  }
  const emp = projectsMap.get(inv.empreendimentoId ?? '') ?? inv.empreendimentoId ?? '—';
  const ent = inv.empreendedorId
    ? empreendedoresMap.get(inv.empreendedorId) ?? ''
    : '';
  return ent ? `${emp} (${ent})` : emp;
}

export default function ColetaCampoPage() {
  const router = useRouter();
  const { firestore } = useFirebase();

  const campanhasQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'inventarios') : null),
    [firestore],
  );
  const { data: campanhas, isLoading } = useCollection<Inventario>(campanhasQuery);

  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'projects') : null),
    [firestore],
  );
  const { data: projects } = useCollection<Project>(projectsQuery);
  const projectsMap = useMemo(
    () => new Map(projects?.map((p) => [p.id, p.propertyName ?? p.id]) ?? []),
    [projects],
  );

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'empreendedores') : null),
    [firestore],
  );
  const { data: empreendedores } = useCollection<Empreendedor>(empreendedoresQuery);
  const empreendedoresMap = useMemo(
    () => new Map(empreendedores?.map((e) => [e.id, e.name]) ?? []),
    [empreendedores],
  );

  const sorted = useMemo(
    () =>
      [...(campanhas ?? [])].sort((a, b) => {
        const ta = a.updatedAt?.toMillis?.() ?? a.updatedAt ?? 0;
        const tb = b.updatedAt?.toMillis?.() ?? b.updatedAt ?? 0;
        return Number(tb) - Number(ta);
      }),
    [campanhas],
  );

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Coleta de campo">
        <Button size="sm" className="gap-1 min-h-10" onClick={() => router.push(`${COLETA_CAMPO_BASE}/nova`)}>
          <PlusCircle className="h-4 w-4" />
          Nova campanha
        </Button>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <ColetaOfflineBanner />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="h-5 w-5" />
              Campanhas de coleta
            </CardTitle>
            <CardDescription>
              Coleta offline de parcelas e árvores. Ao concluir, exporte o Excel e importe em{' '}
              <strong>Inventário Florestal</strong> (menu irmão).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : !sorted.length ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma campanha. Crie uma campanha vinculada ou solta para começar.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campanha</TableHead>
                      <TableHead>Modo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">
                          {campanhaTitulo(inv, projectsMap, empreendedoresMap)}
                        </TableCell>
                        <TableCell>{inv.modo === 'solta' ? 'Solta' : 'Vinculada'}</TableCell>
                        <TableCell>
                          {inv.tipoInventario === 'multinivel' ? 'Multinível' : 'Simples'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              inv.status === 'concluida' || inv.status === 'sincronizado'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {CAMPANHA_STATUS_LABEL[inv.status ?? 'rascunho']}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="min-h-9"
                            onClick={() => router.push(`${COLETA_CAMPO_BASE}/${inv.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Abrir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
