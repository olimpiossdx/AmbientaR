"use client";

import { Suspense } from "react";
import { CompanyForm } from "../company-form";
import { useCadastroGestaoWriteGuard } from "@/hooks/use-cadastro-gestao-write-guard";
import {
  CompanyFormPageGuardFallback,
  CompanyFormShell,
  useCompanyFormShellDismiss,
  useCompanyFormShellSuccess,
} from "../company-form-shell";

const TITLE = "Adicionar Nova Empresa";
const DESCRIPTION =
  "Preencha os detalhes para cadastrar uma nova empresa parceira.";

function NewCompanyPageContent() {
  const { blocked, isInitialized } = useCadastroGestaoWriteGuard(
    "/responsible-company",
  );
  const onSuccess = useCompanyFormShellSuccess("page");
  const onCancel = useCompanyFormShellDismiss();

  if (!isInitialized) {
    return <CompanyFormPageGuardFallback pageHeaderTitle="Nova Empresa" />;
  }
  if (blocked) return null;

  return (
    <CompanyFormShell
      variant="page"
      title={TITLE}
      description={DESCRIPTION}
      pageHeaderTitle="Nova Empresa Responsável"
    >
      <CompanyForm
        currentItem={null}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </CompanyFormShell>
  );
}

export default function NewCompanyPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NewCompanyPageContent />
    </Suspense>
  );
}
