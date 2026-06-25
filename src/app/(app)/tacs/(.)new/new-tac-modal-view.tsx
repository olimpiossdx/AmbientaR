"use client";

import { Suspense } from "react";
import { TacForm } from "../tac-form";
import {
  TacFormModalSuspenseFallback,
  TacFormShell,
  useTacFormShellSuccess,
} from "../tac-form-shell";

const TITLE = "Adicionar Novo TAC";
const DESCRIPTION =
  "Preencha os dados do Termo de Ajustamento de Conduta.";

function NewTacModalContent() {
  const onSuccess = useTacFormShellSuccess("modal");

  return (
    <TacFormShell variant="modal" title={TITLE} description={DESCRIPTION}>
      <TacForm currentTac={null} onSuccess={onSuccess} />
    </TacFormShell>
  );
}

export function NewTacModalView() {
  return (
    <Suspense fallback={<TacFormModalSuspenseFallback />}>
      <NewTacModalContent />
    </Suspense>
  );
}
