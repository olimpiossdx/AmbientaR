"use client";

import { Suspense } from "react";
import { TacForm } from "../tac-form";
import { TacFormShell, useTacFormShellSuccess } from "../tac-form-shell";

const TITLE = "Adicionar Novo TAC";
const DESCRIPTION =
  "Preencha os dados do Termo de Ajustamento de Conduta (GTAC/EcoSistemas MG).";

function NewTacPageContent() {
  const onSuccess = useTacFormShellSuccess("page");

  return (
    <TacFormShell
      variant="page"
      title={TITLE}
      description={DESCRIPTION}
      pageHeaderTitle="Novo TAC"
    >
      <TacForm currentTac={null} onSuccess={onSuccess} />
    </TacFormShell>
  );
}

export function NewTacView() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NewTacPageContent />
    </Suspense>
  );
}
