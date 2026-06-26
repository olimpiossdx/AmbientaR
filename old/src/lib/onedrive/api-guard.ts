import { NextResponse } from "next/server";
import {
  isMicrosoftGraphConfigured,
  isOnedriveSyncEnabled,
} from "@/lib/onedrive/deploy-flags";

export function onedriveDisabledResponse() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Integração OneDrive desativada. Defina ONEDRIVE_SYNC_ENABLED=true no .env.local.",
    },
    { status: 503 },
  );
}

export function onedriveNotConfiguredResponse() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Microsoft Graph não configurado. Verifique MICROSOFT_GRAPH_* no .env.local.",
    },
    { status: 503 },
  );
}

export function assertOnedriveReady():
  | { ok: true }
  | { ok: false; response: NextResponse } {
  if (!isOnedriveSyncEnabled()) {
    return { ok: false, response: onedriveDisabledResponse() };
  }
  if (!isMicrosoftGraphConfigured()) {
    return { ok: false, response: onedriveNotConfiguredResponse() };
  }
  return { ok: true };
}

/** Autofill por CPF: só exige Microsoft Graph (não depende de ONEDRIVE_SYNC_ENABLED). */
export function assertGraphReadyForAutofill():
  | { ok: true }
  | { ok: false; response: NextResponse } {
  if (!isMicrosoftGraphConfigured()) {
    return { ok: false, response: onedriveNotConfiguredResponse() };
  }
  return { ok: true };
}
