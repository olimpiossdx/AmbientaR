'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import type {
  FinancialCenter,
  FinancialCenterType,
  FinancialAllocation,
  Contract,
  SupplierContract,
  Project,
} from '@/lib/types';
import {
  computeCenterTotals,
  formatCurrencyBRL,
  getFinancialCenterTypeLabel,
} from '@/lib/financial-centers';
import { logUserAction } from '@/lib/audit-log';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function CentrosFinanceirosPage() {
  const { firestore, auth, user } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<FinancialCenterType>('project');
  const [budgetRevenue, setBudgetRevenue] = useState('');
  const [budgetCost, setBudgetCost] = useState('');
  const [contractId, setContractId] = useState('');
  const [supplierContractId, setSupplierContractId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [saving, setSaving] = useState(false);

  const centersQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'financial_centers') : null),
    [firestore, user],
  );
  const { data: centers, isLoading } = useCollection<FinancialCenter>(centersQ);

  const allocQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'financial_allocations') : null),
    [firestore, user],
  );
  const { data: allocations } = useCollection<FinancialAllocation>(allocQ);

  const contractsQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'contracts') : null),
    [firestore, user],
  );
  const { data: contracts } = useCollection<Contract>(contractsQ);

  const supplierQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'supplierContracts') : null),
    [firestore, user],
  );
  const { data: supplierContracts } = useCollection<SupplierContract>(supplierQ);

  const projectsQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'projects') : null),
    [firestore, user],
  );
  const { data: projects } = useCollection<Project>(projectsQ);

  const rows = useMemo(() => {
    const allocs = allocations ?? [];
    return (centers ?? []).map((c) => ({
      center: c,
      totals: computeCenterTotals(c, allocs),
    }));
  }, [centers, allocations]);

  async function handleCreate() {
    if (!firestore || !auth?.currentUser) return;
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Informe o nome do centro.' });
      return;
    }
    setSaving(true);
    const uid = auth.currentUser.uid;
    const now = new Date().toISOString();
    const payload: Record<string, unknown> = {
      name: name.trim(),
      type,
      status: 'active',
      createdAt: now,
      createdBy: uid,
    };
    if (budgetRevenue) payload.budgetRevenue = Number(budgetRevenue);
    if (budgetCost) payload.budgetCost = Number(budgetCost);
    if (contractId) {
      payload.contractId = contractId;
      payload.type = 'contract';
      const ct = contracts?.find((c) => c.id === contractId);
      if (ct) {
        payload.clientId = ct.contratante.clientId;
        if (!payload.budgetRevenue) payload.budgetRevenue = ct.pagamento?.valorTotal;
      }
    }
    if (supplierContractId) {
      payload.supplierContractId = supplierContractId;
      payload.type = 'supplier_contract';
      const sc = supplierContracts?.find((s) => s.id === supplierContractId);
      if (sc) {
        payload.supplierId = sc.prestador.supplierId;
        if (!payload.budgetCost) payload.budgetCost = sc.pagamento?.valorTotal;
      }
    }
    if (projectId) {
      payload.projectId = projectId;
      if (!contractId && !supplierContractId) payload.type = 'project';
    }

    try {
      const ref = await addDoc(collection(firestore, 'financial_centers'), payload);
      await logUserAction(firestore, auth, 'create_financial_center', { id: ref.id, name });
      toast({ title: 'Centro criado' });
      setOpen(false);
      router.push(`/financial/controle-projetos/centros/${ref.id}`);
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar centro',
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Centros financeiros" description="Projetos, contratos, fornecedores e ativos.">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo centro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo centro financeiro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={type} onValueChange={(v) => setType(v as FinancialCenterType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project">Empreendimento</SelectItem>
                    <SelectItem value="contract">Contrato cliente</SelectItem>
                    <SelectItem value="supplier_contract">Contratação fornecedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Contrato cliente (opcional)</Label>
                <Select value={contractId} onValueChange={setContractId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {(contracts ?? [])
                      .filter((c) => c.status === 'Aprovado')
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.contratante?.nome} — {formatCurrencyBRL(c.pagamento?.valorTotal ?? 0)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Contrato fornecedor (opcional)</Label>
                <Select value={supplierContractId} onValueChange={setSupplierContractId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {(supplierContracts ?? [])
                      .filter((c) => c.status === 'Aprovado')
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.prestador?.nome} — {formatCurrencyBRL(c.pagamento?.valorTotal ?? 0)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Empreendimento (opcional)</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {(projects ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.propertyName || p.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Receita prevista (R$)</Label>
                <Input
                  type="number"
                  value={budgetRevenue}
                  onChange={(e) => setBudgetRevenue(e.target.value)}
                />
              </div>
              <div>
                <Label>Custo previsto (R$)</Label>
                <Input
                  type="number"
                  value={budgetCost}
                  onChange={(e) => setBudgetCost(e.target.value)}
                />
              </div>
              <Button onClick={handleCreate} disabled={saving} className="w-full">
                {saving ? 'Salvando…' : 'Criar centro'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Lista</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Saldo caixa</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      Nenhum centro. Crie um ou vincule a um contrato.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map(({ center, totals }) => (
                    <TableRow key={center.id}>
                      <TableCell>
                        <Link
                          href={`/financial/controle-projetos/centros/${center.id}`}
                          className="font-medium hover:underline"
                        >
                          {center.name}
                        </Link>
                      </TableCell>
                      <TableCell>{getFinancialCenterTypeLabel(center.type)}</TableCell>
                      <TableCell>{center.status}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrencyBRL(totals.cashBalance)}
                      </TableCell>
                      <TableCell className="text-right">
                        {totals.roiPercent != null ? `${totals.roiPercent.toFixed(1)}%` : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
