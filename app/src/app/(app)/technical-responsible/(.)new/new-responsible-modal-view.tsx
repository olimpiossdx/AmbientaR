"use client";

import { Suspense } from "react";
import { ResponsibleForm } from "../responsible-form";
import {
  ResponsibleFormModalSuspenseFallback,
  ResponsibleFormShell,
  useResponsibleFormShellDismiss,
  useResponsibleFormShellSuccess,
} from "../responsible-form-shell";

const TITLE = "Adicionar Novo Responsável";
const DESCRIPTION = "Preencha os detalhes do novo profissional.";

function NewResponsibleModalContent() {
  const onSuccess = useResponsibleFormShellSuccess("modal");
  const onCancel = useResponsibleFormShellDismiss();

  return (
    <ResponsibleFormShell variant="modal" title={TITLE} description={DESCRIPTION}>
      <ResponsibleForm
        currentItem={null}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </ResponsibleFormShell>
  );
}

export function NewResponsibleModalView() {
  return (
    <Suspense fallback={<ResponsibleFormModalSuspenseFallback />}>
      <NewResponsibleModalContent />
    </Suspense>
  );
}
