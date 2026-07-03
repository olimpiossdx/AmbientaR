"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { TacForm } from "../../tac-form";
import { useDoc, useFirebase, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Tac } from "@/lib/types";
import {
  TacFormModalSuspenseFallback,
  TacFormShell,
  useTacFormShellSuccess,
} from "../../tac-form-shell";

const TITLE = "Editar TAC";
const DESCRIPTION = "Atualize os detalhes do Termo de Ajustamento de Conduta.";
const NOT_FOUND =
  "O registro que você está tentando editar não foi encontrado.";

function EditTacModalContent() {
  const params = useParams();
  const itemId = (params?.id as string | undefined) ?? "";
  const onSuccess = useTacFormShellSuccess("modal");

  const { firestore } = useFirebase();

  const itemDocRef = useMemoFirebase(() => {
    if (!firestore || !itemId) return null;
    return doc(firestore, "tacs", itemId);
  }, [firestore, itemId]);

  const { data: item, isLoading } = useDoc<Tac>(itemDocRef);

  return (
    <TacFormShell
      variant="modal"
      title={TITLE}
      description={DESCRIPTION}
      isLoading={isLoading}
      notFoundMessage={!item && !isLoading ? NOT_FOUND : undefined}
    >
      {item ? (
        <TacForm currentTac={item} onSuccess={onSuccess} hideHeader />
      ) : null}
    </TacFormShell>
  );
}

export function EditTacModalView() {
  return (
    <Suspense fallback={<TacFormModalSuspenseFallback />}>
      <EditTacModalContent />
    </Suspense>
  );
}
