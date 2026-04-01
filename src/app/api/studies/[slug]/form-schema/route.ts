/**
 * GET /api/studies/[slug]/form-schema
 *
 * Retorna o schema do formulário do estudo (estático, cache ou gerado a partir do DOCX).
 * Query: source=static|docx|auto (default auto), refresh=1 para forçar reprocessamento.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStaticFormSchema, hasStaticFormSchema } from '@/lib/study-form-schema';
import { isStudyLinkedToTr } from '@/lib/termos-referencia-config';
import { getTermosReferenciaPathForStudy } from '@/lib/termos-referencia-config';
import path from 'path';
import { promises as fs } from 'fs';
import { extractDocxStructure } from '@/lib/docx-extract-structure';

type SourceMode = 'static' | 'docx' | 'auto';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const studySlug = slug?.toLowerCase().trim();
  if (!studySlug) {
    return NextResponse.json(
      { success: false, error: 'Slug do estudo é obrigatório.' },
      { status: 400 }
    );
  }

  const source = (request.nextUrl.searchParams.get('source') as SourceMode) || 'auto';
  const refresh = request.nextUrl.searchParams.get('refresh') === '1';

  const staticSchema = getStaticFormSchema(studySlug);
  const linked = isStudyLinkedToTr(studySlug);
  if (!staticSchema && !linked) {
    return NextResponse.json(
      { success: false, error: `Estudo "${studySlug}" não possui schema de formulário configurado.` },
      { status: 404 }
    );
  }

  if (source === 'static') {
    if (!staticSchema) {
      return NextResponse.json(
        { success: false, error: 'Schema estático não disponível para este estudo.' },
        { status: 404 }
      );
      }
    return NextResponse.json({
      success: true,
      schema: staticSchema,
      source: 'static',
    });
  }

  // source === 'docx' ou 'auto': tentar arquivo base na pasta TR
  const dirPath = getTermosReferenciaPathForStudy(studySlug);
  if (!dirPath) {
    if (!staticSchema) {
      return NextResponse.json(
        { success: false, error: 'Estudo sem vínculo com pasta de termos de referência.' },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      schema: staticSchema,
      source: 'static',
    });
  }

  let baseFilePath: string | null = null;
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const dotx = entries
      .filter((e) => e.isFile() && path.extname(e.name).toLowerCase() === '.dotx')
      .map((e) => e.name)
      .sort();
    const docx = entries
      .filter((e) => e.isFile() && path.extname(e.name).toLowerCase() === '.docx')
      .map((e) => e.name)
      .sort();
    const firstDotx = dotx[0];
    const firstDocx = docx[0];
    const fileName = firstDotx || firstDocx;
    if (fileName) baseFilePath = path.join(dirPath, fileName);
  } catch {
    // pasta inexistente ou sem permissão
  }

  if ((source === 'docx' || refresh) && baseFilePath) {
    try {
      const structure = await extractDocxStructure(baseFilePath);
      const schemaFromDocx = structureToSchema(studySlug, path.basename(baseFilePath), structure);
      return NextResponse.json({
        success: true,
        schema: schemaFromDocx,
        source: 'docx',
      });
    } catch (e) {
      console.error('form-schema: extractDocxStructure failed', e);
      if (source === 'docx') {
        return NextResponse.json(
          { success: false, error: 'Falha ao extrair estrutura do documento base.' },
          { status: 500 }
        );
      }
      // auto: fallback para estático
    }
  }

  if (staticSchema) {
    return NextResponse.json({
      success: true,
      schema: staticSchema,
      source: 'static',
    });
  }
  return NextResponse.json(
    { success: false, error: 'Nenhum documento base (.dotx/.docx) encontrado na pasta vinculada e sem schema estático.' },
    { status: 404 }
  );
}

/**
 * Converte estrutura bruta (placeholders + headings) em schema mínimo.
 */
function structureToSchema(
  studySlug: string,
  sourceFile: string,
  structure: { placeholders: string[]; headings: { level: number; text: string }[] }
): import('@/lib/study-form-schema').StudyFormSchema {
  const sections: import('@/lib/study-form-schema').Section[] = [];
  const seenPlaceholders = new Set<string>();

  for (const h of structure.headings) {
    sections.push({
      id: h.text
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 40) || `section_${sections.length}`,
      title: h.text,
      fields: [],
    });
  }

  for (const ph of structure.placeholders) {
    const normalized = ph.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    if (!normalized || seenPlaceholders.has(normalized)) continue;
    seenPlaceholders.add(normalized);
    const sectionId = sections.length ? sections[sections.length - 1].id : 'dados';
    let sec = sections.find((s) => s.id === sectionId);
    if (!sec) {
      sec = { id: 'dados', title: 'Dados', fields: [] };
      sections.push(sec);
    }
    if (!sec.fields) sec.fields = [];
    sec.fields.push({
      id: normalized,
      label: ph,
      type: 'string',
      required: false,
    });
  }

  if (sections.length === 0 && structure.placeholders.length > 0) {
    sections.push({
      id: 'dados',
      title: 'Dados',
      fields: structure.placeholders.slice(0, 50).map((ph) => ({
        id: ph.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, ''),
        label: ph,
        type: 'string' as const,
        required: false,
      })),
    });
  }

  return {
    version: '1.0',
    studySlug,
    sourceFile,
    processedAt: new Date().toISOString(),
    sections,
  };
}
