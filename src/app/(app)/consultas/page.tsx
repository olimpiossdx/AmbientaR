'use client';

import * as React from 'react';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Eye, Pencil } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase, useAuth } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Consulta, Empreendedor, Project, AppUser } from '@/lib/types';
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

const CONSULTA_STATUS_LABEL: Record<Consulta['status'], string> = {
  nova: 'Nova',
  em_andamento: 'Em andamento',
  aguardando_dados: 'Aguardando dados',
  em_analise: 'Em análise',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

const CONSULTA_CANAL_LABEL: Record<string, string> = {
  web: 'Web',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  interno: 'Interno',
};

const TIPO_SERVICO_LABEL: Record<string, string> = {
  RCA: 'RCA',
  PIA: 'PIA',
  PCA: 'PCA',
  PRADA: 'PRADA',
  InventarioFlorestal: 'Inventário Florestal',
  Fauna: 'Fauna',
  Outorgas: 'Outorgas',
  EducacaoAmbiental: 'Educação Ambiental',
  RelatorioDiverso: 'Relatório Diverso',
  Outro: 'Outro',
};

function formatDate(timestamp: any): string {
  if (!timestamp) return '—';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('pt-BR');
}

export default function ConsultasPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { user } = useAuth();
  const { firestore } = useFirebase();

  const consultasQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'consultas') : null),
    [firestore, user]
  );
  const { data: consultas, isLoading: isLoadingConsultas } = useCollection<Consulta>(consultasQuery);

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

  const usersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  const { data: users } = useCollection<AppUser>(usersQuery);
  const usersMap = useMemo(() => new Map(users?.map((u) => [u.uid, u.name || u.email])), [users]);

  const filteredConsultas = useMemo(() => {
    if (!consultas) return [];
    if (statusFilter === 'all') return consultas;
    return consultas.filter((c) => c.status === statusFilter);
  }, [consultas, statusFilter]);

  const handleAddNew = () => router.push('/consultas/new');
  const handleView = (item: Consulta) => router.push(`/consultas/${item.id}`);
  const handleEdit = (item: Consulta) => router.push(`/consultas/${item.id}/edit`);

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Consultas">
          <Button size="sm" className="gap-1" onClick={handleAddNew}>
            <PlusCircle className="h-4 w-4" />
            Nova consulta
          </Button>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Consultas ambientais</CardTitle>
              <CardDescription>
                Demandas de serviço (RCA, PIA, inventário, fauna etc.) vinculadas a empreendedor e empreendimento.
              </CardDescription>
              <div className="flex items-center gap-2 pt-2">
                <Label className="text-sm text-muted-foreground">Status:</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {(Object.entries(CONSULTA_STATUS_LABEL) as [Consulta['status'], string][]).map(([value, label]) => (
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
                      <TableHead>Data</TableHead>
                      <TableHead>Canal</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Empreendedor</TableHead>
                      <TableHead>Empreendimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead className="text-right w-24">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingConsultas &&
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={8}>
                            <Skeleton className="h-10 w-full" />
                          </TableCell>
                        </TableRow>
                      ))}
                    {!isLoadingConsultas &&
                      filteredConsultas.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-muted-foreground">{formatDate(item.createdAt)}</TableCell>
                          <TableCell>{CONSULTA_CANAL_LABEL[item.canal] ?? item.canal}</TableCell>
                          <TableCell>{TIPO_SERVICO_LABEL[item.tipoServico] ?? item.tipoServico}</TableCell>
                          <TableCell>{empreendedoresMap.get(item.empreendedorId) ?? '—'}</TableCell>
                          <TableCell>
                            {item.empreendimentoId
                              ? projectsMap.get(item.empreendimentoId) ?? '—'
                              : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{CONSULTA_STATUS_LABEL[item.status]}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.responsavelTecnicoUserId
                              ? usersMap.get(item.responsavelTecnicoUserId) ?? '—'
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => handleView(item)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Ver detalhes</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    {!isLoadingConsultas && filteredConsultas.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                          Nenhuma consulta encontrada.
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
    </>
  );
}
