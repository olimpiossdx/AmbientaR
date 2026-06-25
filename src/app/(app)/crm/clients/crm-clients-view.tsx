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
import { Input } from '@/components/ui/input';
import { Eye, Pencil, PlusCircle, Search, ExternalLink } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Client } from '@/lib/types';
import { formatCpfCnpjDisplay } from '@/lib/masks';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const DetailItem = ({ label, value }: { label: string; value?: string | null | string[] }) => {
  const display = Array.isArray(value)
    ? value.filter((s) => typeof s === 'string' && s.length > 1).join(', ') || (value.length > 0 ? value.join('') : 'Não informado')
    : value || 'Não informado';
  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium">{label}</Label>
      <p className="text-sm text-muted-foreground">{display}</p>
    </div>
  );
};

import { canAccessCrm } from '@/lib/role-guards';

export function CrmClientsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientToView, setClientToView] = useState<Client | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const firestore = useFirestore();
  const { user } = useAuth();
  const router = useRouter();

  const clientsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    if (canAccessCrm(user.role)) return collection(firestore, 'clients');
    return query(collection(firestore, 'clients'), where('id', '==', '__none__'));
  }, [firestore, user]);

  const { data: clients, isLoading } = useCollection<Client>(clientsQuery);

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((c) => {
      const name = c.name?.toLowerCase() ?? '';
      const email = c.email?.toLowerCase() ?? '';
      const cpfCnpj = c.cpfCnpj ?? '';
      return name.includes(term) || email.includes(term) || cpfCnpj.includes(term);
    });
  }, [clients, searchTerm]);

  const handleView = (client: Client) => {
    setClientToView(client);
    setIsViewOpen(true);
  };

  const handleEdit = (client: Client) => {
    router.push(`/clients/${client.id}/edit`);
  };

  const handleNewClient = () => {
    router.push('/clients/new');
  };

  const handleOpenFullCadastro = () => {
    router.push('/clients');
  };

  if (user && !canAccessCrm(user.role)) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader title="Gestão de Clientes (CRM)" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Acesso restrito</CardTitle>
              <CardDescription>Você não tem permissão para acessar a gestão de clientes do CRM.</CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Gestão de Clientes (CRM)">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleOpenFullCadastro} className="gap-1">
              <ExternalLink className="h-4 w-4" />
              Cadastro completo
            </Button>
            <Button size="sm" className="gap-1" onClick={handleNewClient}>
              <PlusCircle className="h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Card>
            <CardHeader>
              <CardTitle>Clientes</CardTitle>
              <CardDescription>
                Liste e acesse os clientes. Use o cadastro completo para criar, editar e gerenciar todos os dados.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                      {clients?.length != null ? `Total: ${clients.length} cliente(s)` : null}
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nome, CPF/CNPJ ou email..."
                        className="h-9"
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0">
                            <Search className="h-4 w-4" />
                            <span className="sr-only">Buscar</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Filtrar clientes digitando na caixa de busca</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>CPF/CNPJ</TableHead>
                        <TableHead className="hidden md:table-cell">Email</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading &&
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-48" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-24" /></TableCell>
                          </TableRow>
                        ))}
                      {!isLoading &&
                        filteredClients.map((client) => (
                          <TableRow key={client.id}>
                            <TableCell className="font-medium">{client.name}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatCpfCnpjDisplay(client.cpfCnpj)}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">
                              {client.email}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => handleView(client)}>
                                      <Eye className="h-4 w-4" />
                                      <span className="sr-only">Visualizar</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>Visualizar detalhes</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}>
                                      <Pencil className="h-4 w-4" />
                                      <span className="sr-only">Editar</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>Ir para edição no cadastro</p></TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      {!isLoading && filteredClients.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            Nenhum cliente encontrado para o filtro atual.
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

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{clientToView?.name}</DialogTitle>
            <DialogDescription>Detalhes do cliente. Edite no cadastro completo se necessário.</DialogDescription>
          </DialogHeader>
          {clientToView && (
            <div className="form-scroll-body max-h-[60vh] space-y-4">
              <DetailItem label="Nome / Razão Social" value={clientToView.name} />
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="CPF/CNPJ" value={formatCpfCnpjDisplay(clientToView.cpfCnpj)} />
                <DetailItem label="Tipo" value={clientToView.entityType} />
              </div>
              <DetailItem label="Email" value={clientToView.email} />
              <DetailItem label="Telefone" value={clientToView.phone} />
              <DetailItem label="Endereço" value={[clientToView.address, clientToView.numero].filter(Boolean).join(', ')} />
              <DetailItem label="Município / UF" value={[clientToView.municipio, clientToView.uf].filter(Boolean).join(' / ')} />
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Fechar</Button>
            </DialogClose>
            <Button type="button" onClick={() => clientToView && handleEdit(clientToView)}>
              Editar no cadastro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
