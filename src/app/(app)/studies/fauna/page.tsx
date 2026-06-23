"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PlusCircle,
  ChevronDown,
  Pencil,
  CheckCircle,
  ExternalLink,
  FileText,
  Trash2,
} from "lucide-react";
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
  useAuth,
} from "@/firebase";
import { collection, doc, deleteDoc, updateDoc } from "firebase/firestore";
import type { FaunaStudy, Empreendedor } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { handleFirestoreFormError } from "@/lib/firestore-form-errors";
import { isAdminOrSupervisorRole } from "@/lib/role-guards";
import { FaunaExportIconButtons } from "@/components/fauna/fauna-export-icon-buttons";
import {
  FAUNA_STUDY_ADD_ACTIONS,
  getFaunaRelatorioCreatePathFromProjeto,
  getFaunaStudyEditPath,
  getFaunaStudyLabel,
  isFaunaProjetoStudyType,
} from "@/lib/fauna-study-utils";

function getSortDateValue(value: unknown) {
  if (!value) return 0;
  if (typeof value === "string") {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().getTime();
  }
  return 0;
}

function StudyRowActions({
  study,
  onEdit,
  onComplete,
  onDelete,
  canDelete,
  showComplete,
}: {
  study: FaunaStudy;
  onEdit: (s: FaunaStudy) => void;
  onComplete: (s: FaunaStudy) => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
  showComplete?: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-1 flex-wrap">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => onEdit(study)}
            aria-label="Editar"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Editar</TooltipContent>
      </Tooltip>
      <FaunaExportIconButtons study={study} />
      {isFaunaProjetoStudyType(study.studyType) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" asChild>
              <Link
                href={getFaunaRelatorioCreatePathFromProjeto(study)!}
                aria-label="Elaborar relatório"
              >
                <FileText className="h-4 w-4 text-primary" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Elaborar relatório a partir deste projeto</TooltipContent>
        </Tooltip>
      )}
      {showComplete && study.status !== "completed" && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => onComplete(study)}
              aria-label="Concluir"
            >
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Concluir e publicar em Documentos Ambientais
          </TooltipContent>
        </Tooltip>
      )}
      {study.status === "completed" && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" asChild>
              <Link href="/fauna" aria-label="Ver no portal do cliente">
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ver em Documentos Ambientais</TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
              type="button"
              disabled={!canDelete}
              onClick={() => onDelete(study.id)}
              aria-label="Excluir"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Excluir estudo</TooltipContent>
      </Tooltip>
    </div>
  );
}

