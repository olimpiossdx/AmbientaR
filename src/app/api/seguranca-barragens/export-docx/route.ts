/**
 * POST /api/seguranca-barragens/export-docx
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { AmbientalContext, EstudoSegurancaBarragem } from '@/lib/types';
import { buildPlaceholderDataForLaudo } from '@/lib/docx-placeholders';
import { buildSegurancaPlaceholderExtras } from '@/lib/seguranca-barragens/export-placeholders';
import { mergePlaceholderData } from '@/lib/geospatial/geo-placeholders';
import { apiAuthErrorResponse, requireAuthenticatedApi } from '@/lib/api-auth';
import {
  brandingApiErrorResponse,
  finalizeOfficialDocxBuffer,
} from '@/lib/branding/finalize-server-docx';

async function loadTemplateBuffer(
  slug: string,
  templateUrl: string | undefined,
): Promise<Buffer> {
  if (templateUrl && /^https?:\/\//i.test(templateUrl)) {
    const res = await fetch(templateUrl);
    if (!res.ok) {
      throw new Error(`Falha ao baixar template (HTTP ${res.status}).`);
    }
    return Buffer.from(await res.arrayBuffer());
  }
  return fs.readFile(path.join(process.cwd(), 'public', 'templates', slug, 'template.docx'));
}

export async function POST(request: NextRequest) {
  try {
    await requireAuthenticatedApi(request);
  } catch (e) {
    return apiAuthErrorResponse(e);
  }

  try {
    const body = await request.json();
    const { context, estudo, templateUrl, estudoId } = body as {
      context?: AmbientalContext;
      estudo?: EstudoSegurancaBarragem;
      templateUrl?: string;
      estudoId?: string;
    };

    if (!context || !estudo) {
      return NextResponse.json(
        { success: false, error: 'Envie context e estudo.' },
        { status: 400 },
      );
    }

    let content: Buffer;
    try {
      content = await loadTemplateBuffer('seguranca-barragens', templateUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar template.';
      return NextResponse.json(
        {
          success: false,
          error: `${msg} Envie o DOCX em Configurações > Templates (seguranca-barragens).`,
        },
        { status: 404 },
      );
    }

    const PizZip = (await import('pizzip')).default;
    const Docxtemplater = (await import('docxtemplater')).default;
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      delimiters: { start: '{{', end: '}}' },
      paragraphLoop: true,
      linebreaks: true,
    });

    const base = buildPlaceholderDataForLaudo(context);
    const data = mergePlaceholderData(base, buildSegurancaPlaceholderExtras(estudo));
    doc.render(data);

    const rawBuf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    }) as Buffer;

    const buf = await finalizeOfficialDocxBuffer(rawBuf);
    const fileName = `seguranca_barragem_${estudoId ?? estudo.id ?? Date.now()}.docx`;

    return new NextResponse(buf as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (e) {
    console.error('POST /api/seguranca-barragens/export-docx:', e);
    const brandedErr = brandingApiErrorResponse(e);
    if (brandedErr.status !== 500) {
      return NextResponse.json(brandedErr.body, { status: brandedErr.status });
    }
    return NextResponse.json(
      { success: false, error: (e as Error).message ?? 'Erro ao gerar DOCX.' },
      { status: 500 },
    );
  }
}
