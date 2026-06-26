import { NextResponse } from "next/server";
import { isFadEnabled } from "@/lib/deploy-flags";
import {
  apiAuthErrorResponse,
  apiUnauthorizedResponse,
  requireAuthenticatedApi,
} from "@/lib/api-auth";

export function fadDisabledResponse() {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "FAD_DISABLED",
        message: "Fiscal Ambiental Digital está desativado neste ambiente.",
      },
    },
    { status: 503 },
  );
}

export async function requireFadApiAuth(request: Request) {
  if (!isFadEnabled()) {
    throw Object.assign(new Error("FAD_DISABLED"), { status: 503 });
  }
  return requireAuthenticatedApi(request);
}

export function handleFadApiError(err: unknown) {
  if (err instanceof Error && err.message === "FAD_DISABLED") {
    return fadDisabledResponse();
  }
  const message = err instanceof Error ? err.message : "Não autorizado";
  if (message.includes("Sessão") || message.includes("token")) {
    return apiUnauthorizedResponse(message);
  }
  return apiAuthErrorResponse(err);
}
