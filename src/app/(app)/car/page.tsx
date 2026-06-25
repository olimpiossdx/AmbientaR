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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import { handleFirestoreFormError } from "@/lib/firestore-form-errors";
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
  useAuth,
} from "@/firebase";
import {
  collection,
  doc,
  documentId,
  updateDoc,
  deleteField,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import type { CarStoredFile, Client, Project } from "@/lib/types";
import { sortByPropertyNamePt } from "@/lib/sort-pt-br";
import { Skeleton } from "@/components/ui/skeleton";
import { UploadPreparationDialog } from "@/components/shared/upload-preparation-dialog";
import { useCarFileUpload } from "@/hooks/use-car-file-upload";
import { Upload } from "lucide-react";
import { resolvePortalAuthUid } from "@/lib/auth-user-id";
import {
  canManageCarRecord,
  canManageCarUploadsOnProject,
  isClienteAutonomo,
  isClientePortalRole,
  isConsultorRepresentante,
  isRepresentativeLikePortalRole,
} from "@/lib/role-guards";
import { fetchEmpreendedorIdsForPortalScope } from "@/lib/portal-empreendedor-scope";
import { NOTIFICATION_LINKS, NOTIFICATION_SOURCE } from "@/lib/notification-events";
import { notifyProjectPortalUsers } from "@/lib/notifications";
import { filterProjectsForClientCpfCnpj } from "@/lib/empreendedor-project-select";
import { EmpreendedorProjectFilter } from "@/components/documentos-ambientais/empreendedor-project-filter";
import { isEmpreendedorScopedPortalRole } from "@/lib/portal-empreendedor-scope";
import type { Empreendedor } from "@/lib/types";
import { CarFileUploadZone } from "@/components/documentos-ambientais/car-file-upload-zone";
import { CarRecordCard } from "@/components/documentos-ambientais/car-record-card";
import { CarEditDialog } from "@/components/documentos-ambientais/car-edit-dialog";
import { buildCarPayload } from "@/lib/car/car-files";
import type { CarUploadKind } from "@/hooks/use-car-file-upload";

export default function CarPage() {
  const { firestore } = useFirebase();
  const { user } = useAuth();
  const { toast } = useToast();
  const { uploadCarFiles, dialogProps, limitLabel } = useCarFileUpload();
  const canManageCar = canManageCarUploadsOnProject(user?.role);
  const canDownloadCar = canManageCarRecord(user?.role);

  const [clientId, setClientId] = React.useState("");
  const [projectId, setProjectId] = React.useState("");
  const [receiptNumber, setReceiptNumber] = React.useState("");
  const [pdfFiles, setPdfFiles] = React.useState<CarStoredFile[]>([]);
  const [geometryFiles, setGeometryFiles] = React.useState<CarStoredFile[]>([]);
  const [uploadingPdf, setUploadingPdf] = React.useState(false);
  const [uploadingGeometry, setUploadingGeometry] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [fallbackClients, setFallbackClients] = React.useState<Client[] | null>(
    null,
  );
  const [empreendedorIdsForRep, setEmpreendedorIdsForRep] = React.useState<
    string[] | undefined
  >(undefined);
  const [empreendedoresForRep, setEmpreendedoresForRep] = React.useState<
    Array<{ id: string; cpfCnpj?: string }>
  >([]);
  const [empreendedorIdsForTitular, setEmpreendedorIdsForTitular] = React.useState<
    string[] | undefined
  >(undefined);
  const [listFilterEmpreendedorId, setListFilterEmpreendedorId] = React.useState("");
  const [listFilterProjectId, setListFilterProjectId] = React.useState("");
  const [editingProject, setEditingProject] = React.useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = React.useState<Project | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const portalUid = resolvePortalAuthUid(user);

  const clientsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    if (isRepresentativeLikePortalRole(user.role)) {
      if (!portalUid) return null;
      const approvedField = isConsultorRepresentante(user.role)
        ? "approvedConsultorIds"
        : "approvedUserIds";
      return query(
        collection(firestore, "clients"),
        where(approvedField, "array-contains", portalUid),
      );
    }
    if (isClienteAutonomo(user.role)) {
      if (!portalUid) return null;
      return query(
        collection(firestore, "clients"),
        where("userId", "==", portalUid),
      );
    }
    return collection(firestore, "clients");
  }, [firestore, user, portalUid]);

  const { data: clients, isLoading: loadingClients } =
    useCollection<Client>(clientsQuery);

  React.useEffect(() => {
    if (!firestore || !user || !isRepresentativeLikePortalRole(user.role) || loadingClients)
      return;
    if (clients && clients.length > 0) {
      setFallbackClients(null);
      return;
    }
    const repUid = user.id ?? (user as { uid?: string }).uid;
    const accessRequestsRef = collection(firestore, "access_requests");
    const clientsRef = collection(firestore, "clients");
    const qApproved = query(
      accessRequestsRef,
      where("status", "==", "approved"),
      where("requestedByUserId", "==", repUid),
    );
    getDocs(qApproved)
      .then((snap) => {
        const docs =
          user.role === "consultor_representante"
            ? snap.docs.filter(
                (d) =>
                  (d.data() as { requestType?: string }).requestType ===
                  "consultor_representante",
              )
            : snap.docs;
        if (docs.length === 0) {
          setFallbackClients([]);
          return;
        }
        const cpfs = new Set<string>();
        docs.forEach((d) => {
          const cpf = (d.data().cpfOfInterested || "").trim();
          const digits = cpf.replace(/\D/g, "");
          if (digits.length >= 11) {
            cpfs.add(cpf);
            cpfs.add(digits);
          }
        });
        const cpfList = Array.from(cpfs).slice(0, 10);
        if (cpfList.length === 0) {
          setFallbackClients([]);
          return;
        }
        const qClients = query(clientsRef, where("cpfCnpj", "in", cpfList));
        getDocs(qClients)
          .then((snapC) => {
            const list: Client[] = snapC.docs.map(
              (d) => ({ id: d.id, ...d.data() }) as Client,
            );
            setFallbackClients(list);
          })
          .catch(() => setFallbackClients([]));
      })
      .catch(() => setFallbackClients([]));
  }, [firestore, user, loadingClients, clients]);

  React.useEffect(() => {
    if (!firestore || !user || !isClientePortalRole(user.role)) return;
    setEmpreendedorIdsForTitular(undefined);
    const userDocuments = [
      user.cpf || user.userCpf,
      ...(user.cnpjs || []),
    ].filter(Boolean) as string[];
    if (userDocuments.length === 0) {
      setEmpreendedorIdsForTitular(["invalid-placeholder-for-empty-query"]);
      return;
    }
    const empreendedoresRef = collection(firestore, "empreendedores");
    const q = query(empreendedoresRef, where("cpfCnpj", "in", userDocuments));
    getDocs(q)
      .then((snapshot) => {
        const ids = snapshot.docs.map((d) => d.id);
        setEmpreendedorIdsForTitular(
          ids.length > 0 ? ids : ["invalid-placeholder-for-empty-query"],
        );
      })
      .catch((err) => {
        console.error("Erro ao carregar empreendedores do titular (CAR):", err);
        setEmpreendedorIdsForTitular(["invalid-placeholder-for-empty-query"]);
      });
  }, [firestore, user]);

  const displayedClients = React.useMemo(
    () => (clients && clients.length > 0 ? clients : (fallbackClients ?? [])),
    [clients, fallbackClients],
  );

  React.useEffect(() => {
    if (!firestore || !user || !isRepresentativeLikePortalRole(user.role)) return;
    setEmpreendedorIdsForRep(undefined);
    fetchEmpreendedorIdsForPortalScope(firestore, user)
      .then(async (ids) => {
        const validIds = ids.filter((id) => id !== "invalid-placeholder");
        setEmpreendedorIdsForRep(validIds);
        if (validIds.length === 0) {
          setEmpreendedoresForRep([]);
          return;
        }
        const empreendedoresRef = collection(firestore, "empreendedores");
        const snap = await getDocs(
          query(
            empreendedoresRef,
            where(documentId(), "in", validIds.slice(0, 10)),
          ),
        );
        setEmpreendedoresForRep(
          snap.docs.map((d) => ({
            id: d.id,
            cpfCnpj: d.data().cpfCnpj as string | undefined,
          })),
        );
      })
      .catch(() => {
        setEmpreendedorIdsForRep([]);
        setEmpreendedoresForRep([]);
      });
  }, [firestore, user]);

  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    if (isClientePortalRole(user.role)) {
      if (empreendedorIdsForTitular === undefined) return null;
      if (empreendedorIdsForTitular.length === 0) {
        return query(
          collection(firestore, "projects"),
          where("empreendedorId", "in", ["invalid-placeholder"]),
        );
      }
      return query(
        collection(firestore, "projects"),
        where(
          "empreendedorId",
          "in",
          empreendedorIdsForTitular.slice(0, 10),
        ),
      );
    }
    if (isRepresentativeLikePortalRole(user.role)) {
      if (empreendedorIdsForRep === undefined) return null;
      if (empreendedorIdsForRep.length === 0) {
        return query(
          collection(firestore, "projects"),
          where("empreendedorId", "==", "__none__"),
        );
      }
      return query(
        collection(firestore, "projects"),
        where("empreendedorId", "in", empreendedorIdsForRep.slice(0, 10)),
      );
    }
    return collection(firestore, "projects");
  }, [firestore, user, empreendedorIdsForRep, empreendedorIdsForTitular]);

  const { data: projects, isLoading: loadingProjects } =
    useCollection<Project>(projectsQuery);

  const empreendedoresStaffQuery = useMemoFirebase(() => {
    if (!firestore || !user || isRepresentativeLikePortalRole(user.role)) {
      return null;
    }
    return collection(firestore, "empreendedores");
  }, [firestore, user]);

  const { data: empreendedoresStaff } = useCollection<Empreendedor>(
    empreendedoresStaffQuery,
  );

  const clientsMap = React.useMemo(
    () => new Map(displayedClients.map((c) => [c.id, c])),
    [displayedClients],
  );

  const manageableProjectIds = React.useMemo(() => {
    if (!canManageCarRecord(user?.role)) return new Set<string>();
    if (isClienteAutonomo(user?.role)) {
      return new Set((projects ?? []).map((p) => p.id));
    }
    return new Set((projects ?? []).map((p) => p.id));
  }, [projects, user?.role]);

  const displayedProjects = React.useMemo(() => {
    if (!projects) return [];
    if (isRepresentativeLikePortalRole(user?.role)) {
      if (!clientId) return [];
      const client = clientsMap.get(clientId);
      return filterProjectsForClientCpfCnpj(
        projects,
        empreendedoresForRep,
        client?.cpfCnpj,
      );
    }
    if (!clientId) return sortByPropertyNamePt(projects);
    const client = clientsMap.get(clientId);
    return filterProjectsForClientCpfCnpj(
      projects,
      empreendedoresStaff ?? [],
      client?.cpfCnpj,
    );
  }, [
    projects,
    user?.role,
    clientId,
    clientsMap,
    empreendedoresForRep,
    empreendedoresStaff,
  ]);

  React.useEffect(() => {
    if (!clientId) {
      if (isRepresentativeLikePortalRole(user?.role)) setProjectId("");
      return;
    }
    if (projectId && !displayedProjects.some((p) => p.id === projectId)) {
      setProjectId("");
    }
  }, [user?.role, clientId, projectId, displayedProjects]);

  const showStaffListFilter = !isEmpreendedorScopedPortalRole(user?.role);

  const projectsWithCar = React.useMemo(
    () => (projects ?? []).filter((p) => !!p.car),
    [projects],
  );

  const filteredProjectsWithCar = React.useMemo(() => {
    let list = projectsWithCar;
    if (listFilterEmpreendedorId) {
      list = list.filter(
        (p) => p.empreendedorId === listFilterEmpreendedorId,
      );
    }
    if (listFilterProjectId) {
      list = list.filter((p) => p.id === listFilterProjectId);
    }
    return list;
  }, [projectsWithCar, listFilterEmpreendedorId, listFilterProjectId]);

  const handleUpload = async (files: File[], kind: CarUploadKind) => {
    if (!canManageCar || !firestore) return;
    const setUploading = kind === "pdf" ? setUploadingPdf : setUploadingGeometry;
    const setFiles = kind === "pdf" ? setPdfFiles : setGeometryFiles;
    setUploading(true);
    try {
      const uploaded = await uploadCarFiles(files, kind, (message) => {
        toast({ variant: "destructive", title: "Arquivo inválido", description: message });
      });
      if (uploaded.length > 0) {
        setFiles((prev) => [...prev, ...uploaded]);
        toast({
          title: uploaded.length > 1 ? "Arquivos enviados" : "Arquivo enviado",
          description:
            kind === "pdf"
              ? `${uploaded.length} PDF(s) pronto(s) para salvar.`
              : `${uploaded.length} arquivo(s) de geometria pronto(s).`,
        });
      }
    } catch (error) {
      console.error("Erro no upload CAR:", error);
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: "Não foi possível enviar o arquivo.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!canManageCar) {
      toast({
        variant: "destructive",
        title: "Sem permissão",
        description:
          "Cliente gestão e representante apenas consultam os registros de CAR.",
      });
      return;
    }
    if (!firestore || !user) {
      toast({ variant: "destructive", title: "Erro de autenticação." });
      return;
    }
    if (!projectId) {
      toast({
        variant: "destructive",
        title: "Selecione o empreendimento (fazenda).",
      });
      return;
    }
    if (!receiptNumber.trim()) {
      toast({
        variant: "destructive",
        title: "Informe o número do recibo do CAR.",
      });
      return;
    }
    if (pdfFiles.length === 0) {
      toast({
        variant: "destructive",
        title: "Envie o PDF do CAR.",
        description: "Ao menos um recibo em PDF é obrigatório para salvar.",
      });
      return;
    }

    if (isClienteAutonomo(user.role)) {
      const allowed = (projects ?? []).some((p) => p.id === projectId);
      if (!allowed) {
        toast({
          variant: "destructive",
          title: "Empreendimento inválido",
          description:
            "Selecione um empreendimento vinculado aos seus empreendedores.",
        });
        return;
      }
    }

    setSaving(true);
    const projectRef = doc(firestore, "projects", projectId);
    const carData = buildCarPayload({
      clientId: clientId || undefined,
      receiptNumber,
      pdfFiles,
      geometryFiles,
    });

    try {
      await updateDoc(projectRef, { car: carData });
      try {
        await notifyProjectPortalUsers(
          firestore,
          projectId,
          {
            title: "CAR cadastrado no empreendimento",
            description: `Recibo ${receiptNumber.trim() || "—"} disponível em Documentos Ambientais.`,
            link: NOTIFICATION_LINKS.car,
            sourceType: NOTIFICATION_SOURCE.car,
            sourceId: `${projectId}_${receiptNumber.trim() || Date.now()}`,
            actorRole: user?.role,
          },
          { excludeUserId: user?.uid },
        );
      } catch (notifyErr) {
        console.warn("[CAR] notificação:", notifyErr);
      }
      toast({
        title: "CAR salvo com sucesso",
        description:
          "O cadastro ambiental rural foi vinculado ao empreendimento.",
      });
      setReceiptNumber("");
      setPdfFiles([]);
      setGeometryFiles([]);
    } catch (error) {
      handleFirestoreFormError(error, {
        toast,
        title: "Erro ao salvar CAR",
        context: {
          path: projectRef.path,
          operation: "update",
          requestResourceData: { car: carData },
        },
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCar = async () => {
    if (!firestore || !deletingProject) return;
    setDeleting(true);
    const projectRef = doc(firestore, "projects", deletingProject.id);
    try {
      await updateDoc(projectRef, { car: deleteField() });
      toast({
        title: "CAR excluído",
        description: "O vínculo do CAR com o empreendimento foi removido.",
      });
      setDeletingProject(null);
    } catch (error) {
      handleFirestoreFormError(error, {
        toast,
        title: "Erro ao excluir CAR",
        context: {
          path: projectRef.path,
          operation: "update",
        },
      });
    } finally {
      setDeleting(false);
    }
  };

  const isLoading =
    loadingClients ||
    loadingProjects ||
    (isRepresentativeLikePortalRole(user?.role) && empreendedorIdsForRep === undefined) ||
    (isClientePortalRole(user?.role) &&
      empreendedorIdsForTitular === undefined);

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={
          canManageCar
            ? "Cadastro Ambiental Rural (CAR)"
            : "Registros de CAR por Empreendimento"
        }
      />
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        {canManageCar ? (
        <Card>
          <CardHeader>
            <CardTitle>Vincular CAR a Empreendimento</CardTitle>
            <CardDescription>
              {isClienteAutonomo(user?.role)
                ? "Informe o número do recibo, envie PDFs e, se quiser, arquivos de geometria (SHP/ZIP). Arraste os arquivos para as áreas de upload ou clique para selecionar."
                : "Vincule o recibo do CAR em PDF e arquivos de geometria ao cliente e à fazenda. Arraste os arquivos ou clique nas áreas de upload."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-64" />
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>
                      Cliente{" "}
                      {isRepresentativeLikePortalRole(user?.role)
                        ? "(obrigatório para selecionar fazenda)"
                        : "(opcional)"}
                    </Label>
                    <Select
                      value={clientId}
                      onValueChange={(v) => {
                        setClientId(v);
                        setProjectId("");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente proprietário" />
                      </SelectTrigger>
                      <SelectContent>
                        {displayedClients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} — {c.cpfCnpj}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Empreendimento / Fazenda</Label>
                    <Select
                      value={projectId}
                      onValueChange={setProjectId}
                      disabled={
                        (isRepresentativeLikePortalRole(user?.role) && !clientId) ||
                        (Boolean(clientId) && displayedProjects.length === 0)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isRepresentativeLikePortalRole(user?.role) && !clientId
                              ? "Selecione primeiro o cliente"
                              : clientId && displayedProjects.length === 0
                                ? "Nenhum empreendimento para este cliente"
                                : "Selecione o empreendimento"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {displayedProjects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.propertyName}{" "}
                            {p.municipio ? `— ${p.municipio}/${p.uf}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Número do Recibo do CAR</Label>
                  <Input
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    placeholder="Ex: MG-1234-5678-9012"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <CarFileUploadZone
                    label="Recibo / Documentos em PDF"
                    description="Obrigatório. Um ou mais PDFs do recibo CAR."
                    accept="application/pdf,.pdf"
                    files={pdfFiles}
                    uploading={uploadingPdf}
                    limitLabel={limitLabel}
                    fileKind="pdf"
                    onFilesAdded={(files) => void handleUpload(files, "pdf")}
                    onRemove={(index) =>
                      setPdfFiles((prev) => prev.filter((_, i) => i !== index))
                    }
                  />
                  <CarFileUploadZone
                    label="Arquivos de Geometria (SHP ou ZIP)"
                    description="Opcional. Geometria do imóvel rural."
                    accept=".zip,.shp,application/zip"
                    files={geometryFiles}
                    uploading={uploadingGeometry}
                    limitLabel={limitLabel}
                    fileKind="geometry"
                    onFilesAdded={(files) => void handleUpload(files, "geometry")}
                    onRemove={(index) =>
                      setGeometryFiles((prev) => prev.filter((_, i) => i !== index))
                    }
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={saving || uploadingPdf || uploadingGeometry}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {saving ? "Salvando..." : "Salvar CAR"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>
              {canManageCar
                ? "Registros de CAR por Empreendimento"
                : "Consulta aos registros"}
            </CardTitle>
            <CardDescription>
              {canManageCar
                ? "Consulte, visualize, baixe, edite ou exclua os CARs vinculados às fazendas."
                : "Visualize quais empreendimentos já possuem CAR vinculado e abra os anexos."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showStaffListFilter && (
              <div className="mb-4">
                <EmpreendedorProjectFilter
                  empreendedores={empreendedoresStaff}
                  allProjects={projects}
                  empreendedorId={listFilterEmpreendedorId}
                  projectId={listFilterProjectId}
                  onEmpreendedorIdChange={setListFilterEmpreendedorId}
                  onProjectIdChange={setListFilterProjectId}
                  isLoading={loadingProjects}
                />
              </div>
            )}
            <div className="space-y-4">
              {loadingProjects &&
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-28 w-full rounded-lg"
                  />
                ))}
              {!loadingProjects &&
                filteredProjectsWithCar.map((p) => {
                  const car = p.car!;
                  const client = car.clientId
                    ? clientsMap.get(car.clientId)
                    : undefined;
                  const clientLabel = client
                    ? `${client.name} — ${client.cpfCnpj}`
                    : undefined;
                  const canManageThisRecord =
                    canManageCarRecord(user?.role) &&
                    manageableProjectIds.has(p.id);

                  return (
                    <CarRecordCard
                      key={p.id}
                      project={p}
                      car={car}
                      clientLabel={clientLabel}
                      canManage={canManageThisRecord}
                      canDownload={canDownloadCar}
                      onEdit={() => setEditingProject(p)}
                      onDelete={() => setDeletingProject(p)}
                    />
                  );
                })}
              {!loadingProjects && filteredProjectsWithCar.length === 0 && (
                <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-center text-sm text-muted-foreground">
                  Nenhum empreendimento possui CAR vinculado ainda.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {editingProject?.car ? (
        <CarEditDialog
          open={!!editingProject}
          onOpenChange={(open) => {
            if (!open) setEditingProject(null);
          }}
          project={editingProject}
          car={editingProject.car}
          clientId={editingProject.car.clientId}
          limitLabel={limitLabel}
          uploadCarFiles={uploadCarFiles}
          onSaved={() => setEditingProject(null)}
        />
      ) : null}

      <AlertDialog
        open={!!deletingProject}
        onOpenChange={(open) => {
          if (!open) setDeletingProject(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro de CAR?</AlertDialogTitle>
            <AlertDialogDescription>
              O vínculo do CAR com{" "}
              <span className="font-medium text-foreground">
                {deletingProject?.propertyName}
              </span>{" "}
              será removido. Os arquivos no armazenamento não são apagados
              automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteCar()}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UploadPreparationDialog {...dialogProps} />
    </div>
  );
}
