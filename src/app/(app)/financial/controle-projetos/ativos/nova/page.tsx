'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import type {
  AssetKind,
  AssetSettlementType,
  AssetInstallment,
  Client,
  Fornecedor,
} from '@/lib/types';
import { appendFinancialMovement } from '@/lib/financial-ledger';
import { logUserAction } from '@/lib/audit-log';
import { useToast } from '@/hooks/use-toast';

export default function NovaVendaAtivoPage() {
  const router = useRouter();
  const { firestore, auth, user } = useFirebase();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [description, setDescription] = useState('');
  const [assetKind, setAssetKind] = useState<AssetKind>('vehicle');
  const [totalValue, setTotalValue] = useState('');
  const [acquisitionCost, setAcquisitionCost] = useState('');
  const [settlementType, setSettlementType] = useState<AssetSettlementType>('cash_only');
  const [counterpartyType, setCounterpartyType] = useState<'client' | 'supplier'>('client');
  const [counterpartyId, setCounterpartyId] = useState('');
  const [installmentCount, setInstallmentCount] = useState('1');
  const [firstDueDate, setFirstDueDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const clientsQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'clients') : null),
    [firestore, user],
  );
  const { data: clients } = useCollection<Client>(clientsQ);

  const suppliersQ = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'fornecedores') : null),
    [firestore, user],
  );
  const { data: suppliers } = useCollection<Fornecedor>(suppliersQ);

  function buildInstallments(total: number, n: number, due: string): AssetInstallment[] {
    const per = Math.round((total / n) * 100) / 100;
    const list: AssetInstallment[] = [];
    let remaining = total;
    for (let i = 0; i < n; i++) {
      const amt = i === n - 1 ? remaining : per;
      remaining -= amt;
      const d = new Date(due);
      d.setMonth(d.getMonth() + i);
      const kind =
        settlementType === 'barter_client_services' ||
        settlementType === 'barter_supplier_services'
          ? 'barter'
          : 'cash';
      list.push({
        seq: i + 1,
        dueDate: d.toISOString().slice(0, 10),
        amount: amt,
        kind,
        status: 'pending',
      });
    }
    return list;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firestore || !auth?.currentUser) return;
    const total = Number(totalValue);
    if (!description.trim() || total <= 0) {
      toast({ variant: 'destructive', title: 'Preencha descrição e valor total.' });
      return;
    }
    if (!counterpartyId) {
      toast({ variant: 'destructive', title: 'Selecione a contraparte.' });
      return;
    }

    setSaving(true);
    const uid = auth.currentUser.uid;
    const now = new Date().toISOString();
    const n = Math.max(1, parseInt(installmentCount, 10) || 1);
    const installments = buildInstallments(total, n, firstDueDate);
    const acq = acquisitionCost ? Number(acquisitionCost) : undefined;

    try {
      const centerRef = await addDoc(collection(firestore, 'financial_centers'), {
        name: `Venda: ${description.trim()}`,
        type: 'asset_sale',
        status: 'active',
        budgetRevenue: total,
        acquisitionCost: acq,
        clientId: counterpartyType === 'client' ? counterpartyId : undefined,
        supplierId: counterpartyType === 'supplier' ? counterpartyId : undefined,
        createdAt: now,
        createdBy: uid,
      });

      const saleRef = await addDoc(collection(firestore, 'financial_asset_sales'), {
        centerId: centerRef.id,
        assetKind,
        description: description.trim(),
        totalValue: total,
        acquisitionCost: acq,
        settlementType,
        counterpartyType,
        counterpartyId,
        installments,
        status: 'open',
        createdAt: now,
        createdBy: uid,
      });

      if (acq && acq > 0) {
        await appendFinancialMovement(firestore, {
          date: now.slice(0, 10),
          kind: 'asset_cost_out',
          direction: 'out',
          amount: acq,
          description: `Baixa/custo: ${description.trim()}`,
          centerId: centerRef.id,
          assetSaleId: saleRef.id,
          createdAt: now,
          createdBy: uid,
        });
      }

      await appendFinancialMovement(firestore, {
        date: now.slice(0, 10),
        kind: 'asset_sale_open',
        direction: 'in',
        amount: total,
        description: `Abertura venda: ${description.trim()}`,
        centerId: centerRef.id,
        assetSaleId: saleRef.id,
        createdAt: now,
        createdBy: uid,
      });

      await logUserAction(firestore, auth, 'create_asset_sale', {
        saleId: saleRef.id,
        centerId: centerRef.id,
      });

      toast({ title: 'Venda registada' });
      router.push(`/financial/controle-projetos/ativos/${saleRef.id}`);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro ao registar venda',
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Nova venda de ativo"
        description="Registe saída (custo) e entradas previstas até quitação total."
      />
      <Card>
        <CardHeader>
          <CardTitle>Dados da venda</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
            <div>
              <Label>Descrição do bem</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex.: Hilux 2018, Gerador 5kVA"
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={assetKind} onValueChange={(v) => setAssetKind(v as AssetKind)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vehicle">Veículo</SelectItem>
                  <SelectItem value="tool">Ferramenta</SelectItem>
                  <SelectItem value="equipment">Equipamento</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor total da venda (R$)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
              />
            </div>
            <div>
              <Label>Custo de aquisição / baixa (R$) — saída</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={acquisitionCost}
                onChange={(e) => setAcquisitionCost(e.target.value)}
              />
            </div>
            <div>
              <Label>Forma de recebimento</Label>
              <Select
                value={settlementType}
                onValueChange={(v) => setSettlementType(v as AssetSettlementType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash_only">Só dinheiro (parcelas)</SelectItem>
                  <SelectItem value="barter_client_services">Permuta — serviços do cliente</SelectItem>
                  <SelectItem value="barter_supplier_services">
                    Permuta — serviços do prestador
                  </SelectItem>
                  <SelectItem value="mixed">Misto (dinheiro + permuta)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Contraparte</Label>
              <Select
                value={counterpartyType}
                onValueChange={(v) => {
                  setCounterpartyType(v as 'client' | 'supplier');
                  setCounterpartyId('');
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="supplier">Fornecedor / prestador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{counterpartyType === 'client' ? 'Cliente' : 'Fornecedor'}</Label>
              <Select value={counterpartyId} onValueChange={setCounterpartyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {counterpartyType === 'client'
                    ? (clients ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))
                    : (suppliers ?? []).map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nº parcelas</Label>
                <Input
                  type="number"
                  min={1}
                  value={installmentCount}
                  onChange={(e) => setInstallmentCount(e.target.value)}
                />
              </div>
              <div>
                <Label>1ª parcela (vencimento)</Label>
                <Input
                  type="date"
                  value={firstDueDate}
                  onChange={(e) => setFirstDueDate(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Registando…' : 'Registar venda'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
