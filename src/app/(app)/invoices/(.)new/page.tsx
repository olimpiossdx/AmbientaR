"use client";

import { Suspense } from "react";
import { InvoiceForm } from "../invoice-form";
import {
  InvoiceFormModalSuspenseFallback,
  InvoiceFormShell,
  useInvoiceFormShellDismiss,
  useInvoiceFormShellSuccess,
} from "../invoice-form-shell";

const TITLE = "Adicionar Nova Fatura";
const DESCRIPTION = "Preencha os detalhes para criar uma nova fatura.";

function NewInvoiceModalContent() {
  const onSuccess = useInvoiceFormShellSuccess("modal");
  const onCancel = useInvoiceFormShellDismiss();

  return (
    <InvoiceFormShell variant="modal" title={TITLE} description={DESCRIPTION}>
      <InvoiceForm
        currentItem={null}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </InvoiceFormShell>
  );
}

export default function NewInvoiceModal() {
  return (
    <Suspense fallback={<InvoiceFormModalSuspenseFallback />}>
      <NewInvoiceModalContent />
    </Suspense>
  );
}
