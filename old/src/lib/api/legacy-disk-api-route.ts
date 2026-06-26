import { NextResponse } from "next/server";

/** APIs que gravavam em `public/` (disco local). Indisponíveis no App Hosting. */
export const LEGACY_DISK_API_MESSAGE =
  "Este endpoint de disco local foi desativado. Use Firebase Storage e Firestore na aplicação.";

export function legacyDiskApiDisabledResponse() {
  return NextResponse.json(
    { success: false, error: LEGACY_DISK_API_MESSAGE },
    { status: 410 },
  );
}

export async function GET() {
  return legacyDiskApiDisabledResponse();
}

export async function POST() {
  return legacyDiskApiDisabledResponse();
}

export async function PATCH() {
  return legacyDiskApiDisabledResponse();
}

export async function DELETE() {
  return legacyDiskApiDisabledResponse();
}
