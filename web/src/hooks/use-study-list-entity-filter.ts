'use client';

import { useMemo, useState } from 'react';
import {
  filterStudyRecordsByEmpreendedorProject,
  type StudyEntityFilter,
} from '@/lib/studies/filter-study-records';
import type { StudyExportRecord } from '@/lib/studies/study-export-record';

export function useStudyListEntityFilter<T extends StudyExportRecord>(
  records: readonly T[] | null | undefined,
  extraFilter?: Partial<StudyEntityFilter>,
) {
  const [filterEmpreendedorId, setFilterEmpreendedorId] = useState('');
  const [filterProjectId, setFilterProjectId] = useState('');

  const filtered = useMemo(() => {
    if (!records) return [] as T[];
    return filterStudyRecordsByEmpreendedorProject(records, {
      empreendedorId: filterEmpreendedorId,
      projectId: filterProjectId,
      ...extraFilter,
    });
  }, [records, filterEmpreendedorId, filterProjectId, extraFilter]);

  return {
    filterEmpreendedorId,
    setFilterEmpreendedorId,
    filterProjectId,
    setFilterProjectId,
    filtered,
  };
}
