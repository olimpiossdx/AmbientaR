import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null) return defaultValue;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

/**
 * Modo de estabilização para deploy:
 * - por padrão, bloqueia chamadas a /api/*
 * - habilite apenas quando precisar: ENABLE_NEXT_API_ROUTES=true
 */
/** Por omissão ativo: uploads e APIs internas precisam de `/api/*`. Defina `false` para voltar ao modo de bloqueio total. */
const ENABLE_NEXT_API_ROUTES = parseBooleanEnv(
  process.env.ENABLE_NEXT_API_ROUTES,
  true,
);

export function middleware(request: NextRequest) {
  if (ENABLE_NEXT_API_ROUTES) {
    return NextResponse.next();
  }

  return NextResponse.json(
    {
      success: false,
      error:
        "APIs internas desativadas temporariamente para estabilização do deploy.",
      path: request.nextUrl.pathname,
    },
    { status: 503 },
  );
}

export const config = {
  matcher: ["/api/:path*"],
};
