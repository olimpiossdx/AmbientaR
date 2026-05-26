import { NextRequest, NextResponse } from 'next/server';
import { adminApiErrorNextResponse, requireAdminApiAuth } from '@/lib/api-auth';
import { syncAllStudyFormSchemaCaches } from '@/lib/study-form-schema-sync';

/**
 * POST /api/studies/sync-form-schemas
 * Pré-gera cache de schemas TR (admin). Body opcional: { dryRun?, only?: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminApiAuth(request);
  } catch (e) {
    return adminApiErrorNextResponse(e);
  }

  let dryRun = false;
  let only: string[] | undefined;
  try {
    const body = await request.json();
    if (body && typeof body === 'object') {
      dryRun = Boolean(body.dryRun);
      if (Array.isArray(body.only)) {
        only = body.only.map((s: unknown) => String(s).trim()).filter(Boolean);
      }
    }
  } catch {
    // body vazio — ok
  }

  const report = await syncAllStudyFormSchemaCaches({ dryRun, refresh: true, only });

  return NextResponse.json({
    success: true,
    report,
  });
}
