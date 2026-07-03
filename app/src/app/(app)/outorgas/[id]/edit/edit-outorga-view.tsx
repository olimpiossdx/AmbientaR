"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { OutorgaForm } from "../../outorga-form";
import { useDoc, useFirebase, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { WaterPermit } from "@/lib/types";
import {
  OutorgaFormShell,
  useOutorgaFormShellSuccess,
} from "../../outorga-form-shell";

const TITLE = "Editar outorga";
const DESCRIPTION = "Atualize os detalhes da outorga abaixo.";
const NOT_FOUND =
  "O registro que você está tentando editar não foi encontrado.";

function EditOutorgaPageContent() {
  const params = useParams();
  const itemId = (params?.id as string | undefined) ?? "";
  const onSuccess = useOutorgaFormShellSuccess("page");

  const { firestore } = useFirebase();

  const itemDocRef = useMemoFirebase(() => {
    if (!firestore || !itemId) return null;
    return doc(firestore, "outorgas", itemId);
  }, [firestore, itemId]);

  const { data: item, isLoading } = useDoc<WaterPermit>(itemDocRef);

  return (
    <OutorgaFormShell
      variant="page"
      title={TITLE}
      description={DESCRIPTION}
      pageHeaderTitle={`Editando outorga: ${item?.permitNumber || item?.id || "..."}`}
      isLoading={isLoading}
      notFoundMessage={!item && !isLoading ? NOT_FOUND : undefined}
    >
      {item ? <OutorgaForm currentItem={item} onSuccess={onSuccess} /> : null}
    </OutorgaFormShell>
  );
}

export function EditOutorgaView() {
  return (
    <Suspense fallback={<div>Carregando…</div>}>
      <EditOutorgaPageContent />
    </Suspense>
  );
}
