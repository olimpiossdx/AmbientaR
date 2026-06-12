import { NextResponse } from "next/server";
import { FAD_ATTRIBUTION, FISCAL_AMBIENTAL_FLAGS } from "@/lib/fiscal-ambiental/constants";
import type { FadModuleSettings } from "@/lib/fiscal-ambiental/types";
import {
  isFadEnabled,
  isFadSigCrosscheckEnabled,
  isFadStandaloneMode,
} from "@/lib/deploy-flags";
import { handleFadApiError, requireFadApiAuth } from "../_fad-api-guard";

export async function GET(req: Request) {
  try {
    await requireFadApiAuth(req);

    const data: FadModuleSettings = {
      enabled: isFadEnabled(),
      standaloneMode: isFadStandaloneMode(),
      sigCrosscheckEnabled: isFadSigCrosscheckEnabled(),
      monitoringCronConfigured: Boolean(process.env.FAD_MONITORING_CRON_SECRET?.trim()),
      satelliteWorkerConfigured: Boolean(process.env.FISCAL_SATELLITE_WORKER_URL?.trim()),
      intelligenceWorkerConfigured: Boolean(process.env.FISCAL_INTELLIGENCE_WORKER_URL?.trim()),
      satelliteWorkerUrl: process.env.FISCAL_SATELLITE_WORKER_URL?.trim() || undefined,
      intelligenceWorkerUrl: process.env.FISCAL_INTELLIGENCE_WORKER_URL?.trim() || undefined,
      workerSecretConfigured: Boolean(process.env.WORKER_SHARED_SECRET?.trim()),
      flags: FISCAL_AMBIENTAL_FLAGS,
      attribution: FAD_ATTRIBUTION,
    };

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return handleFadApiError(err);
  }
}
