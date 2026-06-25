'use client';

import * as React from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, limit, query } from 'firebase/firestore';
import type { Empreendedor, Project } from '@/lib/types';
import { isEmpreendedorScopedPortalRole } from '@/lib/portal-empreendedor-scope';
import { EmpreendedorProjectFilter } from '@/components/studies/empreendedor-project-filter';

export type StudyListEntityFilterProps = {
  empreendedorId: string;
  projectId: string;
  onEmpreendedorIdChange: (id: string) => void;
  onProjectIdChange: (id: string) => void;
  showProject?: boolean;
  className?: string;
};

export function StudyListEntityFilter({
  empreendedorId,
  projectId,
  onEmpreendedorIdChange,
  onProjectIdChange,
  showProject = true,
  className,
}: StudyListEntityFilterProps) {
  const { firestore, user } = useFirebase();

  const empreendedoresQuery = useMemoFirebase(
    () =>
      firestore ? query(collection(firestore, 'empreendedores'), limit(200)) : null,
    [firestore],
  );
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } =
    useCollection<Empreendedor>(empreendedoresQuery);

  const projectsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'projects'), limit(200)) : null),
    [firestore],
  );
  const { data: projects, isLoading: isLoadingProjects } =
    useCollection<Project>(projectsQuery);

  const showEntityFilter = !isEmpreendedorScopedPortalRole(user?.role);
  if (!showEntityFilter) return null;

  return (
    <EmpreendedorProjectFilter
      empreendedores={empreendedores}
      allProjects={projects}
      empreendedorId={empreendedorId}
      projectId={projectId}
      onEmpreendedorIdChange={onEmpreendedorIdChange}
      onProjectIdChange={onProjectIdChange}
      showProject={showProject}
      isLoading={isLoadingEmpreendedores || isLoadingProjects}
      className={className}
    />
  );
}
