"use client";

import { Suspense } from "react";
import { LicenseForm } from "../license-form";
import {
  LicenseFormModalSuspenseFallback,
  LicenseFormShell,
  useLicenseFormShellSuccess,
} from "../license-form-shell";

const TITLE = "Adicionar Nova Licença";
const DESCRIPTION = "Preencha os detalhes para criar uma nova licença.";

function NewLicenseModalContent() {
  const onSuccess = useLicenseFormShellSuccess("modal");

  return (
    <LicenseFormShell variant="modal" title={TITLE} description={DESCRIPTION}>
      <LicenseForm currentLicense={null} onSuccess={onSuccess} />
    </LicenseFormShell>
  );
}

export function NewLicenseModalView() {
  return (
    <Suspense fallback={<LicenseFormModalSuspenseFallback />}>
      <NewLicenseModalContent />
    </Suspense>
  );
}
