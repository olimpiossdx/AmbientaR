"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { OutorgaForm } from "../../outorga-form";
import { useDoc, useFirebase, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { WaterPermit } from "@/lib/types";
import {
  OutorgaFormModalSuspenseFallback,
  OutorgaFormShell,
  useOutorgaFormShellSuccess,
} from "../../outorga-form-shell";

const TITLE = "Editar Outorga";
const DESCRIPTION = "Atualize os detalhes da outorga abaixo.";
const NOT_FOUND = "Outorga não encontrada.";

function EditOutorgaModalContent() {
  const params = useParams();
  const itemId = (params?.id as string | undefined) ?? "";
  const onSuccess = useOutorgaFormShellSuccess("modal");

  const { firestore } = useFirebase();

  const itemDocRef = useMemoFirebase(() => {
    if (!firestore || !itemId) return null;
    return doc(firestore, "outorgas", itemId);
  }, [firestore, itemId]);

  const { data: item, isLoading } = useDoc<WaterPermit>(itemDocRef);

  return (
    <OutorgaFormShell
      variant="modal"
      title={TITLE}
      description={DESCRIPTION}
      isLoading={isLoading}
      notFoundMessage={!item && !isLoading ? NOT_FOUND : undefined}
    >
      {item ? <OutorgaForm currentItem={item} onSuccess={onSuccess} /> : null}
    </OutorgaFormShell>
  );
}

export function EditOutorgaModalView() {
  return (
    <Suspense fallback={<OutorgaFormModalSuspenseFallback />}>
      <EditOutorgaModalContent />
    </Suspense>
  );
}
