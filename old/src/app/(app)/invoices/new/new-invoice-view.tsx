"use client";

import { Suspense } from "react";
import { InvoiceForm } from "../invoice-form";
import {
  InvoiceFormShell,
  useInvoiceFormShellDismiss,
  useInvoiceFormShellSuccess,
} from "../invoice-form-shell";

const TITLE = "Adicionar Nova Fatura";
const DESCRIPTION = "Preencha os detalhes para criar uma nova fatura.";

function NewInvoicePageContent() {
  const onSuccess = useInvoiceFormShellSuccess("page");
  const onCancel = useInvoiceFormShellDismiss();

  return (
    <InvoiceFormShell
      variant="page"
      title={TITLE}
      description={DESCRIPTION}
      pageHeaderTitle="Nova Fatura"
    >
      <InvoiceForm
        currentItem={null}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </InvoiceFormShell>
  );
}

export function NewInvoiceView() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NewInvoicePageContent />
    </Suspense>
  );
}
