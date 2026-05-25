/**
 * Fase 3 – Motor de Relatórios.
 * POST /api/laudos/gerar-docx
 * Body: { laudoId: string, tipoEstudo: string, context: AmbientalContext }
 * Retorna o DOCX preenchido (download) ou erro.
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { AmbientalContext } from '@/lib/types';
import { buildPlaceholderDataForLaudo } from '@/lib/docx-placeholders';
import type { GeoAnalysisComplementOutput, WaveAAnalysisResult } from '@/lib/types/geo-wave-a';
import {
  apiAuthErrorResponse,
  requireAuthenticatedApi,
} from '@/lib/api-auth';

const TEMPLATE_SLUGS = [
  'rca', 'ptrf', 'prada', 'pia', 'eia-rima', 'las-ras', 'pca', 'pea',
  'reserva-legal', 'fauna', 'outorgas', 'barragens',
] as const;

function tipoEstudoToSlug(tipoEstudo: string): string {
  const normalized = tipoEstudo.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const slugMap: Record<string, string> = {
    rca: 'rca',
    pia: 'pia',
    pca: 'pca',
    prada: 'prada',
    inventarioflorestal: 'fauna',
    fauna: 'fauna',
    outorgas: 'outorgas',
    educacaoambiental: 'fauna',
    relatoriodiverso: 'rca',
    outro: 'rca',
  };
  return slugMap[normalized] ?? 'rca';
}

function getTemplatePath(slug: string): string {
  return path.join(process.cwd(), 'public', 'templates', slug, 'template.docx');
}

async function loadTemplateBuffer(
  slug: string,
  templateUrl: string | undefined,
): Promise<Buffer> {
  if (templateUrl && /^https?:\/\//i.test(templateUrl)) {
    const res = await fetch(templateUrl);
    if (!res.ok) {
      throw new Error(`Falha ao baixar template (HTTP ${res.status}). Verifique o upload em Configurações.`);
    }
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  }
  return fs.readFile(getTemplatePath(slug));
}

export async function POST(request: NextRequest) {
  try {
    await requireAuthenticatedApi(request);
  } catch (e) {
    return apiAuthErrorResponse(e);
  }

  try {
    const body = await request.json();
    const { laudoId, tipoEstudo, context, templateUrl, geoAnalysis, geoComplement } =
      body as {
      laudoId?: string;
      tipoEstudo?: string;
      context?: AmbientalContext;
      /** URL HTTPS do DOCX no Firebase Storage (Configurações → Templates). */
      templateUrl?: string;
      geoAnalysis?: WaveAAnalysisResult;
      geoComplement?: GeoAnalysisComplementOutput | null;
    };

    if (!context || typeof tipoEstudo !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Envie tipoEstudo e context (contexto ambiental).' },
        { status: 400 }
      );
    }

    const slug = tipoEstudoToSlug(tipoEstudo);
    if (!TEMPLATE_SLUGS.includes(slug as (typeof TEMPLATE_SLUGS)[number])) {
      return NextResponse.json(
        { success: false, error: `Tipo de estudo não suportado: ${tipoEstudo}. Use um dos tipos com template em Configurações > Templates.` },
        { status: 400 }
      );
    }

    let content: Buffer;
    try {
      content = await loadTemplateBuffer(slug, templateUrl);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Erro ao carregar template.';
      return NextResponse.json(
        {
          success: false,
          error: `${msg} Alternativa: envie o DOCX em Configurações > Templates (${slug}) ou adicione public/templates/${slug}/template.docx.`,
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

    const data = buildPlaceholderDataForLaudo(
      context,
      geoAnalysis
        ? { wave: geoAnalysis, complement: geoComplement ?? null }
        : undefined,
    );
    doc.render(data);

    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    }) as Buffer;

    const fileName = `laudo_${slug}_${laudoId ?? Date.now()}.docx`;
    return new NextResponse(buf as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (e) {
    console.error('POST /api/laudos/gerar-docx:', e);
    return NextResponse.json(
      { success: false, error: (e as Error).message ?? 'Erro ao gerar DOCX.' },
      { status: 500 }
    );
  }
}
