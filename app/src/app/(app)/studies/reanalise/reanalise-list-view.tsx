'use client';

import { StudyDocumentsListPage } from '@/components/studies/study-documents-list-page';

export function ReanaliseListView() {
  return (
    <StudyDocumentsListPage
      collectionName="reanalises"
      templateSlug="rca"
      studySlug="reanalise"
      studyLabel="Reanálise"
      pageTitle="Reanálise de processo"
      addButtonLabel="Nova reanálise"
      newHref="/studies/reanalise/new"
      editHref={(id) => `/studies/reanalise/${id}/edit`}
      draftCardTitle="Reanálises em elaboração"
      approvedCardTitle="Reanálises aprovadas"
      emptyDraft="Nenhuma reanálise em elaboração."
      emptyApproved="Nenhuma reanálise aprovada."
      viewDialogDescription="Detalhes do processo de reanálise."
    />
  );
}
