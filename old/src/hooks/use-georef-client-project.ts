"use client";

import * as React from "react";
import { collection, documentId, getDocs, query, where } from "firebase/firestore";
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
  useAuth,
} from "@/firebase";
import type { Client, Project } from "@/lib/types";
import { resolvePortalAuthUid } from "@/lib/auth-user-id";
import {
  isClienteAutonomo,
  isClientePortalRole,
  isConsultorRepresentante,
  isRepresentativeLikePortalRole,
} from "@/lib/role-guards";
import { fetchEmpreendedorIdsForPortalScope } from "@/lib/portal-empreendedor-scope";
import { sortByPropertyNamePt } from "@/lib/sort-pt-br";

export function useGeorefClientProject(
  clientId: string,
  projectId: string,
) {
  const { firestore } = useFirebase();
  const { user } = useAuth();
  const [empreendedorIdsForTitular, setEmpreendedorIdsForTitular] = React.useState<
    string[] | undefined
  >(undefined);
  const [empreendedorIdsForRep, setEmpreendedorIdsForRep] = React.useState<
    string[] | undefined
  >(undefined);
  const [empreendedoresForRep, setEmpreendedoresForRep] = React.useState<
    Array<{ id: string; cpfCnpj?: string }>
  >([]);

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
    if (!firestore || !user || !isClientePortalRole(user.role)) return;
    const docs = [user.cpf || user.userCpf, ...(user.cnpjs || [])].filter(Boolean) as string[];
    if (docs.length === 0) {
      setEmpreendedorIdsForTitular(["__none__"]);
      return;
    }
    getDocs(query(collection(firestore, "empreendedores"), where("cpfCnpj", "in", docs.slice(0, 10))))
      .then((snap) => {
        const ids = snap.docs.map((d) => d.id);
        setEmpreendedorIdsForTitular(ids.length ? ids : ["__none__"]);
      })
      .catch(() => setEmpreendedorIdsForTitular(["__none__"]));
  }, [firestore, user]);

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
        const snap = await getDocs(
          query(
            collection(firestore, "empreendedores"),
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
      return query(
        collection(firestore, "projects"),
        where("empreendedorId", "in", empreendedorIdsForTitular.slice(0, 10)),
      );
    }
    if (isRepresentativeLikePortalRole(user.role)) {
      if (empreendedorIdsForRep === undefined) return null;
      if (empreendedorIdsForRep.length === 0) {
        return query(collection(firestore, "projects"), where("empreendedorId", "==", "__none__"));
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
    () => new Map((clients ?? []).map((c) => [c.id, c])),
    [clients],
  );

  const onlyDigits = (v: string) => (v || "").replace(/\D/g, "");

  const filteredProjects = React.useMemo(() => {
    if (!projects) return [];
    if (!isRepresentativeLikePortalRole(user?.role)) return projects;
    if (!clientId) return [];
    const client = clientsMap.get(clientId);
    if (!client?.cpfCnpj) return [];
    const d = onlyDigits(client.cpfCnpj);
    const empIds = empreendedoresForRep
      .filter((e) => e.cpfCnpj && onlyDigits(e.cpfCnpj) === d)
      .map((e) => e.id);
    return sortByPropertyNamePt(
      projects.filter((p) => p.empreendedorId && empIds.includes(p.empreendedorId)),
    );
  }, [projects, user?.role, clientId, clientsMap, empreendedoresForRep]);

  const selectedClient = clientId ? clientsMap.get(clientId) : undefined;
  const selectedProject = filteredProjects.find((p) => p.id === projectId) ??
    projects?.find((p) => p.id === projectId);

  return {
    clients: clients ?? [],
    projects: filteredProjects,
    loadingClients,
    loadingProjects,
    selectedClient,
    selectedProject,
    isRepresentative: isRepresentativeLikePortalRole(user?.role),
  };
}

/** Preenche campos do processo a partir do empreendimento vinculado. */
export function projectToGeorefFields(project: Project) {
  return {
    projectName: project.propertyName || project.fantasyName,
    municipio: project.municipio,
    uf: project.uf ?? "MG",
    matricula: project.matricula,
    car: project.car?.receiptNumber,
    title: project.propertyName,
  };
}
