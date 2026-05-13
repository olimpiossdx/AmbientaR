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
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
  useAuth,
  errorEmitter,
} from "@/firebase";
import {
  collection,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import type { Client, Project } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  uploadFileToStorage,
  sanitizeStorageFileName,
} from "@/lib/storage-upload";
import { isPdfLikeFile } from "@/lib/file-mime";
import { FileText, Upload, Map as MapIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FirestorePermissionError } from "@/firebase/errors";
import {
  canManageCarUploadsOnProject,
  isClienteAutonomo,
  isClientePortalRole,
} from "@/lib/role-guards";

export default function CarPage() {
  const { firestore } = useFirebase();
  const { user } = useAuth();
  const { toast } = useToast();
  const canManageCar = canManageCarUploadsOnProject(user?.role);

  const [clientId, setClientId] = React.useState("");
  const [projectId, setProjectId] = React.useState("");
  const [receiptNumber, setReceiptNumber] = React.useState("");
  const [pdfUrl, setPdfUrl] = React.useState("");
  const [shpUrl, setShpUrl] = React.useState("");
  const [uploadingPdf, setUploadingPdf] = React.useState(false);
  const [uploadingShp, setUploadingShp] = React.useState(false);
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

  const clientsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    if (user.role === "representative") {
      return query(
        collection(firestore, "clients"),
        where("approvedUserIds", "array-contains", user.id),
      );
    }
    if (isClienteAutonomo(user.role)) {
      return query(
        collection(firestore, "clients"),
        where("userId", "==", user.id),
      );
    }
    return collection(firestore, "clients");
  }, [firestore, user]);

  const { data: clients, isLoading: loadingClients } =
    useCollection<Client>(clientsQuery);

  React.useEffect(() => {
    if (!firestore || !user || user.role !== "representative" || loadingClients)
      return;
    if (clients && clients.length > 0) {
      setFallbackClients(null);
      return;
    }
    const repUid = user.id ?? (user as any).uid;
    const accessRequestsRef = collection(firestore, "access_requests");
    const clientsRef = collection(firestore, "clients");
    const qApproved = query(
      accessRequestsRef,
      where("status", "==", "approved"),
      where("requestedByUserId", "==", repUid),
    );
    getDocs(qApproved)
      .then((snap) => {
        if (snap.docs.length === 0) {
          setFallbackClients([]);
          return;
        }
        const cpfs = new Set<string>();
        snap.docs.forEach((d) => {
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
    if (!firestore || !user || user.role !== "representative") return;
    const repUid = user.id ?? (user as any).uid;
    const empreendedoresRef = collection(firestore, "empreendedores");
    const accessRequestsRef = collection(firestore, "access_requests");
    const qEmp = query(
      empreendedoresRef,
      where("approvedUserIds", "array-contains", repUid),
    );
    getDocs(qEmp)
      .then((snapshot) => {
        let ids = snapshot.docs.map((d) => d.id);
        const empList = snapshot.docs.map((d) => ({
          id: d.id,
          cpfCnpj: d.data().cpfCnpj as string | undefined,
        }));
        if (ids.length > 0) {
          setEmpreendedorIdsForRep(ids);
          setEmpreendedoresForRep(empList);
          return;
        }
        const qApproved = query(
          accessRequestsRef,
          where("status", "==", "approved"),
          where("requestedByUserId", "==", repUid),
        );
        getDocs(qApproved)
          .then((snapReq) => {
            if (snapReq.docs.length === 0) {
              setEmpreendedorIdsForRep([]);
              setEmpreendedoresForRep([]);
              return;
            }
            const cpfs = new Set<string>();
            snapReq.docs.forEach((d) => {
              const cpf = (d.data().cpfOfInterested || "").trim();
              const digits = cpf.replace(/\D/g, "");
              if (digits.length >= 11) {
                cpfs.add(cpf);
                cpfs.add(digits);
              }
            });
            const cpfList = Array.from(cpfs).slice(0, 10);
            if (cpfList.length === 0) {
              setEmpreendedorIdsForRep([]);
              setEmpreendedoresForRep([]);
              return;
            }
            const qByCpf = query(
              empreendedoresRef,
              where("cpfCnpj", "in", cpfList),
            );
            getDocs(qByCpf)
              .then((snapEmp) => {
                ids = snapEmp.docs.map((d) => d.id);
                setEmpreendedorIdsForRep(ids);
                setEmpreendedoresForRep(
                  snapEmp.docs.map((d) => ({
                    id: d.id,
                    cpfCnpj: d.data().cpfCnpj as string | undefined,
                  })),
                );
              })
              .catch(() => {
                setEmpreendedorIdsForRep([]);
                setEmpreendedoresForRep([]);
              });
          })
          .catch(() => {
            setEmpreendedorIdsForRep([]);
            setEmpreendedoresForRep([]);
          });
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
    if (user.role === "representative") {
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

  const clientsMap = React.useMemo(
    () => new Map(displayedClients.map((c) => [c.id, c])),
    [displayedClients],
  );

  const onlyDigits = (v: string) => (v || "").replace(/\D/g, "");

  const displayedProjects = React.useMemo(() => {
    if (!projects) return [];
    if (user?.role !== "representative") return projects;
    if (!clientId) return [];
    const client = clientsMap.get(clientId);
    if (!client?.cpfCnpj) return [];
    const clientDigits = onlyDigits(client.cpfCnpj);
    if (clientDigits.length < 11) return [];
    const empIdsOfClient = empreendedoresForRep
      .filter(
        (e) =>
          e.cpfCnpj &&
          (onlyDigits(e.cpfCnpj) === clientDigits ||
            e.cpfCnpj === client.cpfCnpj),
      )
      .map((e) => e.id);
    if (empIdsOfClient.length === 0) return [];
    return projects.filter(
      (p) => p.empreendedorId && empIdsOfClient.includes(p.empreendedorId),
    );
  }, [projects, user?.role, clientId, clientsMap, empreendedoresForRep]);

  React.useEffect(() => {
    if (user?.role === "representative" && !clientId) setProjectId("");
  }, [user?.role, clientId]);

  const projectsWithCar = React.useMemo(
    () => (projects ?? []).filter((p) => !!p.car),
    [projects],
  );

  const handlePdfChange: React.ChangeEventHandler<HTMLInputElement> = async (
    event,
  ) => {
    if (!canManageCar) return;
    const inputEl = event.currentTarget;
    const file = inputEl.files?.[0];
    if (!file || !firestore) return;

    if (!isPdfLikeFile(file)) {
      toast({
        variant: "destructive",
        title: "Tipo de arquivo inválido",
        description: "Envie um arquivo em PDF para o recibo do CAR.",
      });
      return;
    }

    try {
      setUploadingPdf(true);
      // Permite selecionar o mesmo arquivo novamente.
      inputEl.value = "";

      const safe = sanitizeStorageFileName(file.name);
      const url = await uploadFileToStorage(
        file,
        `car/${Date.now()}-${safe}`,
      );
      setPdfUrl(url);
      toast({
        title: "Recibo enviado",
        description: "O PDF foi carregado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao enviar PDF do CAR:", error);
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: "Não foi possível enviar o PDF do CAR.",
      });
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleShpChange: React.ChangeEventHandler<HTMLInputElement> = async (
    event,
  ) => {
    if (!canManageCar) return;
    const inputEl = event.currentTarget;
    const file = inputEl.files?.[0];
    if (!file || !firestore) return;

    try {
      setUploadingShp(true);
      // Permite selecionar o mesmo arquivo novamente.
      inputEl.value = "";

      const safe = sanitizeStorageFileName(file.name);
      const url = await uploadFileToStorage(
        file,
        `car-shp/${Date.now()}-${safe}`,
      );
      setShpUrl(url);
      toast({
        title: "Arquivo de geometria enviado",
        description: "O arquivo SHP/ZIP foi carregado.",
      });
    } catch (error) {
      console.error("Erro ao enviar SHP do CAR:", error);
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: "Não foi possível enviar o arquivo de geometria.",
      });
    } finally {
      setUploadingShp(false);
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
    if (!pdfUrl) {
      toast({
        variant: "destructive",
        title: "Envie o PDF do CAR.",
        description: "O recibo em PDF é obrigatório para salvar o registro.",
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

    const carData = {
      clientId: clientId || undefined,
      receiptNumber: receiptNumber.trim(),
      pdfUrl,
      shpUrl: shpUrl || undefined,
    };

    try {
      await updateDoc(projectRef, { car: carData });
      toast({
        title: "CAR salvo com sucesso",
        description:
          "O cadastro ambiental rural foi vinculado ao empreendimento.",
      });
      setReceiptNumber("");
      setPdfUrl("");
      setShpUrl("");
    } catch (error: any) {
      console.error("Erro ao salvar CAR no projeto:", error);
      const permissionError = new FirestorePermissionError({
        path: projectRef.path,
        operation: "update",
        requestResourceData: { car: carData },
      });
      errorEmitter.emit("permission-error", permissionError);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description:
          "Verifique suas permissões de escrita para empreendimentos.",
      });
    } finally {
      setSaving(false);
    }
  };

  const isLoading =
    loadingClients ||
    loadingProjects ||
    (user?.role === "representative" && empreendedorIdsForRep === undefined) ||
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
                ? "Nos seus empreendimentos, informe o número do recibo, envie o PDF do CAR e, se quiser, o arquivo de geometria (SHP/ZIP). A lista abaixo mostra os registros já vinculados."
                : "Suba o recibo do CAR em PDF e o arquivo de geometria (SHP/ZIP), vinculando ao cliente e à fazenda."}
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
                      {user?.role === "representative"
                        ? "(obrigatório para selecionar fazenda)"
                        : "(opcional)"}
                    </Label>
                    <Select
                      value={clientId}
                      onValueChange={(v) => {
                        setClientId(v);
                        if (user?.role === "representative") setProjectId("");
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
                      disabled={user?.role === "representative" && !clientId}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            user?.role === "representative" && !clientId
                              ? "Selecione primeiro o cliente"
                              : "Selecione o empreendimento"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {(user?.role === "representative"
                          ? displayedProjects
                          : (projects ?? [])
                        ).map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.propertyName}{" "}
                            {p.municipio ? `— ${p.municipio}/${p.uf}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Número do Recibo do CAR</Label>
                    <Input
                      value={receiptNumber}
                      onChange={(e) => setReceiptNumber(e.target.value)}
                      placeholder="Ex: MG-1234-5678-9012"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Recibo / Documento em PDF</Label>
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfChange}
                      disabled={uploadingPdf}
                    />
                    {uploadingPdf && (
                      <p className="text-xs text-muted-foreground">
                        Enviando PDF do CAR...
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Arquivo de Geometria (SHP ou ZIP)</Label>
                  <Input
                    type="file"
                    accept=".zip,.shp"
                    onChange={handleShpChange}
                    disabled={uploadingShp}
                  />
                  {uploadingShp && (
                    <p className="text-xs text-muted-foreground">
                      Enviando arquivo de geometria...
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || uploadingPdf || uploadingShp}
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
                ? "Consulte rapidamente quais fazendas já possuem CAR vinculado, com acesso aos arquivos enviados."
                : "Visualize quais empreendimentos já possuem CAR vinculado e abra os anexos. No plano Cliente Autônomo, o titular envia o recibo e os arquivos na área de cadastro acima; no plano Cliente Gestão e para representantes, o envio e a alteração ficam a cargo da equipe AmbientaR."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <div className="space-y-4">
                {loadingProjects &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-28 w-full rounded-lg"
                    />
                  ))}
                {!loadingProjects &&
                  projectsWithCar.map((p) => {
                    const car = p.car!;
                    const client = car.clientId
                      ? clientsMap.get(car.clientId)
                      : undefined;
                    return (
                      <Card
                        key={p.id}
                        className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col gap-4">
                            <div className="min-w-0 space-y-2">
                              <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                                {p.propertyName}
                                {p.municipio ? ` — ${p.municipio}/${p.uf}` : ""}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {client
                                  ? `${client.name} — ${client.cpfCnpj}`
                                  : "Cliente não vinculado"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Nº recibo CAR: {car.receiptNumber}
                              </p>
                            </div>
                            <Separator className="bg-border/60" />
                            <div className="flex flex-wrap items-center gap-1">
                              {car.pdfUrl && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      asChild
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0"
                                    >
                                      <a
                                        href={car.pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <FileText className="h-4 w-4" />
                                        <span className="sr-only">
                                          Ver recibo PDF
                                        </span>
                                      </a>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Abrir recibo em PDF</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {car.shpUrl && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      asChild
                                      variant="ghost"
                                      size="icon"
                                      className="h-9 w-9 shrink-0"
                                    >
                                      <a
                                        href={car.shpUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <MapIcon className="h-4 w-4" />
                                        <span className="sr-only">
                                          Baixar geometria
                                        </span>
                                      </a>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Baixar arquivo SHP/ZIP</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                {!loadingProjects && projectsWithCar.length === 0 && (
                  <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-center text-sm text-muted-foreground">
                    Nenhum empreendimento possui CAR vinculado ainda.
                  </div>
                )}
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
