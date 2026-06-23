"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { InvoiceForm } from "../../invoice-form";
import { useDoc, useFirebase, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Invoice } from "@/lib/types";
import {
  InvoiceFormModalSuspenseFallback,
  InvoiceFormShell,
  useInvoiceFormShellDismiss,
  useInvoiceFormShellSuccess,
} from "../../invoice-form-shell";

const TITLE = "Editar Fatura";
const DESCRIPTION = "Atualize os detalhes da fatura abaixo.";
const NOT_FOUND = "Fatura não encontrada.";

function EditInvoiceModalContent() {
  const params = useParams();
  const itemId = (params?.id as string | undefined) ?? "";
  const onSuccess = useInvoiceFormShellSuccess("modal");
  const onCancel = useInvoiceFormShellDismiss();

  const { firestore } = useFirebase();

  const itemDocRef = useMemoFirebase(() => {
    if (!firestore || !itemId) return null;
    return doc(firestore, "invoices", itemId);
  }, [firestore, itemId]);

  const { data: item, isLoading } = useDoc<Invoice>(itemDocRef);

  return (
    <InvoiceFormShell
      variant="modal"
      title={TITLE}
      description={DESCRIPTION}
      isLoading={isLoading}
      notFoundMessage={!item && !isLoading ? NOT_FOUND : undefined}
    >
      {item ? (
        <InvoiceForm
          currentItem={item}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      ) : null}
    </InvoiceFormShell>
  );
}

export default function EditInvoiceModal() {
  return (
    <Suspense fallback={<InvoiceFormModalSuspenseFallback />}>
      <EditInvoiceModalContent />
    </Suspense>
  );
}
