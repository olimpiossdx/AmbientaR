/**
 * POST /api/pea/import-feam-tr
 * Baixa documentos do catálogo FEAM (ou URL customizada) para termos de referencia/PEA.
 * Body: { ids?: string[], customUrl?: string, customFilename?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import {
  FEAM_TR_CATALOG,
  getFeamCatalogItem,
  type FeamTrCatalogItem,
} from '@/lib/pea/feam-tr-catalog';
import { getTermosReferenciaPathForStudy } from '@/lib/termos-referencia-config';
import {
  apiAuthErrorResponse,
  requireAuthenticatedApi,
} from '@/lib/api-auth';

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.\-áàâãéèêíïóôõúçÁÀÂÃÉÈÊÍÏÓÔÕÚÇ ]/gi, '_').slice(0, 120);
}

async function downloadToFile(url: string, destPath: string): Promise<{ ok: boolean; bytes: number; error?: string }> {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: '*/*',
      },
    });
    if (!res.ok) {
      return { ok: false, bytes: 0, error: `HTTP ${res.status}` };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 500) {
      return {
        ok: false,
        bytes: buf.length,
        error: 'Resposta muito pequena (portal pode exigir download manual no navegador).',
      };
    }
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.writeFile(destPath, buf);
    return { ok: true, bytes: buf.length };
  } catch (e) {
    return { ok: false, bytes: 0, error: (e as Error).message };
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    catalog: FEAM_TR_CATALOG,
    folder: getTermosReferenciaPathForStudy('pea'),
  });
}

export async function POST(request: NextRequest) {
  try {
    await requireAuthenticatedApi(request);
  } catch (e) {
    return apiAuthErrorResponse(e);
  }

  const dirPath = getTermosReferenciaPathForStudy('pea');
  if (!dirPath) {
    return NextResponse.json(
      { success: false, error: 'Pasta PEA não configurada em termos-referencia-config.' },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    ids?: string[];
    essenciaisOnly?: boolean;
    customUrl?: string;
    customFilename?: string;
  };

  const items: FeamTrCatalogItem[] = [];
  if (body.customUrl?.trim()) {
    const name =
      sanitizeFilename(body.customFilename?.trim() || 'FEAM-documento-custom') +
      (body.customUrl.includes('.pdf') ? '.pdf' : '.docx');
    items.push({
      id: 'custom',
      titulo: 'URL customizada',
      descricao: body.customUrl,
      formato: name.endsWith('.pdf') ? 'pdf' : 'docx',
      viewUrl: body.customUrl.trim(),
      filename: name,
    });
  } else if (body.essenciaisOnly) {
    items.push(...FEAM_TR_CATALOG.filter((i) => i.essencialPea));
  } else if (Array.isArray(body.ids) && body.ids.length > 0) {
    for (const id of body.ids) {
      const item = getFeamCatalogItem(id);
      if (item) items.push(item);
    }
  } else {
    items.push(...FEAM_TR_CATALOG.filter((i) => i.essencialPea));
  }

  const results: {
    id: string;
    titulo: string;
    filename: string;
    ok: boolean;
    bytes?: number;
    path?: string;
    error?: string;
    manualUrl?: string;
  }[] = [];

  for (const item of items) {
    const filename = sanitizeFilename(item.filename);
    const dest = path.join(dirPath, filename);
    const dl = await downloadToFile(item.viewUrl, dest);
    results.push({
      id: item.id,
      titulo: item.titulo,
      filename,
      ok: dl.ok,
      bytes: dl.bytes,
      path: dl.ok ? dest : undefined,
      error: dl.error,
      manualUrl: item.viewUrl,
    });
  }

  const okCount = results.filter((r) => r.ok).length;

  return NextResponse.json({
    success: okCount > 0,
    folder: dirPath,
    imported: okCount,
    total: results.length,
    results,
    hint:
      okCount < results.length
        ? 'Alguns ficheiros exigem download manual no site FEAM (botão Baixar na página do documento). Use os links manualUrl.'
        : undefined,
  });
}
