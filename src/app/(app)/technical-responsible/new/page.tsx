"use client";

import { Suspense } from "react";
import { ResponsibleForm } from "../responsible-form";
import {
  ResponsibleFormShell,
  useResponsibleFormShellDismiss,
  useResponsibleFormShellSuccess,
} from "../responsible-form-shell";

const TITLE = "Adicionar Novo Responsável";
const DESCRIPTION = "Preencha os detalhes para cadastrar um novo profissional.";

function NewResponsiblePageContent() {
  const onSuccess = useResponsibleFormShellSuccess("page");
  const onCancel = useResponsibleFormShellDismiss();

  return (
    <ResponsibleFormShell
      variant="page"
      title={TITLE}
      description={DESCRIPTION}
      pageHeaderTitle="Novo Responsável Técnico"
    >
      <ResponsibleForm
        currentItem={null}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </ResponsibleFormShell>
  );
}

export default function NewResponsiblePage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NewResponsiblePageContent />
    </Suspense>
  );
}
