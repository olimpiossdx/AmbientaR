"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Pencil,
  Paperclip,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Empreendedor } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CardSearchInput } from "@/components/card-search-input";
import { usePortalEmpreendedorIds } from "@/hooks/use-portal-empreendedor-ids";
import { sortByNamePt } from "@/lib/sort-pt-br";
import {
  canManageCtfIbamaDocs,
  cartaoStatus,
  certificadoStatus,
  formatCtfDateBr,
  isCtfCertificadoVencido,
  isCtfPendente,
  matchesCtfListFilter,
  type CtfListFilter,
} from "@/lib/ctf-ibama-utils";
import { isClientePortalRole } from "@/lib/role-guards";
import { CtfIbamaForm } from "./ctf-ibama-form";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { AttachmentPreviewSection } from "@/components/shared/attachment-preview-section";
import { CtfIbamaDetailSection } from "@/components/ctf-ibama/ctf-ibama-detail-section";

const FILTER_OPTIONS: { id: CtfListFilter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "pendentes", label: "Pendentes" },
  { id: "vencidos", label: "Vencidos" },
  { id: "validos", label: "Em dia" },
];

export function CtfIbamaListView() {
  const { firestore, user } = useFirebase();
  const portalEmpreendedorIds = usePortalEmpreendedorIds();
  const canWrite = canManageCtfIbamaDocs(user?.role);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [listFilter, setListFilter] = React.useState<CtfListFilter>("todos");
  const [editingEmpreendedor, setEditingEmpreendedor] =
    React.useState<Empreendedor | null>(null);
  const [viewingEmpreendedor, setViewingEmpreendedor] =
    React.useState<Empreendedor | null>(null);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isViewOpen, setIsViewOpen] = React.useState(false);

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "empreendedores") : null),
    [firestore],
  );
  const { data: empreendedoresRaw, isLoading } =
    useCollection<Empreendedor>(empreendedoresQuery);

  const empreendedores = React.useMemo(() => {
    if (!empreendedoresRaw) return undefined;
    if (portalEmpreendedorIds === undefined) return undefined;
    if (portalEmpreendedorIds.length === 0) return empreendedoresRaw;
    if (portalEmpreendedorIds[0] === "invalid-placeholder") return [];
    return empreendedoresRaw.filter((e) => portalEmpreendedorIds.includes(e.id));
  }, [empreendedoresRaw, portalEmpreendedorIds]);

  const sortedEmpreendedores = React.useMemo(
    () => sortByNamePt(empreendedores ?? []),
    [empreendedores],
  );

  const stats = React.useMemo(() => {
    const list = sortedEmpreendedores;
    return {
      total: list.length,
      pendentes: list.filter(isCtfPendente).length,
      vencidos: list.filter(isCtfCertificadoVencido).length,
      validos: list.filter(
        (e) => !isCtfPendente(e) && !isCtfCertificadoVencido(e),
      ).length,
    };
  }, [sortedEmpreendedores]);

  const filteredEmpreendedores = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return sortedEmpreendedores.filter((emp) => {
      if (!matchesCtfListFilter(emp, listFilter)) return false;
      if (!term) return true;
      const haystack = [
        emp.name,
        emp.cpfCnpj,
        emp.ctfIbama,
        emp.municipio,
        emp.uf,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [sortedEmpreendedores, searchTerm, listFilter]);

  const handleEdit = (emp: Empreendedor) => {
    setEditingEmpreendedor(emp);
    setIsFormOpen(true);
  };

  const handleView = (emp: Empreendedor) => {
    setViewingEmpreendedor(emp);
    setIsViewOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingEmpreendedor(null);
  };

  const openPortalIbama = () => {
    window.open("https://servicos.ibama.gov.br/ctf/", "_blank", "noopener,noreferrer");
  };

  const loading =
    isLoading || (isClientePortalRole(user?.role) && portalEmpreendedorIds === undefined);

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="CTF/IBAMA">
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={openPortalIbama}
          >
            <ShieldCheck className="h-4 w-4" />
            Portal IBAMA
          </Button>
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <ShieldCheck className="h-8 w-8 text-primary shrink-0" />
                <div>
                  <p className="text-2xl font-semibold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Empreendedores</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <FileWarning className="h-8 w-8 text-amber-600 shrink-0" />
                <div>
                  <p className="text-2xl font-semibold">{stats.pendentes}</p>
                  <p className="text-xs text-muted-foreground">Documentos pendentes</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-red-600 shrink-0" />
                <div>
                  <p className="text-2xl font-semibold">{stats.vencidos}</p>
                  <p className="text-xs text-muted-foreground">Certificados vencidos</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-2xl font-semibold">{stats.validos}</p>
                  <p className="text-xs text-muted-foreground">Em dia</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cadastro e Certificado de Regularidade</CardTitle>
              <CardDescription>
                Carregue o Cart├úo de Cadastro CTF/IBAMA e mantenha atualizado o
                Certificado de Regularidade de cada empreendedor (cliente).
              </CardDescription>
              <div className="flex flex-wrap gap-2 pt-1">
                {FILTER_OPTIONS.map((opt) => (
                  <Button
                    key={opt.id}
                    type="button"
                    size="sm"
                    variant={listFilter === opt.id ? "default" : "outline"}
                    onClick={() => setListFilter(opt.id)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              <CardSearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar empreendedor, CPF/CNPJ ou n┬║ CTF..."
              />
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="space-y-4">
                  {loading &&
                    Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-28 w-full rounded-lg" />
                    ))}
                  {!loading && filteredEmpreendedores.length === 0 && (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      Nenhum empreendedor encontrado com o filtro selecionado.
                    </p>
                  )}
                  {!loading &&
                    filteredEmpreendedores.map((emp) => {
                      const cartao = cartaoStatus(emp);
                      const cert = certificadoStatus(emp);
                      return (
                        <Card
                          key={emp.id}
                          className={cn(
                            "overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md",
                            isCtfCertificadoVencido(emp) && "border-red-500/40",
                          )}
                        >
                          <CardContent className="p-4 sm:p-5">
                            <div className="flex flex-col gap-4">
                              <div className="min-w-0 space-y-2">
                                <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                                  {emp.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {emp.cpfCnpj || "ÔÇö"}
                                  {emp.municipio
                                    ? ` ┬À ${emp.municipio}${emp.uf ? `/${emp.uf}` : ""}`
                                    : ""}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  CTF/IBAMA: {emp.ctfIbama?.trim() || "N├úo informado"}
                                  {emp.ctfIbamaCertificadoValidade
                                    ? ` ┬À Validade: ${formatCtfDateBr(emp.ctfIbamaCertificadoValidade)}`
                                    : ""}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  <Badge
                                    variant="outline"
                                    className={cn("w-fit", cartao.className)}
                                  >
                                    {cartao.label}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={cn("w-fit", cert.className)}
                                  >
                                    {cert.label}
                                  </Badge>
                                </div>
                              </div>
                              <Separator className="bg-border/60" />
                              <div className="flex flex-wrap items-center gap-1">
                                {emp.ctfIbamaCartaoUrl?.trim() && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-9 gap-1 shrink-0"
                                        type="button"
                                        onClick={() =>
                                          window.open(
                                            emp.ctfIbamaCartaoUrl!,
                                            "_blank",
                                            "noopener,noreferrer",
                                          )
                                        }
                                      >
                                        <Paperclip className="h-4 w-4" />
                                        <span className="hidden sm:inline">Cart├úo</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Abrir cart├úo de cadastro</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                {emp.ctfIbamaCertificadoUrl?.trim() && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-9 gap-1 shrink-0"
                                        type="button"
                                        onClick={() =>
                                          window.open(
                                            emp.ctfIbamaCertificadoUrl!,
                                            "_blank",
                                            "noopener,noreferrer",
                                          )
                                        }
                                      >
                                        <Paperclip className="h-4 w-4" />
                                        <span className="hidden sm:inline">Certificado</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Abrir certificado de regularidade</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0"
                                      type="button"
                                      onClick={() => handleView(emp)}
                                    >
                                      <Eye className="h-4 w-4" />
                                      <span className="sr-only">Visualizar</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Visualizar documentos</p>
                                  </TooltipContent>
                                </Tooltip>
                                {canWrite && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 shrink-0"
                                        type="button"
                                        onClick={() => handleEdit(emp)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                        <span className="sr-only">Gerenciar</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>
                                        {emp.ctfIbamaCertificadoUrl
                                          ? "Atualizar documentos"
                                          : "Carregar documentos"}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
          {editingEmpreendedor && (
            <CtfIbamaForm
              empreendedor={editingEmpreendedor}
              canWrite={canWrite}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsFormOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewingEmpreendedor
                ? `CTF/IBAMA ÔÇö ${viewingEmpreendedor.name}`
                : "CTF/IBAMA"}
            </DialogTitle>
            <DialogDescription>
              Cart├úo de Cadastro e Certificado de Regularidade vinculados ao empreendedor.
            </DialogDescription>
          </DialogHeader>
          {viewingEmpreendedor && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Empreendedor</Label>
                  <p className="text-sm text-muted-foreground">
                    {viewingEmpreendedor.name}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">CPF/CNPJ</Label>
                  <p className="text-sm text-muted-foreground">
                    {viewingEmpreendedor.cpfCnpj || "N├úo informado"}
                  </p>
                </div>
              </div>
              <CtfIbamaDetailSection entity={viewingEmpreendedor} showManageLink={false} />
              <AttachmentPreviewSection
                fileUrl={viewingEmpreendedor.ctfIbamaCartaoUrl}
                emptyLabel="Cart├úo de cadastro n├úo enviado."
                sectionLabel="Cart├úo de Cadastro"
                zoomTitle="Cart├úo de Cadastro CTF/IBAMA"
              />
              <AttachmentPreviewSection
                fileUrl={viewingEmpreendedor.ctfIbamaCertificadoUrl}
                emptyLabel="Certificado de regularidade n├úo enviado."
                sectionLabel="Certificado de Regularidade"
                zoomTitle="Certificado de Regularidade CTF/IBAMA"
              />
              {canWrite && (
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setIsViewOpen(false);
                    handleEdit(viewingEmpreendedor);
                  }}
                >
                  Gerenciar documentos
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
