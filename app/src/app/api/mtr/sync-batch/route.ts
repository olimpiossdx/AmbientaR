import { NextResponse } from "next/server";
import { isMtrConfigured } from "@/lib/mtr/mtr-client";
import { syncMtrBatchServer } from "@/lib/mtr/mtr-sync-server";
import { requireAuthenticatedApi, apiAuthErrorResponse } from "@/lib/api-auth";
import type { AppUser } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Body = {
  empreendedorIds?: string[];
  onlyAutoEnabled?: boolean;
};

const BATCH_ROLES = new Set([
  "admin",
  "technical",
  "gestor",
  "supervisor",
  "advogado",
]);

function isCronAuthorized(req: Request): boolean {
  const secret = process.env.MTR_SYNC_CRON_SECRET?.trim();
  if (!secret) return false;
  const header = req.headers.get("x-mtr-cron-secret")?.trim();
  return Boolean(header && header === secret);
}

/**
 * Sincroniza MTR em lote (servidor). Cron: header `x-mtr-cron-secret`.
 * Utilizadores internos podem sincronizar IDs específicos ou todos com auto-sync.
 */
export async function POST(req: Request) {
  const cron = isCronAuthorized(req);
  let user: AppUser | null = null;

  if (!cron) {
    try {
      user = await requireAuthenticatedApi(req);
    } catch (e) {
      return apiAuthErrorResponse(e);
    }
  }

  if (!isMtrConfigured()) {
    return NextResponse.json(
      { error: "MTR não configurado (MTR_CHAVE_FEAM)." },
      { status: 503 },
    );
  }

  let body: Body = {};
  try {
    const text = await req.text();
    if (text.trim()) body = JSON.parse(text) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const onlyAutoEnabled = cron ? true : body.onlyAutoEnabled ?? false;
  const empreendedorIds = body.empreendedorIds;

  if (!cron && user) {
    const canBatchAll =
      BATCH_ROLES.has(user.role) &&
      (!empreendedorIds || empreendedorIds.length === 0) &&
      onlyAutoEnabled;
    const canSpecific =
      empreendedorIds &&
      empreendedorIds.length > 0 &&
      BATCH_ROLES.has(user.role);
    const canPortalSingle =
      empreendedorIds?.length === 1 &&
      (user.role === "client" ||
        user.role === "cliente_autonomo" ||
        user.role === "representative" ||
        user.role === "consultor_representante");

    if (!canBatchAll && !canSpecific && !canPortalSingle) {
      return NextResponse.json({ error: "Sem permissão para sync em lote." }, { status: 403 });
    }
  }

  const ownerId = user?.id ?? "system-cron";

  try {
    const results = await syncMtrBatchServer({
      empreendedorIds,
      ownerId,
      onlyAutoEnabled,
    });
    const added = results.reduce((s, r) => s + r.added, 0);
    const errors = results.filter((r) => r.error).length;
    return NextResponse.json({
      success: true,
      added,
      errors,
      results,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro no sync MTR";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
