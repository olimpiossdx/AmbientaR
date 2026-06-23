'use client';

import { Suspense } from 'react';
import { ProcuracaoForm } from '../procuracao-form';
import {
  StudyFormShell,
  useStudyFormShellSuccess,
} from '@/components/studies/study-form-shell';

const LIST_PATH = '/studies/procuracao';
const PAGE_WIDTH = 'max-w-4xl mx-auto';

function NewProcuracaoPageContent() {
  const onSuccess = useStudyFormShellSuccess('page', LIST_PATH);

  return (
    <StudyFormShell
      variant="page"
      title="Procuração de representação"
      description="Mandato do empreendedor (outorgante) à consultoria (outorgada) para atos perante órgãos ambientais, vinculado ao(s) empreendimento(s) selecionado(s)."
      notFoundTitle="Procuração não encontrada"
      pageHeaderTitle="Nova procuração"
      pageWidthClassName={PAGE_WIDTH}
    >
      <ProcuracaoForm onSuccess={onSuccess} />
    </StudyFormShell>
  );
}

export default function NewProcuracaoPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NewProcuracaoPageContent />
    </Suspense>
  );
}
