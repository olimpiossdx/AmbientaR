"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { InvoiceForm } from "../../invoice-form";
import { useDoc, useFirebase, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Invoice } from "@/lib/types";
import {
  InvoiceFormShell,
  useInvoiceFormShellSuccess,
} from "../../invoice-form-shell";

const TITLE = "Editar Fatura";
const DESCRIPTION = "Atualize os detalhes da fatura abaixo.";
const NOT_FOUND =
  "O registro que você está tentando editar não foi encontrado.";

function EditInvoicePageContent() {
  const params = useParams();
  const itemId = (params?.id as string | undefined) ?? "";
  const onSuccess = useInvoiceFormShellSuccess("page");

  const { firestore } = useFirebase();

  const itemDocRef = useMemoFirebase(() => {
    if (!firestore || !itemId) return null;
    return doc(firestore, "invoices", itemId);
  }, [firestore, itemId]);

  const { data: item, isLoading } = useDoc<Invoice>(itemDocRef);

  return (
    <InvoiceFormShell
      variant="page"
      title={TITLE}
      description={DESCRIPTION}
      pageHeaderTitle={`Editando Fatura: ${item?.invoiceNumber || "..."}`}
      isLoading={isLoading}
      notFoundMessage={!item && !isLoading ? NOT_FOUND : undefined}
    >
      {item ? <InvoiceForm currentItem={item} onSuccess={onSuccess} /> : null}
    </InvoiceFormShell>
  );
}

export function EditInvoiceView() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EditInvoicePageContent />
    </Suspense>
  );
}
