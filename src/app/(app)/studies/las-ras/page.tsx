'use client';

import { StudyDocumentsListPage } from '@/components/studies/study-documents-list-page';

export default function LasRasListPage() {
  return (
    <StudyDocumentsListPage
      collectionName="lasRas"
      templateSlug="las-ras"
      studySlug="las-ras"
      studyLabel="LAS-RAS"
      pageTitle="Licenciamento Ambiental Simplificado (LAS/RAS)"
      addButtonLabel="Novo LAS/RAS"
      newHref="/studies/las-ras/new"
      editHref={(id) => `/studies/las-ras/${id}/edit`}
      draftCardTitle="LAS/RAS em elaboração"
      approvedCardTitle="LAS/RAS aprovados"
      emptyDraft="Nenhum LAS/RAS em elaboração."
      emptyApproved="Nenhum LAS/RAS aprovado."
      viewDialogDescription="Detalhes do Relatório Ambiental Simplificado."
    />
  );
}
