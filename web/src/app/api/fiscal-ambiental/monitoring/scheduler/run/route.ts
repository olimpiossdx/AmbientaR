import { NextResponse } from "next/server";
import { isFadEnabled } from "@/lib/deploy-flags";
import { runScheduledMonitoringJobs } from "@/lib/fiscal-ambiental/monitoring-scheduler";
import { handleFadApiError } from "../../../_fad-api-guard";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isFadCronAuthorized(req: Request): boolean {
  const secret = process.env.FAD_MONITORING_CRON_SECRET?.trim();
  if (!secret) return false;
  return req.headers.get("x-fad-cron-secret")?.trim() === secret;
}

/**
 * Executa regras de monitoramento vencidas (todas os workspaces).
 * Agendador externo: header `x-fad-cron-secret` = FAD_MONITORING_CRON_SECRET.
 */
export async function POST(req: Request) {
  try {
    if (!isFadEnabled()) {
      return NextResponse.json(
        { ok: false, error: { code: "FAD_DISABLED", message: "FAD desativado." } },
        { status: 503 },
      );
    }

    if (!isFadCronAuthorized(req)) {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Cron não autorizado." } },
        { status: 401 },
      );
    }

    const data = await runScheduledMonitoringJobs();
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return handleFadApiError(err);
  }
}
