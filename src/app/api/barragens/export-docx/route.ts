/**
 * POST /api/barragens/export-docx
 * Gera DOCX do Projeto Técnico de Barragem a partir do template (Configurações > Templates ou public/templates/barragens).
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { AmbientalContext, ProjetoTecnicoBarragem } from '@/lib/types';
import { buildPlaceholderDataForLaudo } from '@/lib/docx-placeholders';
import { buildBarragemPlaceholderExtras } from '@/lib/barragem/barragem-placeholders';
import { mergePlaceholderData } from '@/lib/geospatial/geo-placeholders';
import {
  apiAuthErrorResponse,
  requireAuthenticatedApi,
} from '@/lib/api-auth';
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
      throw new Error(
        `Falha ao baixar template (HTTP ${res.status}). Verifique o upload em Configurações.`,
      );
    }
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
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
    const { context, projeto, templateUrl, projetoId } = body as {
      context?: AmbientalContext;
      projeto?: ProjetoTecnicoBarragem;
      templateUrl?: string;
      projetoId?: string;
    };

    if (!context || !projeto) {
      return NextResponse.json(
        { success: false, error: 'Envie context (contexto ambiental) e projeto.' },
        { status: 400 },
      );
    }

    let content: Buffer;
    try {
      content = await loadTemplateBuffer('barragens', templateUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar template.';
      return NextResponse.json(
        {
          success: false,
          error: `${msg} Envie o DOCX em Configurações > Templates (barragens) ou adicione public/templates/barragens/template.docx.`,
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
    const data = mergePlaceholderData(base, buildBarragemPlaceholderExtras(projeto));
    doc.render(data);

    const rawBuf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    }) as Buffer;

    const buf = await finalizeOfficialDocxBuffer(rawBuf);

    const fileName = `projeto_tecnico_barragem_${projetoId ?? projeto.id ?? Date.now()}.docx`;
    return new NextResponse(buf as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (e) {
    console.error('POST /api/barragens/export-docx:', e);
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
