"use client";

import { Suspense } from "react";
import { CompanyForm } from "../company-form";
import {
  CompanyFormModalSuspenseFallback,
  CompanyFormShell,
  useCompanyFormShellDismiss,
  useCompanyFormShellSuccess,
} from "../company-form-shell";

const TITLE = "Adicionar Nova Empresa Responsável";
const DESCRIPTION = "Preencha os detalhes para cadastrar uma nova empresa.";

function NewCompanyModalContent() {
  const onSuccess = useCompanyFormShellSuccess("modal");
  const onCancel = useCompanyFormShellDismiss();

  return (
    <CompanyFormShell variant="modal" title={TITLE} description={DESCRIPTION}>
      <CompanyForm
        currentItem={null}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </CompanyFormShell>
  );
}

export function NewCompanyModalView() {
  return (
    <Suspense fallback={<CompanyFormModalSuspenseFallback />}>
      <NewCompanyModalContent />
    </Suspense>
  );
}
