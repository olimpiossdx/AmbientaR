import { NextResponse } from "next/server";

/** Rotas `/api/uploads/*` legadas (disco local). Desativadas no App Hosting. */
export const LEGACY_DISK_UPLOAD_MESSAGE =
  "Upload por disco desativado em produção. Use o envio via Firebase Storage no aplicativo.";

export function legacyDiskUploadDisabledResponse() {
  return NextResponse.json(
    { success: false, error: LEGACY_DISK_UPLOAD_MESSAGE },
    { status: 410 },
  );
}

export async function POST() {
  return legacyDiskUploadDisabledResponse();
}
