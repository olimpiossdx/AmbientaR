'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, Replace, Download, Loader2 } from 'lucide-react';
import { useDoc, useFirebase } from '@/firebase';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import type { InventoryFormula, InventoryProject } from '@/lib/types';
import { InventoryModuleHeader, inventoryActionButtonClass } from '../inventory-module-chrome';
import { ImportFormulasDialog } from './import-formulas-dialog';
import { useToast } from '@/hooks/use-toast';

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}`;
}

export default function FormulasPage() {
  const params = useParams();
  const projectId = (params?.id as string | undefined) ?? '';
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [importOpen, setImportOpen] = React.useState(false);
  const [insertOpen, setInsertOpen] = React.useState(false);
  const [desc, setDesc] = React.useState('');
  const [expr, setExpr] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const projectDocRef = React.useMemo(() => {
    if (!firestore || !projectId) return null;
    return doc(firestore, 'inventories', projectId);
  }, [firestore, projectId]);

  const { data: project } = useDoc<InventoryProject>(projectDocRef);

  const formulas = project?.inventoryFormulas ?? [];

  const persistFormulas = async (next: InventoryFormula[]) => {
    if (!firestore || !projectDocRef) return;
    setSaving(true);
    try {
      await updateDoc(projectDocRef, {
        inventoryFormulas: next,
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Atualizado', description: 'Fórmulas guardadas.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro', description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const handleInsert = async () => {
    if (!desc.trim() || !expr.trim()) {
      toast({ variant: 'destructive', title: 'Campos', description: 'Preencha descrição e expressão.' });
      return;
    }
    const next: InventoryFormula[] = [
      ...formulas,
      {
        id: newId(),
        descricao: desc.trim(),
        expressao: expr.trim(),
        ativa: true,
        dadosDe: new Date().toLocaleString('pt-BR'),
      },
    ];
    await persistFormulas(next);
    setDesc('');
    setExpr('');
    setInsertOpen(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const next = formulas.filter((f) => f.id !== deleteId);
    setDeleteId(null);
    await persistFormulas(next);
  };

  return (
    <>
      <InventoryModuleHeader projectName={project?.nome} section="Fórmulas" />
      <div className="border-b bg-muted/20 px-3 py-2 md:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <Dialog open={insertOpen} onOpenChange={setInsertOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className={inventoryActionButtonClass('insert')} disabled={saving}>
                <Plus className="mr-2 h-4 w-4" />
                Inserir
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova fórmula</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="space-y-1">
                  <Label htmlFor="nf-desc">Descrição</Label>
                  <Input id="nf-desc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ex.: Volume Schumaker-Hall" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="nf-expr">Expressão</Label>
                  <Input
                    id="nf-expr"
                    value={expr}
                    onChange={(e) => setExpr(e.target.value)}
                    placeholder="Ex.: PI * (D^2) * HT / 40000"
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setInsertOpen(false)}>
                  Cancelar
                </Button>
                <Button type="button" onClick={() => void handleInsert()} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" disabled title="Em breve">
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button variant="outline" size="sm" disabled title="Em breve">
            <Replace className="mr-2 h-4 w-4" />
            Transferir
          </Button>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            Importar
          </Button>
        </div>
      </div>
      <ImportFormulasDialog open={importOpen} onOpenChange={setImportOpen} projectId={projectId} />
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fórmula?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser anulada.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <main className="flex-1 overflow-auto">
        <div className="relative">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Expressão</TableHead>
                <TableHead>Ativa</TableHead>
                <TableHead>Dados de</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formulas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                    Nenhuma fórmula. Use Inserir ou Importar.
                  </TableCell>
                </TableRow>
              ) : (
                formulas.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>{f.descricao}</TableCell>
                    <TableCell className="max-w-md font-mono text-xs">{f.expressao}</TableCell>
                    <TableCell>{f.ativa === false ? 'Não' : 'Sim'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{f.dadosDe ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setDeleteId(f.id)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </>
  );
}
