'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Plus,
  Search,
  Trash,
  Split,
  Paperclip,
  ChevronDown
} from 'lucide-react';
import { useDoc, useFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { InventoryProject } from '@/lib/types';
import { InventoryModuleHeader, inventoryActionButtonClass } from '../inventory-module-chrome';
import { PlotGroupsDialog } from './plot-groups-dialog';

export default function PlotsPage() {
  const params = useParams();
  const projectId = (params?.id as string | undefined) ?? '';
  const { firestore } = useFirebase();
  const [groupsOpen, setGroupsOpen] = React.useState(false);

  const projectDocRef = React.useMemo(() => {
    if (!firestore || !projectId) return null;
    return doc(firestore, 'inventories', projectId);
  }, [firestore, projectId]);

  const { data: project } = useDoc<InventoryProject>(projectDocRef);

  return (
    <>
      <InventoryModuleHeader projectName={project?.nome} section="Parcelas">
        <div className="relative w-full min-w-[200px] max-w-xs sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar…" className="pl-9" aria-label="Buscar parcelas" />
        </div>
      </InventoryModuleHeader>
      <div className="border-b bg-muted/20 px-3 py-2 md:px-4">
        <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" className={inventoryActionButtonClass('insert')}>
              <Plus className="mr-2 h-4 w-4"/>Inserir
            </Button>
            <Button variant="outline" size="sm" className={inventoryActionButtonClass('delete')}>
              <Trash className="mr-2 h-4 w-4"/>Excluir
            </Button>
            <Button variant="outline" size="sm" onClick={() => setGroupsOpen(true)}>
              <Split className="mr-2 h-4 w-4"/>Grupos
            </Button>
            <Button variant="outline" size="sm"><Paperclip className="mr-2 h-4 w-4"/>Atributos</Button>
            <Button variant="outline" size="sm">Pré-encher <ChevronDown className="ml-2 h-4 w-4"/></Button>
            <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4"/>Colunas</Button>
        </div>
      </div>
      <PlotGroupsDialog open={groupsOpen} onOpenChange={setGroupsOpen} projectId={projectId} />
      <main className="flex-1 overflow-auto">
        <div className="relative">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead className="w-[40px]"><Checkbox /></TableHead>
                    <TableHead>Parc...</TableHead>
                    <TableHead>Área (m²)</TableHead>
                    <TableHead>Código Unid...</TableHead>
                    <TableHead>Nível de Incl.</TableHead>
                    <TableHead>Reg...</TableHead>
                    <TableHead>Estrato</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Largura</TableHead>
                    <TableHead>comprimento</TableHead>
                    <TableHead>Latitude 1</TableHead>
                    <TableHead>Longitude 1</TableHead>
                    <TableHead>Latitude 2</TableHead>
                    <TableHead>Longitude 2</TableHead>
                    <TableHead>Declive</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell colSpan={15} className="h-48 text-center">
                            Nenhuma parcela foi cadastrada.
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
      </main>
      <footer className="flex items-center justify-end gap-6 p-2 border-t text-sm text-muted-foreground">
        <span>0 até 0 de 0</span>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>Página 0 de 0</span>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                <ChevronRight className="h-4 w-4" />
            </Button>
             <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                <ChevronsRight className="h-4 w-4" />
            </Button>
        </div>
      </footer>
    </>
  );
}
