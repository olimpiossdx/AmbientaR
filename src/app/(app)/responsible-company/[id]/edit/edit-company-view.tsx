"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { CompanyForm } from "../../company-form";
import { useDoc, useFirebase, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { EnvironmentalCompany } from "@/lib/types";
import { useCadastroGestaoWriteGuard } from "@/hooks/use-cadastro-gestao-write-guard";
import {
  CompanyFormPageGuardFallback,
  CompanyFormShell,
  useCompanyFormShellDismiss,
  useCompanyFormShellSuccess,
} from "../../company-form-shell";

const TITLE = "Editar Empresa";
const DESCRIPTION = "Atualize os detalhes da empresa abaixo.";
const NOT_FOUND =
  "O registro que você está tentando editar não foi encontrado.";

function EditCompanyPageContent() {
  const params = useParams();
  const itemId = (params?.id as string | undefined) ?? "";
  const { blocked, isInitialized } = useCadastroGestaoWriteGuard(
    "/responsible-company",
  );
  const onSuccess = useCompanyFormShellSuccess("page");
  const onCancel = useCompanyFormShellDismiss();

  const { firestore } = useFirebase();

  const itemDocRef = useMemoFirebase(() => {
    if (!firestore || !itemId) return null;
    return doc(firestore, "environmentalCompanies", itemId);
  }, [firestore, itemId]);

  const { data: item, isLoading } = useDoc<EnvironmentalCompany>(itemDocRef);

  if (!isInitialized) {
    return <CompanyFormPageGuardFallback pageHeaderTitle="Carregando..." />;
  }
  if (blocked) return null;

  return (
    <CompanyFormShell
      variant="page"
      title={TITLE}
      description={DESCRIPTION}
      pageHeaderTitle={`Editando Empresa: ${item?.name || "..."}`}
      isLoading={isLoading}
      notFoundMessage={!item && !isLoading ? NOT_FOUND : undefined}
    >
      {item ? (
        <CompanyForm
          currentItem={item}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      ) : null}
    </CompanyFormShell>
  );
}

export function EditCompanyView() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EditCompanyPageContent />
    </Suspense>
  );
}
