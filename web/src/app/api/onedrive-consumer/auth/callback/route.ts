import { NextRequest, NextResponse } from "next/server";
import {
  consumeOneDriveAuthState,
  exchangeCodeForDelegatedToken,
  getCallbackRedirectTarget,
} from "@/lib/onedrive/consumer-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const returnPath =
    request.nextUrl.searchParams.get("returnPath")?.trim() ||
    "/ai-lab/cloud-library";

  try {
    const error = request.nextUrl.searchParams.get("error");
    const errorDescription =
      request.nextUrl.searchParams.get("error_description") || undefined;
    if (error) {
      const target = getCallbackRedirectTarget({
        returnPath,
        ok: false,
        message: errorDescription || error,
      });
      return NextResponse.redirect(new URL(target, request.url));
    }

    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    if (!code || !state) {
      throw new Error("Resposta OAuth incompleta (code/state).");
    }

    const pending = await consumeOneDriveAuthState(state);
    await exchangeCodeForDelegatedToken({ code, uid: pending.uid });

    const target = getCallbackRedirectTarget({
      returnPath: pending.returnPath || returnPath,
      ok: true,
      message: "Conta Microsoft ligada com sucesso.",
    });
    return NextResponse.redirect(new URL(target, request.url));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const target = getCallbackRedirectTarget({
      returnPath,
      ok: false,
      message,
    });
    return NextResponse.redirect(new URL(target, request.url));
  }
}
