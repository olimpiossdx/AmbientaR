"use client";

import * as React from "react";
import {
  useCollection,
  useDoc,
  useMemoFirebase,
  useFirebase,
} from "@/firebase";
import {
  buildEmpreendedorSelectOptions,
  buildProjectSelectOptions,
  normalizeEntityId,
} from "@/lib/empreendedor-project-select";
import type { Empreendedor, Project } from "@/lib/types";
import { collection, doc, limit, query } from "firebase/firestore";

export interface UseEmpreendedorProjectSelectOptions {
  selectedEmpreendedorId: string;
  selectedProjectId?: string;
  /** Documento em edição — preserva opções antes da coleção carregar. */
  linkedEmpreendedorId?: string | null;
  linkedProjectId?: string | null;
}

export function useEmpreendedorProjectSelect({
  selectedEmpreendedorId,
  selectedProjectId = "",
  linkedEmpreendedorId,
  linkedProjectId,
}: UseEmpreendedorProjectSelectOptions) {
  const { firestore } = useFirebase();

  const empreendedoresQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, "empreendedores"), limit(200))
        : null,
    [firestore],
  );
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } =
    useCollection<Empreendedor>(empreendedoresQuery);

  const projectsQuery = useMemoFirebase(
    () =>
      firestore ? query(collection(firestore, "projects"), limit(200)) : null,
    [firestore],
  );
  const { data: allProjects, isLoading: isLoadingProjects } =
    useCollection<Project>(projectsQuery);

  const linkedEmpreendedorRef = useMemoFirebase(
    () =>
      firestore && linkedEmpreendedorId
        ? doc(
            firestore,
            "empreendedores",
            normalizeEntityId(linkedEmpreendedorId),
          )
        : null,
    [firestore, linkedEmpreendedorId],
  );
  const { data: linkedEmpreendedor } =
    useDoc<Empreendedor>(linkedEmpreendedorRef);

  const linkedProjectRef = useMemoFirebase(
    () =>
      firestore && linkedProjectId
        ? doc(firestore, "projects", normalizeEntityId(linkedProjectId))
        : null,
    [firestore, linkedProjectId],
  );
  const { data: linkedProject } = useDoc<Project>(linkedProjectRef);

  const empreendedoresForSelect = React.useMemo(
    () =>
      buildEmpreendedorSelectOptions({
        list: empreendedores,
        selectedId: selectedEmpreendedorId,
        linkedDoc: linkedEmpreendedor,
      }),
    [empreendedores, selectedEmpreendedorId, linkedEmpreendedor],
  );

  const projectsForSelect = React.useMemo(
    () =>
      buildProjectSelectOptions({
        allProjects,
        empreendedorId: selectedEmpreendedorId,
        selectedProjectId,
        linkedDoc: linkedProject,
      }),
    [allProjects, selectedEmpreendedorId, selectedProjectId, linkedProject],
  );

  return {
    empreendedores,
    allProjects,
    empreendedoresForSelect,
    projectsForSelect,
    isLoadingEmpreendedores,
    isLoadingProjects,
  };
}
