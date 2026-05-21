"use client";

import * as React from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
  useAuth,
} from "@/firebase";
import type { Client, Project } from "@/lib/types";
import { isClienteAutonomo, isClientePortalRole } from "@/lib/role-guards";
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

  const clientsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    if (user.role === "representative") {
      return query(
        collection(firestore, "clients"),
        where("approvedUserIds", "array-contains", user.id),
      );
    }
    if (isClienteAutonomo(user.role)) {
      return query(collection(firestore, "clients"), where("userId", "==", user.id));
    }
    return collection(firestore, "clients");
  }, [firestore, user]);

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
    if (!firestore || !user || user.role !== "representative") return;
    const repUid = user.id;
    getDocs(
      query(
        collection(firestore, "empreendedores"),
        where("approvedUserIds", "array-contains", repUid),
      ),
    )
      .then((snap) => {
        setEmpreendedorIdsForRep(snap.docs.map((d) => d.id));
        setEmpreendedoresForRep(
          snap.docs.map((d) => ({ id: d.id, cpfCnpj: d.data().cpfCnpj as string | undefined })),
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
    if (user.role === "representative") {
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
    if (user?.role !== "representative") return projects;
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
    isRepresentative: user?.role === "representative",
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
