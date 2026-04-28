'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Eye, FileText } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Laudo, Consulta, Empreendedor, Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const LAUDO_STATUS_LABEL: Record<Laudo['status'], string> = {
  rascunho: 'Rascunho',
  coletando_dados: 'Coletando dados',
  gerando: 'Gerando',
  pronto: 'Pronto',
  enviado: 'Enviado',
  cancelado: 'Cancelado',
};

const TIPO_ESTUDO_LABEL: Record<string, string> = {
  RCA: 'RCA', PIA: 'PIA', PCA: 'PCA', PRADA: 'PRADA',
  InventarioFlorestal: 'Inventário Florestal', Fauna: 'Fauna', Outorgas: 'Outorgas',
  EducacaoAmbiental: 'Educação Ambiental', RelatorioDiverso: 'Relatório Diverso', Outro: 'Outro',
};

function formatDate(timestamp: any): string {
  if (!timestamp) return '—';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('pt-BR');
}

export default function LaudosPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { firestore } = useFirebase();

  const laudosQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'laudos') : null),
    [firestore]
  );
  const { data: laudos, isLoading: isLoadingLaudos } = useCollection<Laudo>(laudosQuery);

  const consultasQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'consultas') : null),
    [firestore]
  );
  const { data: consultas } = useCollection<Consulta>(consultasQuery);
  const consultasMap = useMemo(
    () => new Map(consultas?.map((c) => [c.id, c])),
    [consultas]
  );

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'empreendedores') : null),
    [firestore]
  );
  const { data: empreendedores } = useCollection<Empreendedor>(empreendedoresQuery);
  const empreendedoresMap = useMemo(
    () => new Map(empreendedores?.map((e) => [e.id, e.name])),
    [empreendedores]
  );

  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'projects') : null),
    [firestore]
  );
  const { data: projects } = useCollection<Project>(projectsQuery);
  const projectsMap = useMemo(
    () => new Map(projects?.map((p) => [p.id, p.propertyName])),
    [projects]
  );

  const filteredLaudos = useMemo(() => {
    if (!laudos) return [];
    if (statusFilter === 'all') return laudos;
    return laudos.filter((l) => l.status === statusFilter);
  }, [laudos, statusFilter]);

  const handleAddNew = () => router.push('/laudos/new');
  const handleView = (item: Laudo) => router.push(`/laudos/${item.id}`);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Laudos">
        <Button size="sm" className="gap-1" onClick={handleAddNew}>
          <PlusCircle className="h-4 w-4" />
          Novo laudo
        </Button>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Laudos e estudos técnicos</CardTitle>
            <CardDescription>
              RCA, PIA, inventário, fauna etc. vinculados a consultas. Status: rascunho, em geração, pronto, enviado.
            </CardDescription>
            <div className="flex items-center gap-2 pt-2">
              <Label className="text-sm text-muted-foreground">Status:</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {(Object.entries(LAUDO_STATUS_LABEL) as [Laudo['status'], string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden sm:table-cell">Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="hidden md:table-cell">Empreendedor</TableHead>
                    <TableHead className="hidden lg:table-cell">Empreendimento</TableHead>
                    <TableHead className="hidden lg:table-cell">Consulta</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20 text-right sm:w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingLaudos &&
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={7}>
                          <Skeleton className="h-10 w-full" />
                        </TableCell>
                      </TableRow>
                    ))}
                  {!isLoadingLaudos &&
                    filteredLaudos.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">{formatDate(item.createdAt)}</TableCell>
                        <TableCell>{TIPO_ESTUDO_LABEL[item.tipoEstudo] ?? item.tipoEstudo}</TableCell>
                        <TableCell className="hidden md:table-cell">{empreendedoresMap.get(item.empreendedorId) ?? '—'}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {item.empreendimentoId ? projectsMap.get(item.empreendimentoId) ?? '—' : '—'}
                        </TableCell>
                        <TableCell className="hidden text-sm lg:table-cell">
                          {item.consultaId ? (
                            <Link href={`/consultas/${item.consultaId}`} className="text-primary hover:underline">
                              Ver consulta
                            </Link>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{LAUDO_STATUS_LABEL[item.status]}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => handleView(item)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver detalhes</TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  {!isLoadingLaudos && filteredLaudos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        Nenhum laudo encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TooltipProvider>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
