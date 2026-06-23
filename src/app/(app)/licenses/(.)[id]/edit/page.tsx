"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { LicenseForm } from "../../license-form";
import { useDoc, useFirebase, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { License } from "@/lib/types";
import {
  LicenseFormModalSuspenseFallback,
  LicenseFormShell,
  useLicenseFormShellSuccess,
} from "../../license-form-shell";

const TITLE = "Editar Licença";
const DESCRIPTION = "Atualize as informações da licença abaixo.";
const NOT_FOUND = "Licença não encontrada.";

function EditLicenseModalContent() {
  const params = useParams();
  const itemId = (params?.id as string | undefined) ?? "";
  const onSuccess = useLicenseFormShellSuccess("modal");

  const { firestore } = useFirebase();

  const itemDocRef = useMemoFirebase(() => {
    if (!firestore || !itemId) return null;
    return doc(firestore, "licenses", itemId);
  }, [firestore, itemId]);

  const { data: item, isLoading } = useDoc<License>(itemDocRef);

  return (
    <LicenseFormShell
      variant="modal"
      title={TITLE}
      description={DESCRIPTION}
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

export default function EditLicenseModal() {
  return (
    <Suspense fallback={<LicenseFormModalSuspenseFallback />}>
      <EditLicenseModalContent />
    </Suspense>
  );
}
