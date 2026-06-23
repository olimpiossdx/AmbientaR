"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { ResponsibleForm } from "../../responsible-form";
import { useDoc, useFirebase, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { TechnicalResponsible } from "@/lib/types";
import {
  ResponsibleFormModalSuspenseFallback,
  ResponsibleFormShell,
  useResponsibleFormShellDismiss,
  useResponsibleFormShellSuccess,
} from "../../responsible-form-shell";

const TITLE = "Editar Responsável";
const DESCRIPTION = "Atualize os detalhes do profissional.";
const NOT_FOUND = "Responsável não encontrado.";

function EditResponsibleModalContent() {
  const params = useParams();
  const itemId = (params?.id as string | undefined) ?? "";
  const onSuccess = useResponsibleFormShellSuccess("modal");
  const onCancel = useResponsibleFormShellDismiss();

  const { firestore } = useFirebase();

  const itemDocRef = useMemoFirebase(() => {
    if (!firestore || !itemId) return null;
    return doc(firestore, "technicalResponsibles", itemId);
  }, [firestore, itemId]);

  const { data: item, isLoading } = useDoc<TechnicalResponsible>(itemDocRef);

  return (
    <ResponsibleFormShell
      variant="modal"
      title={TITLE}
      description={DESCRIPTION}
      isLoading={isLoading}
      notFoundMessage={!item && !isLoading ? NOT_FOUND : undefined}
    >
      {item ? (
        <ResponsibleForm
          currentItem={item}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      ) : null}
    </ResponsibleFormShell>
  );
}

export default function EditResponsibleModal() {
  return (
    <Suspense fallback={<ResponsibleFormModalSuspenseFallback />}>
      <EditResponsibleModalContent />
    </Suspense>
  );
}
