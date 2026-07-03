"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from "@/firebase";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import type { Client, Empreendedor } from "@/lib/types";
import { formatCpfCnpjDisplay } from "@/lib/masks";
import { Loader2 } from "lucide-react";
import {
  buildMergePlanForGroup,
  findDuplicateClientGroups,
  pickCanonicalClientId,
  type ClientDuplicateGroup,
  type ClientRecord,
  type MergeClientGroupPlan,
} from "@/lib/client-duplicate-merge";
import {
  deleteClientDocuments,
  repointClientIdReferences,
} from "@/lib/merge-client-references-firestore";
import { DuplicateMergePreview } from "@/components/shared/duplicate-merge-preview";

type ClientDuplicatesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMerged?: () => void;
};

export function ClientDuplicatesDialog({
  open,
  onOpenChange,
  onMerged,
}: ClientDuplicatesDialogProps) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [merging, setMerging] = React.useState(false);
  const [groups, setGroups] = React.useState<ClientDuplicateGroup[]>([]);
  const [clientsById, setClientsById] = React.useState<
    Map<string, ClientRecord>
  >(new Map());
  const [empreendedores, setEmpreendedores] = React.useState<
    Array<Partial<Empreendedor> & { id: string }>
  >([]);

  const loadDuplicates = React.useCallback(async () => {
    if (!firestore) return;
    setLoading(true);
    try {
      const [clientsSnap, empreendedoresSnap] = await Promise.all([
        getDocs(collection(firestore, "clients")),
        getDocs(collection(firestore, "empreendedores")),
      ]);
      const clients: ClientRecord[] = clientsSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Partial<Client>),
      }));
      const emps = empreendedoresSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Partial<Empreendedor>),
      }));
      setClientsById(new Map(clients.map((c) => [c.id, c])));
      setEmpreendedores(emps);
      setGroups(findDuplicateClientGroups(clients));
    } catch {
      toast({
        variant: "destructive",
        title: "Erro ao carregar duplicatas",
        description: "Não foi possível listar clientes duplicados por CPF/CNPJ.",
      });
    } finally {
      setLoading(false);
    }
  }, [firestore, toast]);

  React.useEffect(() => {
    if (open) void loadDuplicates();
  }, [open, loadDuplicates]);

  const recordNamesById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const [id, rec] of clientsById) {
      map.set(id, rec.name || id);
    }
    return map;
  }, [clientsById]);

  const executeMergePlans = async (
    plans: MergeClientGroupPlan[],
  ): Promise<{
    groupsMerged: number;
    clientsRemoved: number;
    referencesUpdated: number;
  }> => {
    if (!firestore) {
      return { groupsMerged: 0, clientsRemoved: 0, referencesUpdated: 0 };
    }

    let groupsMerged = 0;
    let clientsRemoved = 0;
    let referencesUpdated = 0;

    for (const plan of plans) {
      await setDoc(
        doc(firestore, "clients", plan.canonicalId),
        plan.mergedPayload,
        { merge: true },
      );

      for (const dupId of plan.duplicateIds) {
        const { documentsUpdated } = await repointClientIdReferences(
          firestore,
          dupId,
          plan.canonicalId,
        );
        referencesUpdated += documentsUpdated;
      }

      await deleteClientDocuments(firestore, plan.duplicateIds);
      groupsMerged += 1;
      clientsRemoved += plan.duplicateIds.length;
    }

    return { groupsMerged, clientsRemoved, referencesUpdated };
  };

  const handleMergeGroup = async (group: ClientDuplicateGroup) => {
    if (!firestore) return;
    const plan = buildMergePlanForGroup(group, clientsById, empreendedores);
    if (!plan) return;

    setMerging(true);
    try {
      const stats = await executeMergePlans([plan]);
      toast({
        title: "Duplicatas fundidas",
        description: `Mantido «${clientsById.get(plan.canonicalId)?.name || plan.canonicalId}» — ${stats.clientsRemoved} cadastro(s) removido(s), ${stats.referencesUpdated} referência(s) atualizada(s).`,
      });
      await loadDuplicates();
      onMerged?.();
    } catch {
      toast({
        variant: "destructive",
        title: "Falha ao fundir",
        description:
          "Não foi possível concluir a fusão. Verifique permissões e tente novamente.",
      });
    } finally {
      setMerging(false);
    }
  };

  const handleMergeAll = async () => {
    if (!firestore || groups.length === 0) return;
    const plans = groups
      .map((g) => buildMergePlanForGroup(g, clientsById, empreendedores))
      .filter((p): p is MergeClientGroupPlan => Boolean(p));
    if (plans.length === 0) return;

    setMerging(true);
    try {
      const stats = await executeMergePlans(plans);
      toast({
        title: "Fusão em lote concluída",
        description: `${stats.groupsMerged} grupo(s), ${stats.clientsRemoved} cadastro(s) removido(s), ${stats.referencesUpdated} referência(s) atualizada(s).`,
      });
      await loadDuplicates();
      onMerged?.();
    } catch {
      toast({
        variant: "destructive",
        title: "Falha na fusão em lote",
        description:
          "Alguns grupos podem não ter sido processados. Recarregue a lista e tente novamente.",
      });
    } finally {
      setMerging(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Duplicatas por CPF/CNPJ</DialogTitle>
          <DialogDescription>
            Clientes com o mesmo documento cadastrado mais de uma vez. A fusão
            mantém um cadastro canônico, atualiza faturas, propostas, contratos
            e outros vínculos, e remove os documentos duplicados.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 max-h-[50vh] rounded-md border p-3">
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          )}
          {!loading && groups.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma duplicata encontrada por CPF/CNPJ.
            </p>
          )}
          {!loading &&
            groups.map((group) => {
              const canonicalId = pickCanonicalClientId(
                group.clientIds,
                clientsById,
                empreendedores,
              );
              const plan = buildMergePlanForGroup(
                group,
                clientsById,
                empreendedores,
              );
              const canonicalName =
                clientsById.get(canonicalId)?.name || canonicalId;
              return (
                <div
                  key={group.documentDigits}
                  className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 py-3 border-b last:border-0"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-medium">
                      {formatCpfCnpjDisplay(group.displayDocument) ||
                        group.displayDocument}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {group.clientIds.length} cadastros — manter:{" "}
                      <span className="font-medium">{canonicalName}</span>
                    </p>
                    <ul className="text-xs text-muted-foreground list-disc pl-4">
                      {group.clientIds.map((id) => (
                        <li key={id}>
                          {clientsById.get(id)?.name || "Sem nome"}
                          {id === canonicalId ? " (canônico)" : ""}
                        </li>
                      ))}
                    </ul>
                    {plan && (
                      <DuplicateMergePreview
                        rows={plan.previewRows}
                        recordNamesById={recordNamesById}
                      />
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="shrink-0"
                    disabled={merging}
                    onClick={() => void handleMergeGroup(group)}
                  >
                    Fundir grupo
                  </Button>
                </div>
              );
            })}
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={merging}
          >
            Fechar
          </Button>
          <Button
            onClick={() => void handleMergeAll()}
            disabled={merging || loading || groups.length === 0}
          >
            {merging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Fundir todos ({groups.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
