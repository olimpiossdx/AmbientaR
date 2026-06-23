"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { CompanyForm } from "../../company-form";
import { useDoc, useFirebase, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { EnvironmentalCompany } from "@/lib/types";
import {
  CompanyFormModalSuspenseFallback,
  CompanyFormShell,
  useCompanyFormShellDismiss,
  useCompanyFormShellSuccess,
} from "../../company-form-shell";

const TITLE = "Editar Empresa";
const DESCRIPTION = "Atualize os detalhes da empresa abaixo.";
const NOT_FOUND = "Empresa não encontrada.";

function EditCompanyModalContent() {
  const params = useParams();
  const itemId = (params?.id as string | undefined) ?? "";
  const onSuccess = useCompanyFormShellSuccess("modal");
  const onCancel = useCompanyFormShellDismiss();

  const { firestore } = useFirebase();

  const itemDocRef = useMemoFirebase(() => {
    if (!firestore || !itemId) return null;
    return doc(firestore, "environmentalCompanies", itemId);
  }, [firestore, itemId]);

  const { data: item, isLoading } = useDoc<EnvironmentalCompany>(itemDocRef);

  return (
    <CompanyFormShell
      variant="modal"
      title={TITLE}
      description={DESCRIPTION}
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

export default function EditCompanyModal() {
  return (
    <Suspense fallback={<CompanyFormModalSuspenseFallback />}>
      <EditCompanyModalContent />
    </Suspense>
  );
}
