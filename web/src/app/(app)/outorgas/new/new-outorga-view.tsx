"use client";

import { Suspense } from "react";
import { OutorgaForm } from "../outorga-form";
import {
  OutorgaFormShell,
  useOutorgaFormShellSuccess,
} from "../outorga-form-shell";

const TITLE = "Adicionar nova outorga";
const DESCRIPTION = "Preencha os detalhes para criar uma nova outorga.";

function NewOutorgaPageContent() {
  const onSuccess = useOutorgaFormShellSuccess("page");

  return (
    <OutorgaFormShell
      variant="page"
      title={TITLE}
      description={DESCRIPTION}
      pageHeaderTitle="Nova outorga"
    >
      <OutorgaForm currentItem={null} onSuccess={onSuccess} />
    </OutorgaFormShell>
  );
}

export function NewOutorgaView() {
  return (
    <Suspense fallback={<div>Carregando…</div>}>
      <NewOutorgaPageContent />
    </Suspense>
  );
}
