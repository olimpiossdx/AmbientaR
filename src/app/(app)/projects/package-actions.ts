"use server";

import { checkPackageLimitForToken } from "@/lib/package-enforcement-server";

export async function assertCanCreateEmpreendimentoAction(
  idToken: string | null | undefined,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const result = await checkPackageLimitForToken(
    idToken,
    "create_empreendimento",
  );
  if (result.ok) return { ok: true };
  return { ok: false, message: result.message };
}