function StudyTable({
  items,
  loading,
  empreendedorMap,
  onEdit,
  onComplete,
  onDelete,
  canDeleteStudy,
  showComplete,
  emptyMessage,
}: {
  items: FaunaStudy[];
  loading: boolean;
  empreendedorMap: Map<string, string>;
  onEdit: (s: FaunaStudy) => void;
  onComplete: (s: FaunaStudy) => void;
  onDelete: (id: string) => void;
  canDeleteStudy: (study: FaunaStudy) => boolean;
  showComplete?: boolean;
  emptyMessage: string;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Empreendedor</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead className="hidden lg:table-cell">Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading &&
          Array.from({ length: 2 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-5 w-40" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-48" />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <Skeleton className="h-6 w-24 rounded-full" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-8 w-32 ml-auto" />
              </TableCell>
            </TableRow>
          ))}
        {!loading &&
          items.map((study) => (
            <TableRow key={study.id}>
              <TableCell className="font-medium">
                {empreendedorMap.get(study.empreendedorId) || "—"}
              </TableCell>
              <TableCell>{getFaunaStudyLabel(study)}</TableCell>
              <TableCell className="hidden lg:table-cell">
                <Badge
                  variant="outline"
                  className={cn(
                    study.status === "completed"
                      ? "bg-emerald-500/20 text-emerald-700 border-emerald-500/30"
                      : "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
                  )}
                >
                  {study.status === "completed" ? "Concluído" : "Rascunho"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <StudyRowActions
                  study={study}
                  onEdit={onEdit}
                  onComplete={onComplete}
                  onDelete={onDelete}
                  canDelete={canDeleteStudy(study)}
                  showComplete={showComplete}
                />
              </TableCell>
            </TableRow>
          ))}
        {!loading && items.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={4}
              className="h-24 text-center text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export default function StudiesFaunaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user } = useAuth();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const studiesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "faunaStudies") : null),
    [firestore],
  );
  const { data: studies, isLoading } = useCollection<FaunaStudy>(studiesQuery);

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "empreendedores") : null),
    [firestore],
  );
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } =
    useCollection<Empreendedor>(empreendedoresQuery);

  const empreendedorMap = useMemo(
    () => new Map(empreendedores?.map((e) => [e.id, e.name]) ?? []),
    [empreendedores],
  );

  const internalStudies = useMemo(
    () => (studies ?? []).filter((s) => s.studyType !== "externo"),
    [studies],
  );

  const { draftStudies, completedStudies } = useMemo(() => {
    const sorted = [...internalStudies].sort(
      (a, b) => getSortDateValue(b.createdAt) - getSortDateValue(a.createdAt),
    );
    return {
      draftStudies: sorted.filter((s) => s.status !== "completed"),
      completedStudies: sorted.filter((s) => s.status === "completed"),
    };
  }, [internalStudies]);

  const canDeleteStudy = (study: FaunaStudy) => {
    if (!user) return false;
    if (isAdminOrSupervisorRole(user.role)) return true;
    if (study.status !== "completed") return true;
    return false;
  };

  const handleEdit = (study: FaunaStudy) => {
    router.push(getFaunaStudyEditPath(study));
  };

  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsAlertOpen(true);
  };

  const handleDelete = () => {
    if (!firestore || !itemToDelete) return;
    const docRef = doc(firestore, "faunaStudies", itemToDelete);
    deleteDoc(docRef)
      .then(() => {
        toast({
          title: "Estudo excluído",
          description: "O documento foi removido com sucesso.",
        });
      })
      .catch((serverError) =>
        handleFirestoreFormError(serverError, {
          toast,
          title: "Erro ao excluir estudo",
          context: { path: docRef.path, operation: "delete" },
        }),
      )
      .finally(() => {
        setIsAlertOpen(false);
        setItemToDelete(null);
      });
  };

  const handleComplete = async (study: FaunaStudy) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, "faunaStudies", study.id), {
        status: "completed",
      });
      toast({
        title: "Estudo concluído",
        description:
          "O documento ficará disponível em Documentos Ambientais → Fauna para o cliente.",
      });
    } catch (serverError) {
      handleFirestoreFormError(serverError, {
        toast,
        title: "Erro ao concluir estudo",
        context: {
          path: `faunaStudies/${study.id}`,
          operation: "update",
        },
      });
    }
  };

  const loading = isLoading || isLoadingEmpreendedores;

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Estudos de Fauna">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                Novo estudo
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Tipo de documento</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {FAUNA_STUDY_ADD_ACTIONS.map((action) => (
                <DropdownMenuItem
                  key={action.href}
                  onClick={() => router.push(action.href)}
                >
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Em elaboração</CardTitle>
              <CardDescription>
                Rascunhos da equipe técnica. Ao concluir, o documento passa a
                aparecer em Documentos Ambientais → Fauna.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <StudyTable
                  items={draftStudies}
                  loading={loading}
                  empreendedorMap={empreendedorMap}
                  onEdit={handleEdit}
                  onComplete={handleComplete}
                  onDelete={openDeleteConfirm}
                  canDeleteStudy={canDeleteStudy}
                  showComplete
                  emptyMessage="Nenhum estudo em elaboração."
                />
              </TooltipProvider>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Concluídos pela consultoria</CardTitle>
              <CardDescription>
                Estudos finalizados, visíveis no portal do cliente em Fauna.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <StudyTable
                  items={completedStudies}
                  loading={loading}
                  empreendedorMap={empreendedorMap}
                  onEdit={handleEdit}
                  onComplete={handleComplete}
                  onDelete={openDeleteConfirm}
                  canDeleteStudy={canDeleteStudy}
                  emptyMessage="Nenhum estudo concluído ainda."
                />
              </TooltipProvider>
            </CardContent>
          </Card>
        </main>
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir estudo de fauna?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O documento será removido
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
