"use client";

import { useMemo, useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Leaf,
  FileCheck,
  AlertTriangle,
  Clock,
  FolderKanban,
  CalendarIcon,
} from "lucide-react";
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  useAuth,
  useDoc,
} from "@/firebase";
import { isClientePortalRole, isConsultorRepresentante, isRepresentativeLikePortalRole } from "@/lib/role-guards";
import {
  fetchClientIdsForPortalPartner,
  fetchEmpreendedorIdsForPortalScope,
} from "@/lib/portal-empreendedor-scope";
import { fetchClientIdsForTitularPortalUser } from "@/lib/portal-titular-client-ids";
import {
  collection,
  doc,
  query,
  where,
} from "firebase/firestore";
import type {
  AppUser,
  Client,
  Empreendedor,
  Project,
  Condicionante,
  WaterPermit,
  EnvironmentalIntervention,
  License,
} from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import EnvironmentalDashboard from "../environmental-dashboard";
import AgendaWidget from "./agenda-widget";
import { DocumentosAmbientaisHubCard } from "@/components/documentos-ambientais-hub-card";
import { DOCUMENTOS_AMBIENTAIS_MENU_LABEL } from "@/lib/navigation-config";
import { ProfileNavigationHubCard } from "@/components/profile-navigation-hub-card";
import { TitularOnboardingCard } from "@/components/titular-onboarding-card";

