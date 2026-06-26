"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { ResponsibleForm } from "../../responsible-form";
import { useDoc, useFirebase, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { TechnicalResponsible } from "@/lib/types";
import {
  ResponsibleFormShell,
  useResponsibleFormShellDismiss,
  useResponsibleFormShellSuccess,
} from "../../responsible-form-shell";

const TITLE = "Editar Responsável Técnico";
const DESCRIPTION = "Atualize os detalhes do profissional abaixo.";
const NOT_FOUND =
  "O registro que você está tentando editar não foi encontrado.";

function EditResponsiblePageContent() {
  const params = useParams();
  const itemId = (params?.id as string | undefined) ?? "";
  const onSuccess = useResponsibleFormShellSuccess("page");
  const onCancel = useResponsibleFormShellDismiss();

  const { firestore } = useFirebase();

  const itemDocRef = useMemoFirebase(() => {
    if (!firestore || !itemId) return null;
    return doc(firestore, "technicalResponsibles", itemId);
  }, [firestore, itemId]);

  const { data: item, isLoading } = useDoc<TechnicalResponsible>(itemDocRef);

  return (
    <ResponsibleFormShell
      variant="page"
      title={TITLE}
      description={DESCRIPTION}
      pageHeaderTitle={`Editando Responsável: ${item?.name || "..."}`}
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

export function EditResponsibleView() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EditResponsiblePageContent />
    </Suspense>
  );
}
