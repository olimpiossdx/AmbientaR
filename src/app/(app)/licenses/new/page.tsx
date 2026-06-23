"use client";

import { Suspense } from "react";
import { LicenseForm } from "../license-form";
import {
  LicenseFormShell,
  useLicenseFormShellSuccess,
} from "../license-form-shell";

const TITLE = "Adicionar Nova Licença";
const DESCRIPTION = "Preencha os detalhes para criar uma nova licença.";

function NewLicensePageContent() {
  const onSuccess = useLicenseFormShellSuccess("page");

  return (
    <LicenseFormShell
      variant="page"
      title={TITLE}
      description={DESCRIPTION}
      pageHeaderTitle="Nova Licença Ambiental"
    >
      <LicenseForm currentLicense={null} onSuccess={onSuccess} />
    </LicenseFormShell>
  );
}

export default function NewLicensePage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NewLicensePageContent />
    </Suspense>
  );
}