export default function ClientDashboard() {
  const { user } = useAuth();
  const firestore = useFirestore();

  const [empreendedorIds, setEmpreendedorIds] = useState<string[] | undefined>(
    undefined,
  );
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !firestore) return;

    setEmpreendedorIds(undefined);
    setClientId(null);

    const appUser = user as AppUser;
    const toPlaceholder = (empIds: string[]) =>
      empIds.length > 0 && empIds[0] !== "invalid-placeholder"
        ? empIds
        : ["non-existent-placeholder"];

    if (isRepresentativeLikePortalRole(appUser.role)) {
      Promise.all([
        fetchClientIdsForPortalPartner(firestore, appUser),
        fetchEmpreendedorIdsForPortalScope(firestore, appUser),
      ])
        .then(([clientIds, empIds]) => {
          if (clientIds[0]) setClientId(clientIds[0]);
          setEmpreendedorIds(toPlaceholder(empIds));
        })
        .catch(() => setEmpreendedorIds(["non-existent-placeholder"]));
      return;
    }

    if (isClientePortalRole(appUser.role)) {
      Promise.all([
        fetchClientIdsForTitularPortalUser(firestore, appUser),
        fetchEmpreendedorIdsForPortalScope(firestore, appUser),
      ])
        .then(([clientIds, empIds]) => {
          if (clientIds[0]) setClientId(clientIds[0]);
          setEmpreendedorIds(toPlaceholder(empIds));
        })
        .catch(() => setEmpreendedorIds(["non-existent-placeholder"]));
      return;
    }

    setEmpreendedorIds(["non-existent-placeholder"]);
  }, [user, firestore]);

  const singleClientDocRef = useMemoFirebase(() => {
    if (!firestore || !clientId) return null;
    return doc(firestore, "clients", clientId);
  }, [firestore, clientId]);

  const { data: clientData, isLoading: isLoadingClientData } =
    useDoc<Client>(singleClientDocRef);

  const projectsQuery = useMemoFirebase(() => {
    if (!firestore || !empreendedorIds || empreendedorIds.length === 0)
      return null;
    return query(
      collection(firestore, "projects"),
      where("empreendedorId", "in", empreendedorIds),
    );
  }, [firestore, empreendedorIds]);
  const { data: projects, isLoading: isLoadingProjects } =
    useCollection<Project>(projectsQuery);

  const projectIds = useMemo(
    () => projects?.map((p) => p.id) || [],
    [projects],
  );

  const licensesQuery = useMemoFirebase(() => {
    if (!firestore || !empreendedorIds || empreendedorIds.length === 0)
      return null;
    return query(
      collection(firestore, "licenses"),
      where("empreendedorId", "in", empreendedorIds),
    );
  }, [firestore, empreendedorIds]);
  const { data: licenses, isLoading: isLoadingLicenses } =
    useCollection<License>(licensesQuery);
  const licenseIds = useMemo(
    () => licenses?.map((l) => l.id) || [],
    [licenses],
  );

  const outorgasQuery = useMemoFirebase(() => {
    if (!firestore || !empreendedorIds || empreendedorIds.length === 0)
      return null;
    return query(
      collection(firestore, "outorgas"),
      where("empreendedorId", "in", empreendedorIds),
    );
  }, [firestore, empreendedorIds]);
  const { data: outorgas, isLoading: isLoadingOutorgas } =
    useCollection<WaterPermit>(outorgasQuery);
  const outorgaIds = useMemo(
    () => outorgas?.map((o) => o.id) || [],
    [outorgas],
  );

  const intervencoesQuery = useMemoFirebase(() => {
    if (!firestore || !empreendedorIds || empreendedorIds.length === 0)
      return null;
    return query(
      collection(firestore, "intervencoes"),
      where("empreendedorId", "in", empreendedorIds),
    );
  }, [firestore, empreendedorIds]);
  const { data: intervencoes, isLoading: isLoadingIntervencoes } =
    useCollection<EnvironmentalIntervention>(intervencoesQuery);
  const intervencaoIds = useMemo(
    () => intervencoes?.map((i) => i.id) || [],
    [intervencoes],
  );

  const referenceIdsForCondicionantes = useMemo(() => {
    const ids = new Set<string>();
    licenseIds.forEach((id) => ids.add(id));
    projectIds.forEach((id) => ids.add(id));
    outorgaIds.forEach((id) => ids.add(id));
    intervencaoIds.forEach((id) => ids.add(id));
    return Array.from(ids);
  }, [licenseIds, projectIds, outorgaIds, intervencaoIds]);

  const CONDITIONANTES_CHUNK_SIZE = 10;
  const referenceIdChunks = useMemo(() => {
    if (
      !referenceIdsForCondicionantes.length ||
      referenceIdsForCondicionantes.length <= CONDITIONANTES_CHUNK_SIZE
    )
      return [referenceIdsForCondicionantes];
    const chunks: string[][] = [];
    for (
      let i = 0;
      i < referenceIdsForCondicionantes.length;
      i += CONDITIONANTES_CHUNK_SIZE
    ) {
      chunks.push(
        referenceIdsForCondicionantes.slice(i, i + CONDITIONANTES_CHUNK_SIZE),
      );
    }
    return chunks;
  }, [referenceIdsForCondicionantes]);

  const condicionantesQuerySingle = useMemoFirebase(() => {
    if (!firestore || referenceIdsForCondicionantes.length === 0) return null;
    if (referenceIdsForCondicionantes.length <= CONDITIONANTES_CHUNK_SIZE) {
      return query(
        collection(firestore, "condicionantes"),
        where("referenceId", "in", referenceIdsForCondicionantes),
      );
    }
    return null;
  }, [firestore, referenceIdsForCondicionantes]);

  const condicionantesQueryChunk0 = useMemoFirebase(() => {
    if (
      !firestore ||
      referenceIdChunks.length < 1 ||
      referenceIdChunks[0].length === 0
    )
      return null;
    return query(
      collection(firestore, "condicionantes"),
      where("referenceId", "in", referenceIdChunks[0]),
    );
  }, [firestore, referenceIdChunks]);
  const condicionantesQueryChunk1 = useMemoFirebase(() => {
    if (
      !firestore ||
      referenceIdChunks.length < 2 ||
      referenceIdChunks[1].length === 0
    )
      return null;
    return query(
      collection(firestore, "condicionantes"),
      where("referenceId", "in", referenceIdChunks[1]),
    );
  }, [firestore, referenceIdChunks]);
  const condicionantesQueryChunk2 = useMemoFirebase(() => {
    if (
      !firestore ||
      referenceIdChunks.length < 3 ||
      referenceIdChunks[2].length === 0
    )
      return null;
    return query(
      collection(firestore, "condicionantes"),
      where("referenceId", "in", referenceIdChunks[2]),
    );
  }, [firestore, referenceIdChunks]);
  const condicionantesQueryChunk3 = useMemoFirebase(() => {
    if (
      !firestore ||
      referenceIdChunks.length < 4 ||
      referenceIdChunks[3].length === 0
    )
      return null;
    return query(
      collection(firestore, "condicionantes"),
      where("referenceId", "in", referenceIdChunks[3]),
    );
  }, [firestore, referenceIdChunks]);
  const condicionantesQueryChunk4 = useMemoFirebase(() => {
    if (
      !firestore ||
      referenceIdChunks.length < 5 ||
      referenceIdChunks[4].length === 0
    )
      return null;
    return query(
      collection(firestore, "condicionantes"),
      where("referenceId", "in", referenceIdChunks[4]),
    );
  }, [firestore, referenceIdChunks]);

  const {
    data: condicionantesSingle,
    isLoading: isLoadingCondicionantesSingle,
  } = useCollection<Condicionante>(condicionantesQuerySingle);
  const { data: condicionantesChunk0, isLoading: isLoadingChunk0 } =
    useCollection<Condicionante>(condicionantesQueryChunk0);
  const { data: condicionantesChunk1, isLoading: isLoadingChunk1 } =
    useCollection<Condicionante>(condicionantesQueryChunk1);
  const { data: condicionantesChunk2, isLoading: isLoadingChunk2 } =
    useCollection<Condicionante>(condicionantesQueryChunk2);
  const { data: condicionantesChunk3, isLoading: isLoadingChunk3 } =
    useCollection<Condicionante>(condicionantesQueryChunk3);
  const { data: condicionantesChunk4, isLoading: isLoadingChunk4 } =
    useCollection<Condicionante>(condicionantesQueryChunk4);

  const condicionantesMerged = useMemo(() => {
    if (referenceIdChunks.length > 1) {
      const lists = [
        condicionantesChunk0,
        condicionantesChunk1,
        condicionantesChunk2,
        condicionantesChunk3,
        condicionantesChunk4,
      ].filter(Boolean) as (Condicionante[] | null | undefined)[];
      const merged: Condicionante[] = [];
      const seen = new Set<string>();
      for (const list of lists) {
        if (!list) continue;
        for (const item of list) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            merged.push(item);
          }
        }
      }
      return merged;
    }
    return null;
  }, [
    referenceIdChunks.length,
    condicionantesChunk0,
    condicionantesChunk1,
    condicionantesChunk2,
    condicionantesChunk3,
    condicionantesChunk4,
  ]);

  const condicionantes = condicionantesMerged ?? condicionantesSingle ?? null;
  const isLoadingCondicionantes =
    referenceIdChunks.length > 1
      ? isLoadingChunk0 ||
        isLoadingChunk1 ||
        isLoadingChunk2 ||
        isLoadingChunk3 ||
        isLoadingChunk4
      : isLoadingCondicionantesSingle;

  const stats = useMemo(() => {
    const pendingCondicionantes =
      condicionantes?.filter(
        (c) => c.status === "Pendente" || c.status === "Atrasada",
      ).length ?? 0;

    if (!licenses) {
      return {
        active: 0,
        total: 0,
        pending: pendingCondicionantes,
        nextExpiration: null,
      };
    }

    const totalLicenses = licenses.length;
    const activeLicenses = licenses.filter((l) => l.status === "Válida");
    const nextExpirationEntry = activeLicenses
      .map((l) => ({
        ...l,
        expirationDate: l.expirationDate ? new Date(l.expirationDate) : null,
      }))
      .filter((l) => l.expirationDate && l.expirationDate > new Date())
      .sort(
        (a, b) => a.expirationDate!.getTime() - b.expirationDate!.getTime(),
      )[0];

    return {
      active: activeLicenses.length,
      total: totalLicenses,
      pending: pendingCondicionantes,
      nextExpiration: nextExpirationEntry
        ? {
            date: nextExpirationEntry.expirationDate!.toLocaleDateString(
              "pt-BR",
            ),
            permit:
              nextExpirationEntry.processNumber ||
              nextExpirationEntry.permitNumber ||
              "Licença",
          }
        : null,
    };
  }, [licenses, condicionantes]);

  const isLoading =
    isLoadingProjects ||
    isLoadingLicenses ||
    isLoadingCondicionantes ||
    isLoadingClientData ||
    isLoadingOutorgas ||
    isLoadingIntervencoes ||
    empreendedorIds === undefined;
  const birthDate = clientData?.dataNascimento
    ? new Date(clientData.dataNascimento).toLocaleDateString("pt-BR", {
        timeZone: "UTC",
      })
    : "Não informado";

  const isRep = isRepresentativeLikePortalRole(user?.role);
  const isConsultor = isConsultorRepresentante(user?.role);
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={
          isConsultor
            ? "Painel do Consultor"
            : isRep
              ? "Painel do Representante"
              : "Painel do Cliente"
        }
      />
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-8">
        {user && <TitularOnboardingCard user={user as AppUser} />}
        {user?.role && <DocumentosAmbientaisHubCard role={user.role} />}
        {user?.role && (
          <ProfileNavigationHubCard
            role={user.role}
            excludeGroupLabels={[DOCUMENTOS_AMBIENTAIS_MENU_LABEL]}
          />
        )}
        <AgendaWidget />
        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo(a), {user?.name || "Cliente"}!</CardTitle>
            <CardDescription>
              {isRep
                ? "Resumo dos empreendimentos dos titulares que você representa (mesmas informações do painel do cliente)."
                : "Aqui está um resumo rápido dos seus empreendimentos."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Licenças Ativas
                  </CardTitle>
                  <FileCheck className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-1/2" />
                  ) : (
                    <div className="text-2xl font-bold">{stats.active}</div>
                  )}
                  {isLoading ? (
                    <Skeleton className="h-4 w-3/4 mt-1" />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      de {stats.total} licenças totais
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Condicionantes Pendentes
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-1/2" />
                  ) : (
                    <div className="text-2xl font-bold">{stats.pending}</div>
                  )}
                  {isLoading ? (
                    <Skeleton className="h-4 w-3/4 mt-1" />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      requerem sua atenção
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Próximo Vencimento
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-1/2" />
                  ) : (
                    <div className="text-2xl font-bold">
                      {stats.nextExpiration?.date || "N/A"}
                    </div>
                  )}
                  {isLoading ? (
                    <Skeleton className="h-4 w-3/4 mt-1" />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {stats.nextExpiration?.permit ||
                        "Nenhuma licença com vencimento futuro"}
                    </p>
                  )}
                </CardContent>
              </Card>
              {!isClientePortalRole(user?.role) &&
              user?.role !== "representative" ? (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Data de Nascimento
                    </CardTitle>
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-8 w-1/2" />
                    ) : (
                      <div className="text-2xl font-bold">{birthDate}</div>
                    )}
                    {isLoading ? (
                      <Skeleton className="h-4 w-3/4 mt-1" />
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Sua data de nascimento registrada.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="mt-8">
          <h2 className="text-2xl font-bold tracking-tight mb-4">
            Visão Geral de Gestão Ambiental
          </h2>
          <EnvironmentalDashboard
            initialPermits={projects}
            initialLicenses={licenses}
            initialCondicionantes={condicionantes}
            initialOutorgas={outorgas}
            initialIntervencoes={intervencoes}
            isLoading={isLoading}
          />
        </div>
      </main>
    </div>
  );
}
