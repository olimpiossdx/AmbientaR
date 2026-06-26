'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, ExternalLink, Eye, Pencil, Search } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { collection, limit, query } from 'firebase/firestore';
import { sortCommercialProposalsByDate } from '@/lib/firestore-list-helpers';
import type { CommercialProposal, Client } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

import { canAccessCrm } from '@/lib/role-guards';

const statusVariant: Record<CommercialProposal['status'], string> = {
  Draft: 'bg-slate-500/20 text-slate-700 border-slate-500/30',
  Sent: 'bg-blue-500/20 text-blue-700 border-blue-500/30',
  Accepted: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30',
  Rejected: 'bg-red-500/20 text-red-700 border-red-500/30',
};

const statusLabel: Record<CommercialProposal['status'], string> = {
  Draft: 'Rascunho',
  Sent: 'Enviada',
  Accepted: 'Aceita',
  Rejected: 'Rejeitada',
};

export function CrmProposalsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<CommercialProposal['status'] | ''>('');

  const firestore = useFirestore();
  const { user } = useAuth();
  const router = useRouter();

  const proposalsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'commercialProposals'), limit(200));
  }, [firestore, user]);

  const clientsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'clients'), limit(200));
  }, [firestore, user]);

  const { data: rawProposals, isLoading: isLoadingProposals } = useCollection<CommercialProposal>(proposalsQuery);
  const proposals = useMemo(
    () => (rawProposals ? sortCommercialProposalsByDate(rawProposals) : undefined),
    [rawProposals],
  );
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);

  const clientsMap = useMemo(() => new Map(clients?.map((c) => [c.id, c.name]) ?? []), [clients]);

  const filtered = useMemo(() => {
    const list = proposals ?? [];
    let out = list;
    if (filterStatus) out = out.filter((p) => p.status === filterStatus);
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      out = out.filter((p) => {
        const clientName = clientsMap.get(p.clientId)?.toLowerCase() ?? '';
        const num = (p.proposalNumber ?? '').toLowerCase();
        return clientName.includes(term) || num.includes(term);
      });
    }
    return out.sort((a, b) => b.proposalNumber.localeCompare(a.proposalNumber, undefined, { numeric: true, sensitivity: 'base' }));
  }, [proposals, filterStatus, searchTerm, clientsMap]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const formatDate = (s: string | undefined) => (s ? new Date(s).toLocaleDateString('pt-BR') : '—');

  const handleNew = () => router.push('/commercial-proposals/new');
  const handleOpenModule = () => router.push('/commercial-proposals');
  const handleView = () => router.push('/commercial-proposals');
  const handleEdit = (p: CommercialProposal) => router.push(`/commercial-proposals/${p.id}/edit`);

  const isLoading = isLoadingProposals || isLoadingClients;

  if (user && !canAccessCrm(user.role)) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Vendas & Propostas (CRM)" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Acesso restrito</CardTitle>
              <CardDescription>Você não tem permissão para acessar as propostas do CRM.</CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Vendas & Propostas (CRM)">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleOpenModule} className="gap-1">
            <ExternalLink className="h-4 w-4" />
            Módulo completo
          </Button>
          <Button size="sm" className="gap-1" onClick={handleNew}>
            <PlusCircle className="h-4 w-4" />
            Nova Proposta
          </Button>
        </div>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Propostas Comerciais</CardTitle>
            <CardDescription>
              Lista de propostas do CRM. Para criar, editar e ver detalhes utilize o módulo completo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <Label className="text-xs">Buscar</Label>
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Cliente ou número da proposta..."
                      className="h-9 mt-1"
                    />
                  </div>
                  <div className="w-[140px]">
                    <Label className="text-xs">Status</Label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as CommercialProposal['status'] | '')}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm mt-1"
                    >
                      <option value="">Todos</option>
                      {(Object.keys(statusLabel) as CommercialProposal['status'][]).map((s) => (
                        <option key={s} value={s}>
                          {statusLabel[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0">
                        <Search className="h-4 w-4" />
                        <span className="sr-only">Buscar</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Use a caixa de busca e o status para filtrar</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="hidden md:table-cell">Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Validade</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading &&
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-24" /></TableCell>
                        </TableRow>
                      ))}
                    {!isLoading &&
                      filtered.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.proposalNumber}</TableCell>
                          <TableCell>{clientsMap.get(p.clientId) ?? 'N/A'}</TableCell>
                          <TableCell className="hidden md:table-cell">{formatCurrency(p.amount)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(statusVariant[p.status])}>
                              {statusLabel[p.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{formatDate(p.validUntilDate)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={handleView}>
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">Ver</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Ver detalhes no módulo</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Editar</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar no módulo completo</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    {!isLoading && filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          Nenhuma proposta encontrada para os filtros atuais.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
