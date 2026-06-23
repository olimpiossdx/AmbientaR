"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { LicenseForm } from "../../license-form";
import { useDoc, useFirebase, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { License } from "@/lib/types";
import {
  LicenseFormShell,
  useLicenseFormShellSuccess,
} from "../../license-form-shell";

const TITLE = "Editar Licença";
const DESCRIPTION = "Atualize os detalhes da licença abaixo.";
const NOT_FOUND =
  "O registro que você está tentando editar não foi encontrado.";

function EditLicensePageContent() {
  const params = useParams();
  const itemId = (params?.id as string | undefined) ?? "";
  const onSuccess = useLicenseFormShellSuccess("page");

  const { firestore } = useFirebase();

  const itemDocRef = useMemoFirebase(() => {
    if (!firestore || !itemId) return null;
    return doc(firestore, "licenses", itemId);
  }, [firestore, itemId]);

  const { data: item, isLoading } = useDoc<License>(itemDocRef);

  return (
    <LicenseFormShell
      variant="page"
      title={TITLE}
      description={DESCRIPTION}
      pageHeaderTitle={`Editando Licença: ${item?.permitNumber || "..."}`}
      isLoading={isLoading}
      notFoundMessage={!item && !isLoading ? NOT_FOUND : undefined}
    >
      {item ? (
        <LicenseForm
          currentLicense={item}
          onSuccess={onSuccess}
          hideHeader
        />
      ) : null}
    </LicenseFormShell>
  );
}

export default function EditLicensePage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EditLicensePageContent />
    </Suspense>
  );
}
