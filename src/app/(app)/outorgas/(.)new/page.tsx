"use client";

import { Suspense } from "react";
import { OutorgaForm } from "../outorga-form";
import {
  OutorgaFormModalSuspenseFallback,
  OutorgaFormShell,
  useOutorgaFormShellSuccess,
} from "../outorga-form-shell";

const TITLE = "Adicionar Nova Outorga";
const DESCRIPTION = "Preencha os detalhes para criar uma nova outorga.";

function NewOutorgaModalContent() {
  const onSuccess = useOutorgaFormShellSuccess("modal");

  return (
    <OutorgaFormShell variant="modal" title={TITLE} description={DESCRIPTION}>
      <OutorgaForm currentItem={null} onSuccess={onSuccess} />
    </OutorgaFormShell>
  );
}

export default function NewOutorgaModal() {
  return (
    <Suspense fallback={<OutorgaFormModalSuspenseFallback />}>
      <NewOutorgaModalContent />
    </Suspense>
  );
}
